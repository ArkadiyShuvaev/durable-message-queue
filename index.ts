import Redis from "ioredis";
import Producer from "./producer";
// import Consumer from "./consumer";

const redis = new Redis();

const producer = new Producer("test", redis);
const obj = {
    id: 1, 
    result: "success"
};

//const consumer = new Consumer("test", redis);

// consumer.subscribe((obj) => {
//     console.log(obj);
// });

console.log("Adding the object in to the queue to process...");
producer.add(JSON.stringify(obj))
    .then(() => console.log("OK"))
    .catch((err) => console.log("Something went wrong: " + err));
//console.log("The object has been added into the queue.");
