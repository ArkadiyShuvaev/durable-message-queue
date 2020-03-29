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
    sendNotification(notificationQueue: string, message: string): Promise<number>;
    moveItemBackToQueue(messageKey: string, receivedDt: number,
        moveFrom: string, moveTo: string, messageId: string): Promise<boolean>

    getMessage(moveFrom: string, moveTo:string, messageQueuePrefix:string): Promise<Message>
}
