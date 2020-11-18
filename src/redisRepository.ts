import { Redis } from "ioredis";
import {Repository, Message, Metrics, MessageMetadata} from "./types";
import { nameof } from "./utils";
import LuaScripts from "./luaScripts";

export default class RedisRepository implements Repository {
    private redis: Redis;

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async getMessage(moveFrom: string, moveTo: string, metricsQueue: string, messageResourceNamePrefix: string): Promise<Message> {
        return new Promise(async (res, rej) => {
            try {

                let result: object | undefined = undefined;

                const luaScript = await LuaScripts.getMessageFromPublishedQueue();
                const now = new Date().toISOString();
                const array = await this.redis.eval(luaScript, 4,
                    moveFrom, moveTo, messageResourceNamePrefix, metricsQueue,
                    nameof<Metrics>("numberOfMessagesReceived"),
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
                const luaScript = await LuaScripts.getMoveMessageToPublishedQueue();
                const result:boolean = await this.redis.eval(luaScript, 4,
                    messageFullName, moveFrom, moveTo, metricsQueue,
                    nameof<Metrics>("numberOfMessagesReturned"), nameof<Message>("receivedDt"),
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
                const luaScript = await LuaScripts.getMoveMessageToDeadQueue();
                const result:boolean = await this.redis.eval(luaScript, 4,
                    messageKey, deadMessageKey, processingQueue, metricsQueue,
                    nameof<Metrics>("numberOfMessagesDead"), nameof<Message>("updatedDt"),
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
            .hincrby(metricsQueue, nameof<Metrics>("numberOfMessagesSent"), 1)
            .exec();
    }

    async getQueues(): Promise<Array<string>> {
        return new Promise(async (res, rej) => {
            const resultObj = await this.redis.scan(0, "MATCH", "dmq:*:metrics", "COUNT", 10000);
            return res(resultObj[1]);
        });
    }

    async getMetrics(key: string) : Promise<Metrics> {
        return new Promise(async (res, rej) => {
            const array = await this.redis.hgetall(key);
            res((array as unknown) as Metrics);
        });
    }
}
