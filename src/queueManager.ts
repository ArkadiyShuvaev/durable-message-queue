import BaseService from "./baseService";
import { Redis } from "ioredis";
import { MessageMetaData, IAppConfiguration, Repository } from "./types";
import { nameof } from "./utils";

export default class QueueManager extends BaseService {
    repo: Repository;
    private processingTimeoutMilliseconds: number;
    
    constructor(queueName: string, redis: Redis, repo: Repository, config?: IAppConfiguration) {
        super(queueName, redis);

        if (typeof config === "undefined" || typeof config.processingTimeout === "undefined") {
            throw Error(`${nameof<IAppConfiguration>("processingTimeout")}`);
        }

        this.repo = repo;
        this.processingTimeoutMilliseconds = config.processingTimeout * 1000;
    }

    start(): void {
        const timeOut = setInterval(async () => {
            return new Promise<string>(async (res, rej) => {
                try {
                    console.debug(`Processing the "${this.queueName}" queue...`);

                    var messageIds = await this.redis.lrange(this.processingQueue, 0, -1);
                    
                    messageIds.forEach(async messageId => {
                        const messageKey = this.getDataKeyByJobId(messageId.toString());                
                        const dateTimeAsStr = await this.redis.hget(messageKey, nameof<MessageMetaData>("createdDt"))
                        
                        if (typeof dateTimeAsStr === "string") {                
                            const dateAsInt = parseInt(dateTimeAsStr);                    
                            const subtractResult = new Date().getTime() - dateAsInt;
                            
                            if (subtractResult > this.processingTimeoutMilliseconds) {
                                console.debug(`Moving element older than ${this.processingTimeoutMilliseconds/1000} seconds: ${new Date(dateAsInt)} to the ${this.publishedQueue} queue...`);
                                
                                const result = await this.repo.moveItemBackToQueue(
                                    messageKey, new Date().getTime(), this.processingQueue,
                                    this.publishedQueue, messageId);

                                if (result) {
                                    console.debug(`The ${messageId} message id has successfully been moved from the ${this.processingQueue} to the ${this.publishedQueue} queue.`);
                                } else {
                                    console.debug(`The ${messageId} message id could not been moved from the ${this.processingQueue} to the ${this.publishedQueue} queue.`);
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