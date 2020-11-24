const dmq = require("../dist/");

const queueName = "createUser";

const queueManager = dmq.Builder.createQueueManager(queueName, {
    processingTimeout: 10,
    maxReceiveCount: 6
});
queueManager.start();

const producer = dmq.Builder.createProducer(queueName);
const consumer = dmq.Builder.createConsumer(queueName);

consumer.subscribe(async (message) => {
    console.log(message);
});


createMessages();

setTimeout(() => createMessages(), 5000);

function createMessages() {
    for (let idx = 0; idx < 2; idx++) {
        const message = {
            dummyString: new Date().toISOString(),
            result: "success"
        };

        producer.send(JSON.stringify(message));
    }
}

