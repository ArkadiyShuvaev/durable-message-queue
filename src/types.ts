import { RedisOptions } from "ioredis";

export interface QueueData {
    createdDt: number,
    payload: string
}

export interface IAppConfiguration extends RedisOptions {
    /**
     * @param {number} visibilityTimeout - A period of time in seconds during which the library prevents other consumers from receiving and processing the message. 
     * The default visibility timeout for a message is 300 seconds (5 minutes).
     */
     processingTimeout?: number
}
