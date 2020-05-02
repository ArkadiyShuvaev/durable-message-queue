
import BaseService from "../baseService";
import { Redis } from "ioredis";
import { Repository, Metrics } from "../types";
import Visualizer from "./visualizer";
import { nameof } from "../utils";
import RowsCreator from "./rowsCreator";

export default class Monitor extends BaseService {

    timer: NodeJS.Timeout | undefined;
    private repo: Repository;

    // private redis: Redis;
    // private redisSubscribedClient: Redis;
    constructor(redisRepository: Repository, redisClient: Redis, redisSubscribedClient: Redis) {
        super("dummy");
        this.repo = redisRepository;

        this.timer = undefined;
    }

    async start() {

        const map = new Map<string, Metrics>();
        const metrics = await this.repo.getQueues();
        for (let idx = 0; idx < metrics.length; idx++) {
            const key = metrics[idx];
            const result = await this.repo.getMetrics(key);
            map.set(key, result);
        }

        const rows = RowsCreator.create(map);
        const visualizer = new Visualizer();
        visualizer.render(rows);
    }
}
