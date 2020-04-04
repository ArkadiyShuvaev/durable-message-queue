import Builder from "./builder";

const queueName = "test";

const queueManager = Builder.createQueueManager(queueName);
queueManager.start();

const producer = Builder.createProducer(queueName);
const obj = {
    dummyString: new Date().toISOString(),
    result: "success"
};

producer
    .send(JSON.stringify(obj))
    //.then(() => console.log("The producer sent a message to queue."))
    .catch((err) =>
        console.log(`Something went wrong and a message could not sent to the queue "${queueName}": ${err}`));

const consumer = Builder.createConsumer(queueName, { processingTimeout: 300 });

consumer.subscribe((message) => {
    //console.table(message);
}).then(() => {
    producer.send(JSON.stringify(obj))
    // .then(() => console.log("The producer sent a message to queue."))
    .catch((err) =>
        console.log(`Something went wrong and a message could not sent to the queue "${queueName}": ${err}`));
});


setInterval(() => {

    const obj = {
        dummyString: new Date().toISOString(),
        result: "success"
    };

    producer.send(JSON.stringify(obj))
    //.then(() => console.log("The producer sent a message to queue."))
    .catch((err) =>
        console.log(`Something went wrong and a message could not sent to the queue "${queueName}": ${err}`));

}, 10);