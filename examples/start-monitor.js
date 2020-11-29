const dmq = require("durable-message-queue");

const config = {
	host: "127.0.0.1",
	monitorUpdateInterval: 30
};
const monitor = dmq.Builder.createMonitor(config);
monitor.start();
