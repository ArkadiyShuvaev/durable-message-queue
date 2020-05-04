import { Redis } from "ioredis";
import BaseService from "../baseService";
import { IAppConfiguration, Metrics, Repository } from "../types";
import RowsCreator from "./rowsCreator";
import Visualizer from "./visualizer";

export default class Monitor extends BaseService {

    private repo: Repository;
    private config: IAppConfiguration;
    private monitorUpdateInterval: number;
    private timer: NodeJS.Timeout | undefined;

    // private redis: Redis;
    // private redisSubscribedClient: Redis;
    constructor(redisRepository: Repository, redisClient: Redis, redisSubscribedClient: Redis, config?: IAppConfiguration) {
        super("dummy");

        this.repo = redisRepository;

        if (typeof config === "undefined"
            || typeof config.monitorUpdateInterval === "undefined") {
            throw new Error("Configuration");
        }

        this.config = config;
        this.timer = undefined;
        this.monitorUpdateInterval = config.monitorUpdateInterval;
    }

    async start() {

        const visualizer = new Visualizer();
        const queues = await this.repo.getQueues();

        setInterval(async () => {
            const map = new Map<string, Metrics>();
            for (let idx = 0; idx < queues.length; idx++) {
                const key = queues[idx];
                const result = await this.repo.getMetrics(key);
                map.set(key, result);
            }
            const rows = RowsCreator.create(map);
            visualizer.render(rows);
        }, this.monitorUpdateInterval*1000);
    }
}

