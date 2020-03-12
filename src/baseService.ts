import { Redis } from "ioredis";

export default class BaseService {
    
    protected redis: Redis;
    protected keyQueue: string;
    protected dataQueue: string;
    protected publishedQueue: string;
    protected processingQueue: string;
    protected notificationQueue: string;
    
    /**
     *
     */
    constructor(queueName: string, redis: Redis) {
        this.redis = redis;
        this.keyQueue = `${queueName}:keys`;
        this.dataQueue = `${queueName}:data`;
        this.publishedQueue = `${queueName}:published`;
        this.processingQueue = `${queueName}:processing`;
        this.notificationQueue = `${queueName}:notifications`;      
          
    }

    protected getDataKeyByJobId(jobId: string): string {
        return `${this.dataQueue}:${jobId}`;
    }
}
