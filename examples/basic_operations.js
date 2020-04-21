const dmq = require("../dist");

const queueName = "createUser";

const queueManager = dmq.Builder.createQueueManager(queueName, {
    processingTimeout: 10,
    maxReceiveCount: 6
});
queueManager.start();

const producer = dmq.Builder.createProducer(queueName);
const consumer = dmq.Builder.createConsumer(queueName);

consumer.subscribe(async (message) => {
    if (message.id % 1 == 0) {
        // this message will never been produced and will be put into dead queue
        throw new Error(`The message id: ${message.id} cannot be processed.`);
    }
});


for (let idx = 0; idx < 1; idx++) {
    const obj = {
        dummyString: new Date().toISOString(),
        result: "success"
    };

    producer.send(JSON.stringify(obj));
}
