import { promises as fs } from "fs";
import { Redis } from "ioredis";
import {Repository, Message, Statistics} from "./types";
import { nameof } from "./utils";

export default class RedisRepository implements Repository {

    private redis: Redis;
    private _returnMessageToQueueLuaScript: string | undefined;
    private _getMessageFromQueueLuaScript: string | undefined;
    private readonly returnMessageToQueueFileName = "src/lua-scripts/returnMessageToQueue.lua";
    private readonly getMessageFromQueueFileName = "src/lua-scripts/getMessageFromQueue.lua";

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async getMessage(moveFrom: string, moveTo: string, statisticsQueue: string, messageResourceNamePrefix: string): Promise<Message> {
        return new Promise(async (res, rej) => {
            try {

                let result: object | undefined = undefined;

                const luaScript = await this.getMessageFromQueueLuaScript();
                const now = new Date().toISOString();
                const array = await this.redis.eval(luaScript, 4,
                    moveFrom, moveTo, messageResourceNamePrefix, statisticsQueue,
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

    async returnMessage(messageFullName: string, updatedDt: string, moveFrom: string, moveTo: string, messageId: string): Promise<boolean> {
        return new Promise(async (res, rej) => {
            try {
                const luaScript = await this.returnMessageToQueueLuaScript();
                const result:boolean = await this.redis.eval(luaScript, 3,
                    messageFullName, moveFrom, moveTo, nameof<Message>("receivedDt"),
                    nameof<Message>("updatedDt"), updatedDt, messageId);

                return res(result);

            } catch (error) {
                rej(error)
            }
        });
    }

    async sendNotification(notificationQueue: string, messageId: number): Promise<number> {
        return await this.redis.publish(notificationQueue, messageId.toString());
    }

    async addMessage(messageFullName: string, addTo:string, statisticsQueue: string, message: Message): Promise<Array<[Error | null, any]>> {
        return await this.redis
            .multi()
            .hset(messageFullName, nameof<Message>("id"), message.id)
            .hset(messageFullName, nameof<Message>("payload"), message.payload)
            .hset(messageFullName, nameof<Message>("createdDt"), message.createdDt)
            .hset(messageFullName, nameof<Message>("updatedDt"), message.updatedDt)
            .hset(messageFullName, nameof<Message>("receiveCount"), message.receiveCount)
            .lpush(addTo, message.id)
            .hincrby(statisticsQueue, nameof<Statistics>("numberOfMessagesSent"), 1)
            .exec();
    }

    private async getMessageFromQueueLuaScript(): Promise<string> {

        return new Promise<string>(async (res, rej) => {
            try {
                if (!this._getMessageFromQueueLuaScript) {
                    const data = await fs.readFile(this.getMessageFromQueueFileName); //  10.0.0 + is required
                    this._getMessageFromQueueLuaScript = Buffer.from(data).toString("utf8");
                }
                return res(this._getMessageFromQueueLuaScript);

            } catch(err) {
                rej(err);
            }
        });
    }

    private async returnMessageToQueueLuaScript(): Promise<string> {
        return new Promise<string>(async (res, rej) => {
            try {
                if (!this._returnMessageToQueueLuaScript) {
                    const data = await fs.readFile(this.returnMessageToQueueFileName); //  10.0.0 + is required
                    this._returnMessageToQueueLuaScript = Buffer.from(data).toString("utf8");
                }
                return res(this._returnMessageToQueueLuaScript);

            } catch(err) {
                rej(err);
            }
        });
    }
}
