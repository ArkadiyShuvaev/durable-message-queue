import { Redis } from "ioredis";

export default class BaseService {
    protected messageUniqId: string;
    protected queueName: string;
    private messageQueue: string;
    protected publishedQueue: string;
    protected processingQueue: string;
    protected notificationQueue: string;
    protected metricsQueue: string;
    protected deadQueue: string;

    constructor(queueName: string) {
        this.queueName = queueName;
        this.messageUniqId = `dmq:${queueName}:messageUniqId`;
        this.messageQueue = `dmq:${queueName}:message`;
        this.publishedQueue = `dmq:${queueName}:published`;
        this.processingQueue = `dmq:${queueName}:processing`;
        this.notificationQueue = `dmq:${queueName}:notification`;
        this.metricsQueue = `dmq:${queueName}:metrics`;
        this.deadQueue = `dmq:${queueName}:deadMessage`;
    }

    /**
     * Returns message key. E.g. "createUser:message:2".
     * @param {number} messageId - The messageId. E.g. 2.
     */
    protected getMessageKey(messageId: number): string {
        return `${this.getMessageResourceNamePrefix()}${messageId}`;
    }

    /**
     * Returns dead message key. E.g. "createUser:deadMessage:2".
     * @param {number} messageId - The messageId. E.g. 2.
     */
    protected getDeadMessageKey(messageId: number): string {
        return `${this.deadQueue}:${messageId}`;
    }

    /**
     * Returns prefix message key. E.g. "createUser:message:".
     * @param {number} messageId - The messageId. E.g. 2.
     */
    protected getMessageResourceNamePrefix(): string {
        return `${this.messageQueue}:`;
    }
}
