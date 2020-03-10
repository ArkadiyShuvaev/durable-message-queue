import { Redis } from "ioredis";
import BaseService from "./baseService";
import { QueueData } from "./types";

export declare type fArgVoid = (object: string) => void;

export default class Consumer extends BaseService {
    
    redisInSubscribedState: Redis;
    
    constructor(queueName: string, redis: Redis, redisInSubscribedState: Redis) {
        super(queueName, redis);

        this.redisInSubscribedState = redisInSubscribedState;
    }

    async subscribe(callback: fArgVoid) {        
        try {
            await this.redisInSubscribedState.subscribe(this._notificationQueue);
            this.redisInSubscribedState.on("message", this.handler(callback));    
        } catch (error) {
            console.log(error);
            throw(error);
        }
    }

    private handler(callback: fArgVoid): (...args: any[]) => void {
        return async () => {

            const jobId = await this._redis.rpoplpush(this._publishedQueue, this._processingQueue);
            const dataKey = this.getDataKeyByJobId(jobId);
            const obj = <QueueData><unknown>(await this._redis.hgetall(dataKey));

            callback(obj.payload);
        };
    }
}