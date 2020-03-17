import BaseService from "./baseService";
import { Redis } from "ioredis";
import { QueueData, IAppConfiguration } from "./types";
import { nameof } from "./utils";

export default class QueueManager extends BaseService {
    private processingTimeoutMilliseconds: number;
    
    /**
     *
     */
    constructor(queueName: string, redis: Redis, config?: IAppConfiguration) {
        super(queueName, redis);

        if (typeof config === "undefined" || typeof config.processingTimeout === "undefined") {
            throw Error(`${nameof<IAppConfiguration>("processingTimeout")}`);
        }

        this.processingTimeoutMilliseconds = config.processingTimeout*1000;
    }

    start(): void {
        const timeOut = setInterval(async () => {
            console.log(`Processing the "${this.queueName}" queue...`);

            var jobIds = await this.redis.lrange(this.processingQueue, 0, -1);

            jobIds.forEach(async jobId => {
                const dataKey = this.getDataKeyByJobId(jobId.toString());                
                const dateAsStr = await this.redis.hget(dataKey, nameof<QueueData>("createdDt"))
                
                if (typeof dateAsStr === "string") {                
                    const dateAsInt = parseInt(dateAsStr);                    
                    const subtractResult = new Date().getTime() - dateAsInt;
                    
                    if (subtractResult > this.processingTimeoutMilliseconds) {
                        console.log(`Moving element older than ${this.processingTimeoutMilliseconds/1000} seconds: ${new Date(dateAsInt)} to the ${this.publishedQueue} queue...`);
                        await this.redis
                            .multi()
                            .hset(dataKey, "updatedDt", new Date().getTime())
                            .lrem(this.processingQueue, 0, jobId)
                            .lpush(this.publishedQueue, jobId)
                            .exec();
                    }

                }

            });

        }, 10000);
    }
}