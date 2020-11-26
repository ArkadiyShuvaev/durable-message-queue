# Durable message queue
[![Build Status](https://travis-ci.org/ArkadiyShuvaev/durable-message-queue.svg?branch=master)](https://travis-ci.org/ArkadiyShuvaev/durable-message-queue)

The draft of the doc.

The library helps you build a distributed application with decoupled components using a FIFO queue. It implements the [Redis Reliable queue](https://redis.io/commands/rpoplpush) pattern and supports moving unprocessed or corrupted messages to a dead-letter queue.

## Features
The library supports following features (described below in details):
1. Thanks to Redis the library provides FIFO queue for published messages
1. Monitoring metrics that allow you to integrate the library with a monitoring system
1. A processing timeout that determines the length of time for which a consumer can process the message
1. A maximum receive count that specifies the number of times a message is delivered to the source queue before being moved to the dead-letter queue.
1. All important operations are produced with LUA scripts that [guarantees](https://redis.io/commands/eval#atomicity-of-scripts) that they are executed in an atomic way

## Installing

## Quick start
1. Create a JavaScript file "quick-start.js":
    ```
    const dmq = require("durable-message-queue");

    const queueName = "send-registration-email";

    const producer = dmq.Builder.createProducer(queueName);
    const consumer = dmq.Builder.createConsumer(queueName);

    consumer.subscribe(async (message) => console.log(message));

    const message = {
        userId: "1",
        messageType: "registrationConfirmation",
        to: "user@company.com"
    };
    producer.send(JSON.stringify(message));
    ```
1. Install the package:
    ```
    npm i durable-message-queue
    ```
1. Start the script:
    ```
    node quick-start.js
    ```
1. See the output:
    > {  
    >     id: '2',  
    >     receiveCount: '1',  
    >     updatedDt: '2020-11-26T21:46:01.870Z',  
    >     createdDt: '2020-11-26T21:46:01.827Z',  
    >     payload: '{"userId":"1",  "messageType":"registrationConfirmation","to":"user@company.com"}',  
    >     receivedDt: '2020-11-26T21:46:01.870Z'  
    >  }

## How it works
### The processing timeout
When a message is added to the queue by a producer it gets available for processing by consumers. One of them starts processing the message and the message is become unavailable for other consumers:

![Processing Timeout](https://raw.githubusercontent.com/ArkadiyShuvaev/durable-message-queue/master/assests/processing-timeout.png)

If something goes wrong and the message cannot be processed by the consumer due for any reason, a queue manager makes the message visible for processing by another consumer. By default the processing timeout equals 300 seconds.
### The maximum receive count
If a message cannot be processed x times by a consumer, the message is moved to the dead-letter queue by a queue manager. This period of time is called the maximum receive count and equals 3 by default.

![Dead-letter queue](https://raw.githubusercontent.com/ArkadiyShuvaev/durable-message-queue/master/assests/dead-letter-queue.png)
### Metrics
The library supports a set of monitoring metrics that indicates the number of:
1. "numberOfMessagesSent" - messages are sent by producers for processing
2. "numberOfMessagesReceived" - messages are received and started processing by consumers
3. "numberOfMessagesDead" - corrupted messages are moved to the dead-letter queue by a queue manager
4. "numberOfMessagesReturned" - unprocessed messages are moved back to the queue because of crashing a consumer or for any undefined reason
5. "numberOfMessagesDeleted" - messages are successfully processed and removed from the queue.