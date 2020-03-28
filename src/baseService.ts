import { Redis } from "ioredis";

export default class BaseService {
    
    protected redis: Redis;
    protected messageUniqId: string;
    protected queueName: string;
    private messageQueue: string;
    protected publishedIds: string;
    protected processingIds: string;
    protected notifications: string;
    
    /**
     *
     */
    constructor(queueName: string, redis: Redis) {
        this.redis = redis;
        this.queueName = queueName;
        this.messageUniqId = `${queueName}:messageUniqId`;
        this.messageQueue = `${queueName}:message`;
        this.publishedIds = `${queueName}:publishedIds`;
        this.processingIds = `${queueName}:processingIds`;
        this.notifications = `${queueName}:notifications`;      
          
    }

    protected getMessageResourceName(messageId: number): string {
        return `${this.getMessageResourceNamePrexix()}${messageId}`;
    }

    protected getMessageResourceNamePrexix(): string {
        return `${this.messageQueue}:`;
    }
}
