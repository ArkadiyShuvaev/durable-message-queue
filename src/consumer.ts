import { Redis } from "ioredis";
import BaseService from "./baseService";
import { MessageMetaData } from "./types";
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
        await this.redisInSubscribedState.subscribe(this.notificationQueue);
        this.redisInSubscribedState.on("message", async () => {
            await this.processItemsInQueue(callback);
        });

        let jobId = await this.redis.rpoplpush(this.publishedQueue, this.processingQueue);
        while (jobId) {
            await this.processJob(jobId, callback);
            jobId = await this.redis.rpoplpush(this.publishedQueue, this.processingQueue);
        }
    }   

    private async processItemsInQueue(callback: fArgVoid) {
        const jobId = await this.redis.rpoplpush(this.publishedQueue, this.processingQueue);
        if (jobId) {
            await this.processJob(jobId, callback);
        }
    }

    private async processJob(jobId: string, callback: fArgVoid) {
        const dataKey = this.getDataKeyByJobId(jobId);
        const obj = <MessageMetaData><unknown>(await this.redis.hgetall(dataKey));
        if (!obj) {
            console.error(`Object cannot be found using the ${dataKey} dataKey.`);
            return;
        }

        try {
            callback(obj.payload);
            
            await this.redis
                    .multi()
                    .hdel(dataKey, nameof<MessageMetaData>("createdDt"), nameof<MessageMetaData>("payload"))
                    .lrem(this.processingQueue, 0, jobId)
                    .exec();

        } catch (error) {
            console.error(error);
        }
    }
}
