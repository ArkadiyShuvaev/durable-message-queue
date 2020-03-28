import Consumer from "./consumer"
import Redis from "ioredis";
import { IAppConfiguration } from "./types";
import Producer from "./producer";
import QueueManager from "./queueManager";
import { nameof } from "./utils";
import RedisRepository from "./redisRepository";

export default class Builder {
    /**
     * Creates an instance of the {@link Consumer}.
     * @param {string} queueName - A name of the queue.
     * @param {IAppConfiguration} config - A configuration of the library.
     * @returns The consumer instance.
     */
    static createConsumer(queueName: string, config?: IAppConfiguration): Consumer {
        const redisClient = new Redis(config);
        return new Consumer(queueName, new RedisRepository(redisClient), redisClient, new Redis(config));
    }

    static createProducer(queueName: string, config?: IAppConfiguration): Producer {
        return new Producer(queueName, new Redis(config));
    }

    static createQueueManager(queueName: string, config?: IAppConfiguration): QueueManager {
        config = this.setDefaultAppValues(config);
        const redisClient = new Redis(config);
        return new QueueManager(queueName, redisClient, new RedisRepository(redisClient), config);
    }
    
    private static setDefaultAppValues(config?: IAppConfiguration) {
        if (typeof config === "undefined") {
            config = {};
        }

        // if (typeof config.showFriendlyErrorStack === "undefined" && DEBUG) {
        //    // optimize the error stack: https://github.com/luin/ioredis#error-handling            
        //    config.showFriendlyErrorStack = true;
        //}

        if (typeof config.processingTimeout === "undefined") {
            config.processingTimeout = 300;
        }

        return config;
    }
}
