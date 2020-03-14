import BaseService from "./baseService";
import { Redis } from "ioredis";
import { QueueData } from "./types";
import { nameof } from "./utils";

export default class QueueManager extends BaseService {
    private processTimeoutMilliseconds: number;
    
    /**
     *
     */
    constructor(queueName: string, redis: Redis) {
        super(queueName, redis);
        this.processTimeoutMilliseconds = 60*15*1000; // 15 minutes
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
                    
                    if (subtractResult > this.processTimeoutMilliseconds) {
                        console.log(`Moving element older than ${this.processTimeoutMilliseconds/1000} seconds: ${new Date(dateAsInt)} to the ${this.publishedQueue} queue...`);
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