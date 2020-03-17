import Redis from "ioredis";
import Producer from "./src/producer";
import Consumer from "./src/consumer";
import QueueManager from "./src/queueManager";
import Builder from "./src/builder";


const queueManager = new QueueManager("test", new Redis());
queueManager.start();

const producer = new Producer("test", new Redis());
const obj = {
    userId: "123-ER-09", 
    result: "success"
};

const consumer = Builder.createConsumer("test", { processingTimeout: 300 });

consumer.subscribe((objAsStr) => {
    console.table(JSON.parse(objAsStr));    
}).then(() => {
    producer.send(JSON.stringify(obj))
    .then(() => console.log("OK"))
    .catch((err) => console.log("Something went wrong: " + err));
});
