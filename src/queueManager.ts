import BaseService from "./baseService";
import { Redis } from "ioredis";

export default class QueueManager extends BaseService {
    
    /**
     *
     */
    constructor(queueName: string, redis: Redis) {
        super(queueName, redis);
    }

    start(): void {
        const timeOut = setInterval(() => {
            console.log(`Processing the "${this.queueName}" queue...`);
        }, 1000);
    }
}