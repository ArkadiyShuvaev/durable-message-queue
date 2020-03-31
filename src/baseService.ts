import { Redis } from "ioredis";

export default class BaseService {

    protected redis: Redis;
    protected messageUniqId: string;
    protected queueName: string;
    private messageQueue: string;
    protected publishedIds: string;
    protected processingIds: string;
    protected notifications: string;
    protected statistics: string;

    /**
     *
     */
    constructor(queueName: string, redis: Redis) {
        this.redis = redis;
        this.queueName = queueName;
        this.messageUniqId = `dmq:${queueName}:messageUniqId`;
        this.messageQueue = `dmq:${queueName}:message`;
        this.publishedIds = `dmq:${queueName}:publishedIds`;
        this.processingIds = `dmq:${queueName}:processingIds`;
        this.notifications = `dmq:${queueName}:notifications`;
        this.statistics = `dmq:${queueName}:statistics`;
    }

    protected getMessageResourceName(messageId: number): string {
        return `${this.getMessageResourceNamePrexix()}${messageId}`;
    }

    protected getMessageResourceNamePrexix(): string {
        return `${this.messageQueue}:`;
    }
}
