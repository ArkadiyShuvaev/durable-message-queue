import { Redis } from "ioredis";
import BaseService from "./baseService";
import { QueueData } from "./types";
import { nameof } from "./utils";

export declare type fArgVoid = (object: string) => void;

export default class Consumer extends BaseService {
    
    redisInSubscribedState: Redis;
    
    /**
     * Creates an instance of the consumer.
     * Once the client enters the subscribed state it is not supposed to issue any other commands, 
     * a second ready client is required.
    */
    constructor(queueName: string, redis: Redis, redisInSubscribedState: Redis) {
        super(queueName, redis);

        this.redisInSubscribedState = redisInSubscribedState;
    }

    /**
     * Subscribes the client to the specified channel.
     */
    async subscribe(callback: fArgVoid) {        
        try {
            await this.redisInSubscribedState.subscribe(this.notificationQueue);
            this.redisInSubscribedState.on("message", this.handler(callback));    
        } catch (error) {
            console.log(error);
            throw(error);
        }
    }   

    private handler(callback: fArgVoid): (...args: any[]) => void {
        return async () => {

            const processedJobId = await this.redis.rpoplpush(this.publishedQueue, this.processingQueue);
            const dataKey = this.getDataKeyByJobId(processedJobId);
            const obj = <QueueData><unknown>(await this.redis.hgetall(dataKey));

            callback(obj.payload);

            await this.redis
                    .multi()
                    .hdel(dataKey, nameof<QueueData>("createdDt"), nameof<QueueData>("payload"))
                    .lrem(this.processingQueue, 0, processedJobId)                    
                    .exec();
        };
    }
}