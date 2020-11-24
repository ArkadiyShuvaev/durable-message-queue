import { IAppConfiguration, Metrics, Repository } from "../types";
import RowsCreator from "./rowsCreator";
import Visualizer from "./visualizer";

export default class Monitor {

    private repo: Repository;
    private monitorUpdateInterval: number;
    queues: string[];
    visualizer: Visualizer;

    constructor(redisRepository: Repository, config?: IAppConfiguration) {

        this.repo = redisRepository;

        if (typeof config === "undefined"
            || typeof config.monitorUpdateInterval === "undefined") {
            throw new Error("Configuration");
        }

        this.queues = [];
        this.visualizer = new Visualizer();
        this.monitorUpdateInterval = config.monitorUpdateInterval;
    }

    async start() {

        await this.getQueues();
        await this.renderQueues();

        setInterval(async () => this.renderQueues(), this.monitorUpdateInterval * 1000);
        setInterval(async () => await this.getQueues(), this.monitorUpdateInterval * 10 * 1000);

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
