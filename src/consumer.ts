import { Redis } from "ioredis";
import BaseService from "./baseService";
import { Message } from "./types";
import { nameof } from "./utils";
import RedisRepository from "./redisRepository";

export declare type fArgVoid = (object: Message) => void;

export default class Consumer extends BaseService {
    
    repo: RedisRepository;
    redisInSubscribedState: Redis;
    
    /**
     * Creates an instance of the consumer.
     * Once the client enters the subscribed state it is not supposed to issue any other commands, 
     * and the second Redis client is required.
     * @param {Redis} redisClient - The Redis client to handle messages.
     * @param {RedisRepository} redisRepository - The Redis repository.
     * @param {Redis} redisSubscribedClient - The Redis client to subscribe to new published messages.
    */
    constructor(queueName: string, redisRepository: RedisRepository, redisClient: Redis, redisSubscribedClient: Redis) {
        super(queueName, redisClient);
        
        this.repo = redisRepository;
        this.redisInSubscribedState = redisSubscribedClient;
    }

    /**
     * Starts consuming published messages.
     * @param {fArgVoid} callback - The function that recieves serialized messages.
     * Should return void to identify a message as successfuly processed.
     * Should throw error to notify the queue manager to re-handle the message.
     */
    async subscribe(callback: fArgVoid) {        
        await this.redisInSubscribedState.subscribe(this.notifications);
        this.redisInSubscribedState.on("message", async () => {
            await this.processItemsInQueue(callback);
        });

        let message = await this.repo.getMessage(this.publishedIds, this.processingIds, this.getMessageResourceNamePrexix());
        while (message) {
            await this.processJob(message, callback);
            message = await this.repo.getMessage(this.publishedIds, this.processingIds, this.getMessageResourceNamePrexix());
        }
    }   

    private async processItemsInQueue(callback: fArgVoid) {
        const message = await this.repo.getMessage(this.publishedIds, this.processingIds, this.getMessageResourceNamePrexix());
        if (message) {
            await this.repo.getMessage(this.publishedIds, this.processingIds, this.getMessageResourceNamePrexix());
        }
    }

    private async processJob(message: Message, callback: fArgVoid) {
        
        try {
            callback(message);

            const messageResourceName = this.getMessageResourceName(message.id);

            await this.redis
                    .multi()
                    .del(messageResourceName)
                    .lrem(this.processingIds, 0, message.id)
                    .exec();


        } catch (error) {
            console.error(error);
        }
    }
}
