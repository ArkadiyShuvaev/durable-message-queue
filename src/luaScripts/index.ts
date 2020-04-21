import { join } from "path";
import { promises as fs } from "fs";

export default class LuaScripts {
    private static moveMessageToDeadQueueScript: string | undefined;
    private static moveMessageToPublishedQueueScript: string | undefined;
    private static getMessageFromPublishedQueueScript: string | undefined;

    public static async getMessageFromPublishedQueue(): Promise<string> {

        return new Promise<string>(async (res, rej) => {
            try {

                if (!this.getMessageFromPublishedQueueScript) {

                    const filePath = join(process.cwd(), "luaScripts", "getMessageFromPublishedQueue.lua");
                    const data = await fs.readFile(filePath); //  10.0.0 + is required
                    this.getMessageFromPublishedQueueScript = Buffer.from(data).toString("utf8");
                }
                return res(this.getMessageFromPublishedQueueScript);

            } catch(err) {
                rej(err);
            }
        });
    }

    public static async getMoveMessageToPublishedQueue(): Promise<string> {
        return new Promise<string>(async (res, rej) => {
            try {
                if (!this.moveMessageToPublishedQueueScript) {

                    const filePath = join(process.cwd(), "luaScripts", "moveMessageToPublishedQueue.lua");
                    const data = await fs.readFile(filePath); //  10.0.0 + is required
                    this.moveMessageToPublishedQueueScript = Buffer.from(data).toString("utf8");
                }
                return res(this.moveMessageToPublishedQueueScript);

            } catch(err) {
                rej(err);
            }
        });
    }

    public static async getMoveMessageToDeadQueue(): Promise<string> {
        return new Promise<string>(async (res, rej) => {
            try {
                if (!this.moveMessageToDeadQueueScript) {

                    const filePath = join(process.cwd(), "luaScripts", "moveMessageToDeadQueue.lua");
                    const data = await fs.readFile(filePath); //  10.0.0 + is required
                    this.moveMessageToDeadQueueScript = Buffer.from(data).toString("utf8");
                }
                return res(this.moveMessageToDeadQueueScript);

            } catch(err) {
                rej(err);
            }
        });
    }
}
