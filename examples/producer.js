const dmq = require("durable-message-queue");

const queueName = "send-registration-confirmation-email";
const producer = dmq.Builder.createProducer(queueName);

for (let idx = 0; idx < 100; idx++) {
    const userId = Math.round(Math.random()*10000);

    const message = {
        userId: userId,
        messageType: "registrationConfirmation",
        to: `user${userId}@company.com`
    };
    producer.send(JSON.stringify(message));
}
