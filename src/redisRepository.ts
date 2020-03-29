import { promises as fs } from "fs";
import { Redis } from "ioredis";
import {Repository, Message} from "./types";
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

    /**
     * Gets a message from the published queue to process.
     * @param {string} messageResourceNamePrefix - The prefix for the Redis key that stores
     * all message keys ('payload' key, 'createdDt' key, 'receivedDt' key, etc) without a message id.
     * E.g. 'userRegistration:message:'
     */
    async getMessage(moveFrom: string, moveTo: string, messageResourceNamePrefix: string): Promise<Message> {
        return new Promise(async (res, rej) => {
            try {

                let result: object | undefined = undefined;

                const luaScript = await this.getMessageFromQueueLuaScript();
                const now = new Date().getTime();
                const array = await this.redis.eval(luaScript, 3,
                    moveFrom, moveTo, messageResourceNamePrefix,
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

    async moveItemBackToQueue(messageResourceName: string, receivedDt: number, moveFrom: string, moveTo: string, messageId: string): Promise<boolean> {
        return new Promise(async (res, rej) => {
            try {
                const luaScript = await this.returnMessageToQueueLuaScript();
                const result:boolean = await this.redis.eval(luaScript, 3,
                    messageResourceName, moveFrom, moveTo, nameof<Message>("receivedDt"),
                    nameof<Message>("updatedDt"), new Date().getTime(), messageId);

                return res(result);

            } catch (error) {
                rej(error)
            }
        });
    }

    /**
     * Posts a message to the notification channel.
     */
    async sendNotification(notificationQueue: string, message: string): Promise<number> {
        return await this.redis.publish(notificationQueue, message);
    }

    async addMessage(messageResourceName: string, addTo:string, message: Message): Promise<Array<[Error | null, any]>> {
        return await this.redis
            .multi()
            .hset(messageResourceName, nameof<Message>("id"), message.id)
            .hset(messageResourceName, nameof<Message>("payload"), message.payload)
            .hset(messageResourceName, nameof<Message>("createdDt"), message.createdDt)
            .hset(messageResourceName, nameof<Message>("updatedDt"), message.updatedDt)
            .hset(messageResourceName, nameof<Message>("receiveCount"), message.receiveCount)
            .lpush(addTo, message.id)
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
