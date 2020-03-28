import { promises as fs } from "fs";
import { Redis } from "ioredis";
import {Repository, Message} from "./types";
import { nameof } from "./utils";
import { rejects } from "assert";

export default class RedisRepository implements Repository {
    
    private redis: Redis;
    private luaCommand: string | undefined;
    private readonly returnMessageToQueueFileName = "src/lua-scripts/returnMessageToQueue.lua";
    private readonly getMessageFromQueueFileName = "src/lua-scripts/getMessageFromQueue.lua";

    constructor(redis: Redis) {
        this.redis = redis; 
    }

    /**
     * Gets a message from the published queue to process.
     * @param {string} messageResourceNamePrefix - The prefix for the Redis key that stores 
     * all message keys ('payload' key, 'createdDt' key, 'receivedDt' key, etc) without a message id. 
     * E.g. 'userRegistration:message:'
     */
    async getMessage(moveFrom: string, moveTo: string, messageResourceNamePrefix: string): Promise<Message> {
        return new Promise(async (res, rej) => {
            try {
                
                let result: object | undefined = undefined;
                
                const luaScript = await this.getFileContent(this.getMessageFromQueueFileName);                
                const array = await this.redis.eval(luaScript, 3, // set 2 to crash lua script and test the transaction
                    [moveFrom, moveTo, messageResourceNamePrefix, nameof<Message>("receivedDt"), new Date().getTime() ]);
 
                if (array) {
                    let result: any = {};
                    for (let idx = 0; idx < array.length; idx = idx + 2) {
                        
                        result[array[idx]] = array[idx+1];
                    }

                    res(<Message><unknown>result);
                }

                res(result);

            } catch (err) {
                rej(err);
            }
        });
    }
    
    async moveItemBackToQueue(messageResourceName: string, receivedDt: number, moveFrom: string, moveTo: string, messageId: string): Promise<boolean> {
        const luaScript = await this.getFileContent(this.returnMessageToQueueFileName);
        const result = await this.redis.eval(luaScript, 3,
            [messageResourceName, moveFrom, moveTo, nameof<Message>("receivedDt"), receivedDt, messageId ]);
          
        return result;
    }

    private async getFileContent(fileName: string): Promise<string> {
        return new Promise<string>(async (res, rej) => {
            try {
                if (!this.luaCommand) {
                    const data = await fs.readFile(fileName); //  10.0.0 + is required
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