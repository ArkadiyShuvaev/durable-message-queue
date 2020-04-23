import process from "process";
import readline from "readline";
import BaseService from "./baseService";
import { Redis } from "ioredis";
import RedisRepository from "./redisRepository";

export default class Monitor extends BaseService {
    size: number;
    cursor: number;
    timer: NodeJS.Timeout | undefined;
    constructor(queueName: string, redisRepository: RedisRepository, redisClient: Redis, redisSubscribedClient: Redis, size: number = 50) {
        super(queueName, redisClient);
        this.size = size
        this.cursor = 0
        this.timer = undefined;
    }

    start() {

        // disable the cursor
        //process.stdout.write("\x1B[?25l")

        for (let i = 0; i < this.size; i++) {
            process.stdout.write("\u2591")
        }

        process.stdout.clearLine(0); // Direction = -1 | 0 | 1;
        readline.cursorTo(process.stdout, 0, 1);
        process.stdout.write("QueueName: ");

        readline.cursorTo(process.stdout, 20, 1);
        process.stdout.write("Published: 43");

        readline.cursorTo(process.stdout, 20, 2);
        process.stdout.write("\n");

        readline.cursorTo(process.stdout, this.cursor, 0);
        this.timer = setInterval(() => {
            process.stdout.write("\u2588")
            this.cursor++;
            if (this.cursor >= this.size) {
                clearTimeout(this.timer as NodeJS.Timeout);
                // enable cursor
                //process.stdout.write("\x1B[?25h");
            }
        }, 200)

    }
}
