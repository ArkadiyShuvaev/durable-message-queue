import Debug from "debug";
import { Redis } from "ioredis";
import BaseService from "./baseService";
import { Message, Repository } from "./types";

export default class Producer extends BaseService {
    private redis: Redis;
    private repo: Repository;
    private error: Debug.Debugger;
    private debug: Debug.Debugger;

    constructor(queueName: string, repo:Repository, redis: Redis) {
        super(queueName);
        this.redis = redis;
        this.repo = repo;

        this.error = Debug(`${BaseService.appPrefix}:producer:error`);
        this.debug = Debug(`${BaseService.appPrefix}:producer:debug`);
        this.debug.log = console.log.bind(console);
    }

    /**
     * Sends a message to the queue and creates the consumer notification event to notify consumers.
     * @param {string} messageRequest - The serialized object.
     */
    public send(messageRequest: string): Promise<void> {

        return new Promise<void>(async (res, rej) => {
            try {

                const messageId = await this.redis.incr(this.messageUniqId);
                const messageResourceName = this.getMessageKey(messageId);

                const now = new Date().toISOString();
                const message: Message = {
                    id: messageId,
                    createdDt: now,
                    updatedDt: now,
                    payload: messageRequest,
                    receiveCount: 0
                };

                await this.repo.addMessage(messageResourceName, this.publishedQueue, this.metricsQueue, message);

                this.debug(`The producer sent a message ${messageId} to the ${this.publishedQueue} queue.`);
                await this.repo.sendNotification(this.notificationQueue, messageId);
                this.debug(`The '${messageId}' message id has successfully been added into the queue to process.`);

                res();

            } catch (e) {
                this.error(e);
                rej(e);
            }
        });
    }
}
