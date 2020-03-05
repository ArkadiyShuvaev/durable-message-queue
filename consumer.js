import { Redis } from "ioredis";
import BaseService from "./baseService";

export default class Consumer extends BaseService {
    constructor(queueName: string, redis: Redis) {
        super(queueName, redis);
    }
}