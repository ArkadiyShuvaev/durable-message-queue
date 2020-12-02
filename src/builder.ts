import Redis from "ioredis";
import { IAppConfiguration } from "./types";
import QueueManager from "./queueManager";
import RedisRepository from "./redisRepository";
import { Monitor, Producer, Consumer } from ".";

export default class Builder {
    /**
     * Creates an instance of the {@link Consumer}.
     * @param {string} queueName - A name of the queue.
     * @param {IAppConfiguration} config - A configuration of the library.
     * @returns A new instance of the consumer.
     */
    static createConsumer(queueName: string, config?: IAppConfiguration): Consumer {
        const redisClient = new Redis(config);
        return new Consumer(queueName, new RedisRepository(redisClient), redisClient, new Redis(config));
    }

    /**
     * Creates an instance of the {@link Producer}.
     * @param {string} queueName - A name of the queue.
     * @param {IAppConfiguration} config - A configuration of the library.
     * @returns A new instance of the producer.
     */
    static createProducer(queueName: string, config?: IAppConfiguration): Producer {
        const redisClient = new Redis(config);
        return new Producer(queueName, new RedisRepository(redisClient), redisClient);
    }

    /**
     * Creates an instance of the {@link QueueManager}.
     * @param {string} queueName - A name of the queue.
     * @param {IAppConfiguration} config - A configuration of the library.
     * @returns A new instance of the queue manager.
     */
    static createQueueManager(queueName: string, config?: IAppConfiguration): QueueManager {
        config = this.setDefaultAppValues(config);
        const redisClient = new Redis(config);
        return new QueueManager(queueName, redisClient, new RedisRepository(redisClient), config);
    }

    /**
     * Creates an instance of the {@link Monitor}.
     * @param {string} queueName - A name of the queue.
     * @param {IAppConfiguration} config - A configuration of the library.
     * @returns A new instance of the monitor.
     */
    static createMonitor(config?: IAppConfiguration): Monitor {
        config = this.setDefaultAppValues(config);
        const redisClient = new Redis(config);
        return new Monitor(new RedisRepository(redisClient), config);
    }

    private static setDefaultAppValues(config?: IAppConfiguration) {
        if (typeof config === "undefined") {
            config = {};
        }

        // if (typeof config.showFriendlyErrorStack === "undefined" && DEBUG) {
        //    // optimize the error stack: https://github.com/luin/ioredis#error-handling
        //    config.showFriendlyErrorStack = true;
        //}

        if (typeof config.visibilityTimeout === "undefined") {
            config.visibilityTimeout = 300;
        }

        if (typeof config.maxReceiveCount === "undefined") {
            config.maxReceiveCount = 3;
        }

        if (typeof config.monitorUpdateInterval === "undefined") {
            config.monitorUpdateInterval = 60;
        }

        return config;
    }
}
