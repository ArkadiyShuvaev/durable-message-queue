import { promises as fs } from "fs";
import { Redis } from "ioredis";
import {Repository, Message, Statistics, MessageMetadata} from "./types";
import { nameof } from "./utils";

export default class RedisRepository implements Repository {

    private redis: Redis;
    private moveMessageToDeadQueueLuaScript: string | undefined;
    private moveMessageToPublishedQueueLuaScript: string | undefined;
    private getMessageFromPublishedQueueLuaScript: string | undefined;
    private readonly moveMessageToDeadQueueFileName = "src/lua-scripts/moveMessageToDeadQueue.lua";
    private readonly moveMessageToPublishedQueueFileName = "src/lua-scripts/moveMessageToPublishedQueue.lua";
    private readonly getMessageFromPublishedQueueFileName = "src/lua-scripts/getMessageFromPublishedQueue.lua";

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async getMessage(moveFrom: string, moveTo: string, metricsQueue: string, messageResourceNamePrefix: string): Promise<Message> {
        return new Promise(async (res, rej) => {
            try {

                let result: object | undefined = undefined;

                const luaScript = await this.getMessageFromQueueScript();
                const now = new Date().toISOString();
                const array = await this.redis.eval(luaScript, 4,
                    moveFrom, moveTo, messageResourceNamePrefix, metricsQueue,
                    nameof<Statistics>("numberOfMessagesReceived"),
                    nameof<Message>("receiveCount"), nameof<Message>("receivedDt"),
                    nameof<Message>("updatedDt"), now, now);

                if (array) {
                    let result: any = {};
                    for (let idx = 0; idx < array.length; idx = idx + 2) {

                        result[array[idx]] = array[idx+1];
                    }

                    res(<Message><unknown>result);
                }

                res(result);

            } catch (err) {
                rej(err);
            }
        });
    }

    async getMessageMetadata(messageFullName: string): Promise<MessageMetadata> {
        return new Promise(async (res, rej) => {
            try {

                let result: object | undefined = undefined;

                const array = await this.redis.hmget(messageFullName,
                        nameof<Message>("id"), nameof<Message>("createdDt"),
                        nameof<Message>("receivedDt"), nameof<Message>("updatedDt"), nameof<Message>("receiveCount"));

                if (array) {

                    const result: MessageMetadata = {
                        id: array[0] === null ? 0 : parseInt(array[0]),
                        createdDt: array[1] === null ? "" : array[1],
                        receivedDt: array[2] === null ? undefined : array[2],
                        updatedDt: array[3] === null ? "" : array[3],
                        receiveCount: array[4] === null ? 0 : parseInt(array[4])
                    }

                    res(result);
                }

                res(result);

            } catch (err) {
                rej(err);
            }
        });
    }

    async moveToPublishedQueue(messageFullName: string, moveFrom: string, moveTo: string,
            metricsQueue: string, updatedDt: string, messageId: number): Promise<boolean> {
        return new Promise(async (res, rej) => {
            try {
                const luaScript = await this.getMoveMessageToPublishedQueueScript();
                const result:boolean = await this.redis.eval(luaScript, 4,
                    messageFullName, moveFrom, moveTo, metricsQueue,
                    nameof<Statistics>("numberOfMessagesReturned"), nameof<Message>("receivedDt"),
                    nameof<Message>("updatedDt"), updatedDt, messageId);

                return res(result);

            } catch (error) {
                rej(error)
            }
        });
    }

    moveToDeadQueue(messageKey: string, deadMessageKey: string, processingQueue: string,
            metricsQueue: string, updatedDt: string, messageId: number): Promise<boolean> {
        return new Promise(async (res, rej) => {
            try {
                const luaScript = await this.getMoveMessageToDeadQueueScript();
                const result:boolean = await this.redis.eval(luaScript, 4,
                    messageKey, deadMessageKey, processingQueue, metricsQueue,
                    nameof<Statistics>("numberOfMessagesDead"), nameof<Message>("updatedDt"),
                    updatedDt, messageId);

                return res(result);

            } catch (error) {
                rej(error)
            }
        });
    }

    async sendNotification(notificationQueue: string, messageId: number): Promise<number> {
        return await this.redis.publish(notificationQueue, messageId.toString());
    }

    async addMessage(messageFullName: string, addTo:string, metricsQueue: string, message: Message): Promise<Array<[Error | null, any]>> {
        return await this.redis
            .multi()
            .hset(messageFullName, nameof<Message>("id"), message.id)
            .hset(messageFullName, nameof<Message>("payload"), message.payload)
            .hset(messageFullName, nameof<Message>("createdDt"), message.createdDt)
            .hset(messageFullName, nameof<Message>("updatedDt"), message.updatedDt)
            .hset(messageFullName, nameof<Message>("receiveCount"), message.receiveCount)
            .lpush(addTo, message.id)
            .hincrby(metricsQueue, nameof<Statistics>("numberOfMessagesSent"), 1)
            .exec();
    }

    private async getMessageFromQueueScript(): Promise<string> {

        return new Promise<string>(async (res, rej) => {
            try {
                if (!this.getMessageFromPublishedQueueLuaScript) {
                    const data = await fs.readFile(this.getMessageFromPublishedQueueFileName); //  10.0.0 + is required
                    this.getMessageFromPublishedQueueLuaScript = Buffer.from(data).toString("utf8");
                }
                return res(this.getMessageFromPublishedQueueLuaScript);

            } catch(err) {
                rej(err);
            }
        });
    }

    private async getMoveMessageToPublishedQueueScript(): Promise<string> {
        return new Promise<string>(async (res, rej) => {
            try {
                if (!this.moveMessageToPublishedQueueLuaScript) {
                    const data = await fs.readFile(this.moveMessageToPublishedQueueFileName); //  10.0.0 + is required
                    this.moveMessageToPublishedQueueLuaScript = Buffer.from(data).toString("utf8");
                }
                return res(this.moveMessageToPublishedQueueLuaScript);

            } catch(err) {
                rej(err);
            }
        });
    }

    private async getMoveMessageToDeadQueueScript(): Promise<string> {
        return new Promise<string>(async (res, rej) => {
            try {
                if (!this.moveMessageToDeadQueueLuaScript) {
                    const data = await fs.readFile(this.moveMessageToDeadQueueFileName); //  10.0.0 + is required
                    this.moveMessageToDeadQueueLuaScript = Buffer.from(data).toString("utf8");
                }
                return res(this.moveMessageToDeadQueueLuaScript);

            } catch(err) {
                rej(err);
            }
        });
    }
}
