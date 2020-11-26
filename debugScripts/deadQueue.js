import Builder from "../dist/builder";

const queueName = "createUser";

const queueManager = Builder.createQueueManager(queueName, {
    visibilityTimeout: 10,
    maxReceiveCount: 2
});
queueManager.start();

const producer = Builder.createProducer(queueName);
const consumer = Builder.createConsumer(queueName);

consumer.subscribe(async (message) => {
    if (message.id % 100 == 0) {
        // this message will never been produced and will be put into dead queue
        console.log(`The "${message.id}" message cannot be processed.`);
        return;
    }
});


for (let idx = 0; idx < 1000; idx++) {
    const obj = {
        dummyString: new Date().toISOString(),
        result: "success"
    };

    producer.send(JSON.stringify(obj));
}
