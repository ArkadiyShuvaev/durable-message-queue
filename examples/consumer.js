const dmq = require("durable-message-queue");

const queueName = "send-registration-confirmation-email";

const queueManager = dmq.Builder.createQueueManager(queueName, {
    visibilityTimeout: 10,
    maxReceiveCount: 6
});
queueManager.start();

const producer = dmq.Builder.createProducer(queueName);
const consumer = dmq.Builder.createConsumer(queueName);

consumer.subscribe(async (message) => console.log(message));

const message = {
    userId: "1",
    messageType: "registrationConfirmation",
    to: "user@company.com"
};
producer.send(JSON.stringify(message));