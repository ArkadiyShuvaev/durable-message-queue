import { promises as fs } from "fs";
import { Redis } from "ioredis";
import {Repository, MessageMetaData} from "./types";
import { nameof } from "./utils";

export default class RedisRepository implements Repository {
    private redis: Redis;
    private luaCommand: string | undefined;
    private readonly fileName = "src/returnMessageToQueue.lua";

    constructor(redis: Redis) {
        this.redis = redis; 
    }
    async moveItemBackToQueue(messageKey: string, receivedDt: number, moveFrom: string, moveTo: string, messageId: string): Promise<boolean> {
        const luaScript = await this.getFileContent();
        const result = await this.redis.eval(luaScript, 3,
            [messageKey, moveFrom, moveTo, nameof<MessageMetaData>("receivedDt"), receivedDt, messageId ]);
          
        return result;
    }

    private async getFileContent(): Promise<string> {
        return new Promise<string>(async (res, rej) => {
            try {
                if (!this.luaCommand) {
                    const data = await fs.readFile(this.fileName); //  10.0.0 + is required
                    this.luaCommand = Buffer.from(data).toString("utf8");
                }
                return res(this.luaCommand);

            } catch(err) {
                console.error(err);
                rej(err);
            }
        });
    }

}