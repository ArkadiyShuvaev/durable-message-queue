const dmq = require("durable-message-queue");

const queueName = "send-registration-confirmation-email";
const config = {
    host: "127.0.0.1"
};

const queueManager = dmq.Builder.createQueueManager(queueName, config);
queueManager.start();

const producer = dmq.Builder.createProducer(queueName, config);
const consumer = dmq.Builder.createConsumer(queueName, config);

consumer.subscribe(async (message) => console.log(message));

const message = {
    userId: "1",
    messageType: "registrationConfirmation",
    to: "user@company.com"
};
producer.send(JSON.stringify(message));