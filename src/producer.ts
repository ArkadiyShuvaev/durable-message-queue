import { Redis } from "ioredis";
import BaseService from "./baseService";
import ActionResult from "./actionResult";
import { Message } from "./types";
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
                const messageId = await this.redis.incr(this.messageUniqId);
                const messageResourceName = this.getMessageResourceName(messageId);

                const message: Message = {
                    id: messageId,
                    createdDt: new Date().getTime(),
                    payload: messageRequest
                };

                await this.redis
                    .multi()
                    .hset(messageResourceName, nameof<Message>("id"), message.id)
                    .hset(messageResourceName, nameof<Message>("createdDt"), message.createdDt)
                    .hset(messageResourceName, nameof<Message>("payload"), message.payload)
                    .lpush(this.publishedIds, messageId)
                    .exec();

                await this.redis.publish(this.notifications, messageId.toString());

                res({
                    isSuccess: true,
                    message: `The '${messageId}' message id has been sucessfully added into the queue to process.`
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
