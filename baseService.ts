import { Redis } from "ioredis";

export default class BaseService {
    
    protected _redis: Redis;
    protected _keyQueue: string;
    protected _dataQueue: string;
    protected _publishedQueue: string;
    protected _processingQueue: string;
    protected _notificationQueue: string;
    protected _payloadFieldName = "payload";
    protected _createdDtFieldName = "createdDt";
    
    /**
     *
     */
    constructor(queueName: string, redis: Redis) {
        this._redis = redis;
        this._keyQueue = `${queueName}:keys`;
        this._dataQueue = `${queueName}:data`;
        this._publishedQueue = `${queueName}:published`;
        this._processingQueue = `${queueName}:processing`;
        this._notificationQueue = `${queueName}:notifications`;      
          
    }

    protected getDataKeyByJobId(jobId: string): string {
        return `${this._dataQueue}:${jobId}`;
    }
}
