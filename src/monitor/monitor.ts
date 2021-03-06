import { AppConfiguration, Metrics, Repository } from "../types";
import RowsCreator from "./rowsCreator";
import Visualizer from "./visualizer";

export default class Monitor {

    private repo: Repository;
    private monitorUpdateIntervalInSeconds: number;
    queues: string[];
    visualizer: Visualizer;

    constructor(redisRepository: Repository, config?: AppConfiguration) {

        this.repo = redisRepository;

        if (typeof config === "undefined"
            || typeof config.monitorUpdateInterval === "undefined") {
            throw new Error("Configuration");
        }

        this.queues = [];
        this.visualizer = new Visualizer(config.monitorUpdateInterval);
        this.monitorUpdateIntervalInSeconds = config.monitorUpdateInterval;
    }

    async start() {

        await this.getQueues();
        await this.renderQueues();

        setInterval(async () => this.renderQueues(), this.monitorUpdateIntervalInSeconds * 1000);
        setInterval(async () => await this.getQueues(), this.monitorUpdateIntervalInSeconds * 10 * 1000);

        // await this.redisSubscribedClient.subscribe(this.updateQueueChannel);
        // this.redisSubscribedClient.on("newMessageAdded", async () => {
        //     await this.getQueues();
        // });
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
