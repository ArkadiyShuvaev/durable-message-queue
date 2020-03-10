import { Redis } from "ioredis";
import BaseService from "./baseService";
import ActionResult from "./actionResult";
import { QueueData } from "./types";
import { nameof } from "./utils";


export default class Producer extends BaseService {

    constructor(queueName: string, redis: Redis) {
        super(queueName, redis);
    }

    /**
     * Adds the item in to the queue to process and publish an event.
     */
    public add(data: string): Promise<ActionResult> {

        return new Promise<ActionResult>(async (res, rej) => {
            try {
                const jobId = await this._redis.incr(this._keyQueue);
                const dataKey = this.getDataKeyByJobId(jobId.toString());

                const queueData: QueueData = {
                    createdDt: new Date().getTime(),
                    payload: data
                };

                await this._redis
                    .multi()
                    .hset(dataKey, nameof<QueueData>("createdDt"), queueData.createdDt)
                    .hset(dataKey, nameof<QueueData>("payload"), queueData.payload)
                    .rpush(this._publishedQueue, jobId)
                    .exec();

                await this._redis.publish(this._notificationQueue, jobId.toString());

                res({
                    isSuccess: true,
                    message: `The '${jobId}' jobId has been sucessfully added into the queue to process.`
                });

            } catch (e) {
                rej({
                    isSuccess: false,
                    message: e
                });
            }
        });
    }
}
