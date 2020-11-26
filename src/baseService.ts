export default class BaseService {

    /**
     * Gets a redis key to get or set a message unique identifier.
    */
    protected readonly messageUniqId: string;
    protected readonly queueName: string;
    private readonly messageQueue: string;

    /**
     * Returns a redis key for list that stores published messages identifiers.
     */
    protected readonly publishedQueue: string;

    /**
     * Returns a redis list key that stores processed message identifiers.
     */
    protected readonly processingQueue: string;
    protected readonly notificationQueue: string;
    protected readonly updateQueueChannel: string;
    protected readonly metricsQueue: string;
    protected readonly deadQueue: string;
    //protected readonly allQueues: string;

    constructor(queueName: string) {
        this.queueName = queueName;
        this.messageUniqId = `dmq:${queueName}:messageUniqId`;
        this.messageQueue = `dmq:${queueName}:message`;
        this.publishedQueue = `dmq:${queueName}:published`;
        this.processingQueue = `dmq:${queueName}:processing`;
        this.notificationQueue = `dmq:${queueName}:notification`;
        this.metricsQueue = `dmq:${queueName}:metrics`;
        this.deadQueue = `dmq:${queueName}:deadMessage`;
        //this.allQueues = `dmq:allQueues`;
        this.updateQueueChannel = `dmq:updateQueueChannel`
    }

    /**
     * Returns a message key. E.g. "createUser:message:2".
     * @param {number} messageId - The messageId. E.g. 2.
     */
    protected getMessageKey(messageId: number): string {
        return `${this.getMessageResourceNamePrefix()}${messageId}`;
    }

    /**
     * Returns a dead message key. E.g. "createUser:deadMessage:2".
     * @param {number} messageId - The messageId. E.g. 2.
     */
    protected getDeadMessageKey(messageId: number): string {
        return `${this.deadQueue}:${messageId}`;
    }

    /**
     * Returns a message key prefix. E.g. "createUser:message:".
     * @param {number} messageId - The messageId. E.g. 2.
     */
    protected getMessageResourceNamePrefix(): string {
        return `${this.messageQueue}:`;
    }
}
