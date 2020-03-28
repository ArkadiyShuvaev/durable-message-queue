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
                    
                    messageIds.forEach(async messageId => {
                        const messageResourceName = this.getMessageResourceName(parseInt(messageId));                
                        const dateTimeAsStr = await this.redis.hget(messageResourceName, nameof<Message>("receivedDt"))
                        
                        if (typeof dateTimeAsStr === "string") {                
                            const dateAsInt = parseInt(dateTimeAsStr);                    
                            const subtractResult = new Date().getTime() - dateAsInt;
                            
                            if (subtractResult > this.processingTimeout  * 1000) {
                                console.debug(`Moving ${messageId} message id older than ${this.processingTimeout} seconds to the ${this.publishedIds} queue...`);
                                
                                const result = await this.repo.moveItemBackToQueue(
                                    messageResourceName, new Date().getTime(), this.processingIds,
                                    this.publishedIds, messageId);

                                if (result) {
                                    console.debug(`The ${messageId} message id has successfully been moved from the ${this.processingIds} to the ${this.publishedIds} queue.`);
                                } else {
                                    console.debug(`The ${messageId} message id could not been moved from the ${this.processingIds} to the ${this.publishedIds} queue.`);
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