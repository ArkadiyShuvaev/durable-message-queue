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
     * and the second Redis client is required.
     * @param {Redis} redisClient - The Redis client to handle messages.
     * @param {Redis} redisSubscribedClient - The Redis client to subscribe to new published messages.
    */
    constructor(queueName: string, redisClient: Redis, redisSubscribedClient: Redis) {
        super(queueName, redisClient);

        this.redisInSubscribedState = redisSubscribedClient;
    }

    /**
     * Starts consuming published messages.
     * @param {fArgVoid} callback - The function that recieves serialized messages.
     * Should return void to identify a message as successfuly processed.
     * Should throw error to notify the queue manager to re-handle the message.
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