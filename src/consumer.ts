import { Redis } from "ioredis";
import BaseService from "./baseService";
import { Message, Statistics } from "./types";
import { nameof } from "./utils";
import RedisRepository from "./redisRepository";

export declare type fArgVoidAsync = (object: Message) => Promise<void>;

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
     * @param {fArgVoidAsync} callback - The function that receives a serialized message.
     * Should return void to identify a message as successfully processed.
     * Should throw error to notify the queue manager to re-handle the message.
     */
    async subscribe(callback: fArgVoidAsync) {
        await this.redisInSubscribedState.subscribe(this.notificationQueue);
        console.debug(`The consumer has successfully subscribed to new messages in the ${this.publishedQueue} queue.`);
        this.redisInSubscribedState.on("message", async () => {
            await this.processItemsInQueue(callback);
        });

        console.debug(`Checking messages in the ${this.publishedQueue} queue...`);
        let message = await this.repo.getMessage(this.publishedQueue, this.processingQueue, this.metricsQueue, this.getMessageResourceNamePrefix());
        while (message) {
            await this.processJob(message, callback);
            message = await this.repo.getMessage(this.publishedQueue, this.processingQueue, this.metricsQueue, this.getMessageResourceNamePrefix());
        }
    }

    private async processItemsInQueue(callback: fArgVoidAsync) {
        const message = await this.repo.getMessage(this.publishedQueue, this.processingQueue, this.metricsQueue, this.getMessageResourceNamePrefix());
        if (message) {
            await this.processJob(message, callback);
        }
    }

    private async processJob(message: Message, callback: fArgVoidAsync) {

        try {
            console.debug(`Start processing the ${message.id} message id.`);

            await callback(message);

            const messageResourceName = this.getMessageKey(message.id);

            await this.redis
                    .multi()
                    .del(messageResourceName)
                    .lrem(this.processingQueue, 0, message.id)
                    .hincrby(this.metricsQueue, nameof<Statistics>("numberOfMessagesDeleted"), 1)
                    .exec();


        } catch (error) {
            console.error(error);
        }
    }
}
