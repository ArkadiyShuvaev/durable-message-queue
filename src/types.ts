import { RedisOptions } from "ioredis";

export interface MessageMetadata {
    id: number,
    createdDt: string,
    receivedDt?: string,
    receiveCount: number,
    updatedDt: string
}

export interface Message extends MessageMetadata {
    payload: string
}

export interface Metrics {
    numberOfMessagesSent: number,
    numberOfMessagesReceived: number,
    numberOfMessagesDeleted: number
    numberOfMessagesReturned: number
    numberOfMessagesDead: number
}

export interface Row {
    cells: Array<Cell>
}

export interface Cell {
    startIndex: number,
    value: string
}

export interface AppConfiguration extends RedisOptions {
    /**
     * @param {number} visibilityTimeout - Gets or sets a period of time in seconds during which the library prevents
     * other consumers from receiving and processing the message.  The default visibility timeout
     * for a message is 300 seconds (5 minutes).
     */
     visibilityTimeout?: number

     /**
      * @param {number} maxReceiveCount - Gets or sets the maximum number of receives that are allowed before the message
      * is moved to the dead-letter queue. If something goes wrong and the number of receives exceeds
      * the this value, the queue manager moves the message to the dead-letter queue. The default value is 3.
      */
     maxReceiveCount?: number

     /**
      * @param {number} monitorUpdateInterval - Gets or sets a period of time in seconds to update metrics of the queue monitor.
     * The default value is 60 seconds (1 minute).
      */
     monitorUpdateInterval?: number
}

export interface Repository {

    /**
     * Adds a message to the queue.
     * @param {string} messageFullName - The message full name (e.g. createUser:message:2)
     * @param {string} addTo - The queue name to add message to (e.g. createUser:published).
     * @param {string} metricsQueue - The queue name to add metrics (e.g. createUser:metrics).
     * @param {Message} message - The message to be add.
     */
    addMessage(messageFullName: string, addTo:string, metricsQueue: string, message: Message): Promise<Array<[Error | null, any]>>

    /**
     * Sends a message to the notification channel.
     * @param {string} addTo - The notification queue name (e.g. createUser:notifications).
     * @param {number} messageId - The message id that was processed (e.g. 2).
     */
    sendNotification(notificationQueue: string, messageId: number): Promise<number>;

    /**
     * Moves message from the processing to the published queue.
     * @param {string} messageFullName - The message full name (e.g. createUser:message:2)
     * @param {string} moveFrom - The queue name to move a message from (e.g. createUser:processing).
     * @param {string} moveTo - The queue name to move a message to (e.g. createUser:published).
     * @param {string} metricsQueue - The queue name to add metrics (e.g. createUser:metrics).
     * @param {string} receivedDt - The received date as the number of milliseconds since the Unix Epoch.
     * @param {number} messageId - The message id (e.g. 2).
     */
    moveToPublishedQueue(messageFullName: string, moveFrom: string, moveTo: string, metricsQueue: string,
        updatedDt: string, messageId: number): Promise<boolean>

    /**
     * Moves message to the dead queue.
     * @param {string} messageKey - The message key (e.g. createUser:message:2)
     * @param {string} deadMessageKey - The dead message key (e.g. createUser:deadMessage:2).
     * @param {string} processingQueue - The processing queue name where the message is removed from (e.g. createUser:processing).
     *                                      The message becomes unavailable for processing.
     * @param {string} metricsQueue - The queue name to add metrics (e.g. createUser:metrics).
     * @param {string} updatedDt - The received date as the number of milliseconds since the Unix Epoch.
     * @param {number} messageId - The message id (e.g. 2).
     */
    moveToDeadQueue(messageKey: string, deadMessageKey: string, processingQueue: string, metricsQueue: string,
        updatedDt: string, messageId: number): Promise<boolean>

    /**
     * Gets a message from the published queue to process.
     * @param {string} moveFrom - The queue name to move a message from (e.g. createUser:processing).
     * @param {string} moveTo - The queue name to move a message to (e.g. createUser:published).
     * @param {string} metricsQueue - The queue name to add metrics (e.g. createUser:metrics).
     * @param {string} messageResourceNamePrefix - The prefix for the Redis key that stores
     * all message keys ('payload' key, 'createdDt' key, 'receivedDt' key, etc) without a message id.
     * E.g. 'createUser:message:'
     */
    getMessage(moveFrom: string, moveTo:string, metricsQueue: string, messageQueuePrefix:string): Promise<Message | undefined>

    /**
     * Returns message metadata for a given reference.
     * @param {string} messageFullName - The message full name (e.g. createUser:message:2).
     */
    getMessageMetadata(messageFullName: string): Promise<MessageMetadata | undefined>

    /**
     * Returns a collection of queue names.
     */
    getQueues() : Promise<Array<string>>


    /**
     * Returns a collection of metrics for a given reference.
     */
    getMetrics(queueName: string) : Promise<Metrics>
}

export interface ActionResult {
    isSuccess: boolean,
    message: string
}