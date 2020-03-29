import { RedisOptions } from "ioredis";

export interface Message {
    id: number,
    createdDt: number,
    receivedDt?: number,
    payload: string,
    receiveCount: number,
    updatedDt: number
}

export interface IAppConfiguration extends RedisOptions {
    /**
     * @param {number} visibilityTimeout - A period of time in seconds during which the library prevents other consumers from receiving and processing the message. 
     * The default visibility timeout for a message is 300 seconds (5 minutes).
     */
     processingTimeout?: number
}

export interface Repository {

    /**
     * Adds a message to the queue.
     * @param {string} messageFullName - The message full name (e.g. createUser:message:2)
     * @param {string} addTo - The queue name to add message to (e.g. createUser:publishedIds).
     * @param {Message} message - The message to be add.
     */
    addMessage(messageFullName: string, addTo:string, message: Message): Promise<Array<[Error | null, any]>>

    /**
     * Sends a message to the notification channel.
     * @param {string} addTo - The notification queue name (e.g. createUser:notifications).
     * @param {number} messageId - The message id that was processed (e.g. 2).
     */
    sendNotification(notificationQueue: string, messageId: number): Promise<number>;

    /**
     * Returns message to the processing queue.
     * @param {string} messageFullName - The message full name (e.g. createUser:message:2)
     * @param {number} receivedDt - The received date as the number of milliseconds since the Unix Epoch.
     * @param {string} moveFrom - The queue name to move a message from (e.g. createUser:processingIds).
     * @param {string} moveTo - The queue name to move a message to (e.g. createUser:publishedIds).
     * @param {string} messageId - The message id (e.g. 2).
     */
    returnMessage(messageFullName: string, receivedDt: number,
        moveFrom: string, moveTo: string, messageId: string): Promise<boolean>

    /**
     * Gets a message from the published queue to process.
     * @param {string} moveFrom - The queue name to move a message from (e.g. createUser:processingIds).
     * @param {string} moveTo - The queue name to move a message to (e.g. createUser:publishedIds).
     * @param {string} messageResourceNamePrefix - The prefix for the Redis key that stores
     * all message keys ('payload' key, 'createdDt' key, 'receivedDt' key, etc) without a message id.
     * E.g. 'createUser:message:'
     */
    getMessage(moveFrom: string, moveTo:string, messageQueuePrefix:string): Promise<Message>
}
