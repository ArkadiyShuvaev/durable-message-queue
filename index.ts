import Redis from "ioredis";
import Producer from "./src/producer";
import Consumer from "./src/consumer";
import QueueManager from "./src/queueManager";
import Builder from "./src/builder";

const queueName = "test";

const queueManager = Builder.createQueueManager(queueName);
//queueManager.start();

const producer = Builder.createProducer(queueName);
const obj = {
    dummyString: new Date().toISOString(), 
    result: "success"
};

producer
    .send(JSON.stringify(obj))
    .then(() => console.log("The producer sent a message to queue."))
    .catch((err) =>
        console.log(`Something went wrong and a message could not sent to the queue "${queueName}": ${err}`));
    
producer
    .send(JSON.stringify(obj))
    .then(() => console.log("The producer sent a message to queue."))
    .catch((err) =>
        console.log(`Something went wrong and a message could not sent to the queue "${queueName}": ${err}`));

const consumer = Builder.createConsumer(queueName, { processingTimeout: 300 });

consumer.subscribe((objAsStr) => {
    console.table(JSON.parse(objAsStr));    
}).then(() => {
    producer.send(JSON.stringify(obj))
    .then(() => console.log("The producer sent a message to queue."))
    .catch((err) =>
        console.log(`Something went wrong and a message could not sent to the queue "${queueName}": ${err}`));
});
