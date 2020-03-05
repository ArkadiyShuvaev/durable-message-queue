import { Redis } from "ioredis";
import BaseService from "./baseService";

export declare type fArgVoid = (object: Object) => void;

export default class Consumer extends BaseService {
    
    constructor(queueName: string, redis: Redis) {
        super(queueName, redis);
    }

    async subscribe(callback: fArgVoid) {
        
        await this._redis.subscribe(this._notificationQueue);
        this._redis.on(this._notificationQueue, this.handler(callback));
        
        
    }


    

    private handler(callback: fArgVoid): (...args: any[]) => void {
        return async () => {

            const jobId = await this._redis.rpoplpush(this._publishedQueue, this._processingQueue);
            const dataKey = this.getDataKeyByJobId(jobId);
            
            const obj = await this._redis.hgetall(dataKey);

            //const obj = {};
            callback(obj);
        };
    }
}