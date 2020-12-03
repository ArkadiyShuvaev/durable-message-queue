const dmq = require('durable-message-queue');

const queueName = "show-how-dead-queue-works";
const config = {
    host: "127.0.0.1",

    // It is invisible for other consumers only for two seconds
    visibilityTimeout: 2,

    // after two attempts will be moved to the dead-queue
    maxReceiveCount: 2
};

const queueManager = dmq.Builder.createQueueManager(queueName, config);
queueManager.start();

const producer = dmq.Builder.createProducer(queueName, config);
const consumerB = dmq.Builder.createConsumer(queueName, config);

const waitFunc = ms => new Promise((res, _) => setTimeout(() => res(), ms));

consumerB.subscribe(async (message) => {
    return new Promise(async (res, _) => {
        console.log("Consumer: start processing a long-running operation (5 seconds)...");
        await waitFunc(5000);

        // Was processed but this message had already become visible to other consumers.
        console.log("Consumer: the message has been processed.");
        res();
    });
});


const message = {
    userId: "1",
    messageType: "broken-message",
    to: "user@company.com"
};
producer.send(JSON.stringify(message));
