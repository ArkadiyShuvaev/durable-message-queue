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
     * Sends the message to the queue and creates the consumenr notification event.
     * @param {string} messageRequest - The serialized object.
     */
    public send(messageRequest: string): Promise<ActionResult> {

        return new Promise<ActionResult>(async (res, rej) => {
            try {
                const jobId = await this.redis.incr(this.keyQueue);
                const dataKey = this.getDataKeyByJobId(jobId.toString());

                const queueData: QueueData = {
                    createdDt: new Date().getTime(),
                    payload: messageRequest
                };

                await this.redis
                    .multi()
                    .hset(dataKey, nameof<QueueData>("createdDt"), queueData.createdDt)
                    .hset(dataKey, nameof<QueueData>("payload"), queueData.payload)
                    .lpush(this.publishedQueue, jobId)
                    .exec();

                await this.redis.publish(this.notificationQueue, jobId.toString());

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
