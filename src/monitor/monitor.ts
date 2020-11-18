import { Redis } from "ioredis";
import BaseService from "../baseService";
import { IAppConfiguration, Metrics, Repository } from "../types";
import RowsCreator from "./rowsCreator";
import Visualizer from "./visualizer";

export default class Monitor extends BaseService {

    private repo: Repository;
    private config: IAppConfiguration;
    private monitorUpdateInterval: number;
    //private timer: NodeJS.Timeout | undefined;
    queues: string[];
    visualizer: Visualizer;

    // private redis: Redis;
    private redisSubscribedClient: Redis;
    constructor(redisRepository: Repository, redisSubscribedClient: Redis, config?: IAppConfiguration) {
        super("dummy");

        this.repo = redisRepository;
        this.redisSubscribedClient = redisSubscribedClient;

        if (typeof config === "undefined"
            || typeof config.monitorUpdateInterval === "undefined") {
            throw new Error("Configuration");
        }

        this.queues = [];
        this.config = config;
        //this.timer = undefined;
        this.visualizer = new Visualizer();
        this.monitorUpdateInterval = config.monitorUpdateInterval;
    }

    async start() {

        await this.getQueues();
        await this.renderQueues();

        setInterval(async () => this.renderQueues(), this.monitorUpdateInterval * 1000);
        setInterval(async () => await this.getQueues(), this.monitorUpdateInterval * 10 * 1000);

        await this.redisSubscribedClient.subscribe(this.updateQueueChannel);
        this.redisSubscribedClient.on("message", async () => {
            await this.getQueues();
        });
    }
    async renderQueues(): Promise<void> {
        const map = new Map<string, Metrics>();
        for (let idx = 0; idx < this.queues.length; idx++) {
            const key = this.queues[idx];
            const result = await this.repo.getMetrics(key);
            map.set(key, result);
        }
        const rows = RowsCreator.create(map);
        this.visualizer.render(rows);
    }

    async getQueues(): Promise<void> {
        this.queues = await this.repo.getQueues();
    }
}
