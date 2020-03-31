import BaseService from "./baseService";
import { Redis } from "ioredis";
import { Message, IAppConfiguration, Repository } from "./types";
import { nameof } from "./utils";

export default class QueueManager extends BaseService {
    repo: Repository;
    private processingTimeout: number;

    constructor(queueName: string, redis: Redis, repo: Repository, config?: IAppConfiguration) {
        super(queueName, redis);

        if (typeof config === "undefined" || typeof config.processingTimeout === "undefined") {
            throw Error(`${nameof<IAppConfiguration>("processingTimeout")}`);
        }

        this.repo = repo;
        this.processingTimeout = config.processingTimeout;
    }

    start(): void {
        const timeOut = setInterval(async () => {
            return new Promise<string>(async (res, rej) => {
                try {
                    console.debug(`Processing the "${this.queueName}" queue...`);

                    var messageIds = await this.redis.lrange(this.processingIds, 0, -1);

                    messageIds.forEach(async messageIdAsStr => {
                        const messageId = parseInt(messageIdAsStr);
                        const messageResourceName = this.getMessageResourceName(messageId);
                        const dateTimeAsStr = await this.redis.hget(messageResourceName, nameof<Message>("receivedDt"))

                        if (typeof dateTimeAsStr === "string") {
                            const unixEpochMillisec = new Date(dateTimeAsStr).getTime();
                            const subtractResult = new Date().getTime() - unixEpochMillisec;

                            if (subtractResult > this.processingTimeout  * 1000) {
                                console.debug(`Moving ${messageIdAsStr} message id older than ${this.processingTimeout} seconds to the ${this.publishedIds} queue...`);

                                const result = await this.repo.returnMessage(
                                    messageResourceName, new Date().toISOString(), this.processingIds,
                                    this.publishedIds, messageIdAsStr);

                                if (result) {
                                    const msg = `The ${messageIdAsStr} message id has successfully been moved from the ${this.processingIds} to the ${this.publishedIds} queue.`;
                                    console.debug(msg);
                                    this.repo.sendNotification(this.notifications, messageId);
                                } else {
                                    console.debug(`The ${messageIdAsStr} message id could not been moved from the ${this.processingIds} to the ${this.publishedIds} queue.`);
                                }

                            }

                        }

                    });
                } catch(e) {
                    rej(e);
                }

            });
        }, 10000);
    }
}