import Redis from "ioredis";
import Producer from "./producer";
import Consumer from "./consumer";


const producer = new Producer("test", new Redis());
const obj = {
    userId: "123-ER-09", 
    result: "success"
};

const consumer = new Consumer("test", new Redis(), new Redis());

consumer.subscribe((objAsStr) => {
    console.table(JSON.parse(objAsStr));
}).then(() => {
    producer.add(JSON.stringify(obj))
    .then(() => console.log("OK"))
    .catch((err) => console.log("Something went wrong: " + err));
});
