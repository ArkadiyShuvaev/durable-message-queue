import { Redis } from "ioredis";
import BaseService from "./baseService";
import ActionResult from "./actionResult";
import { Message, Repository } from "./types";
import { nameof } from "./utils";


export default class Producer extends BaseService {
    private redis: Redis;
    private repo: Repository;

    constructor(queueName: string, repo:Repository, redis: Redis) {
        super(queueName);
        this.redis = redis;
        this.repo = repo;
    }

    /**
     * Sends the message to the queue and creates the consumer notification event.
     * @param {string} messageRequest - The serialized object.
     */
    public send(messageRequest: string): Promise<ActionResult> {

        return new Promise<ActionResult>(async (res, rej) => {
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

                console.debug(`The producer sent a message ${messageId} to the ${this.publishedQueue} queue.`);
                await this.repo.sendNotification(this.notificationQueue, messageId);

                res({
                    isSuccess: true,
                    message: `The '${messageId}' message id has successfully been added into the queue to process.`
                });

            } catch (e) {
                rej({
                    isSuccess: false,
                    message: e
                });
            }
        });
    }
}
