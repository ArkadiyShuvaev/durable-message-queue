- [Durable message queue](#durable-message-queue)
  - [Features](#features)
  - [Quick start](#quick-start)
  - [Components](#components)
    - [Producer](#producer)
    - [Consumer](#consumer)
      - [The processing timeout](#the-processing-timeout)
      - [The maximum receive count](#the-maximum-receive-count)
    - [Queue manager](#queue-manager)
  - [Metrics](#metrics)


# Durable message queue
[![Build Status](https://travis-ci.org/ArkadiyShuvaev/durable-message-queue.svg?branch=master)](https://travis-ci.org/ArkadiyShuvaev/durable-message-queue)

The draft of the doc.

The library helps you build a distributed application with decoupled components using a FIFO queue.

It implements the [Redis Reliable queue](https://redis.io/commands/rpoplpush) pattern and supports moving unprocessed or corrupted messages to a dead-letter queue.

All important operations are produced with LUA scripts that [guarantees](https://redis.io/commands/eval#atomicity-of-scripts) that they are executed in an atomic way

## Features
The library supports following features (described below in details):
1. A FIFO queue for published messages
1. Monitoring metrics that allow you to integrate the library with a monitoring system
1. A processing timeout that determines the length of time for which a consumer can process the message
1. A maximum receive count that specifies the number of times a message is delivered to the source queue before being moved to the dead-letter queue.


## Quick start
1. Create a new "quick-start.js" (or copy the example from the [quick-start.js](examples/quick-start.js) file):
    ```
    const dmq = require("durable-message-queue");

    const queueName = "send-registration-confirmation-email";
    const config = {
        host: "127.0.0.1",
        port: "6379"
    };

    const producer = dmq.Builder.createProducer(queueName, config);
    const consumer = dmq.Builder.createConsumer(queueName, config);

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

## Components
### Producer
One or more producers can send messages to a FIFO queue. Messages are stored in the order that they were successfully received by Redis.

Before being added to to the queue each message is updated by metadata. This metadata is used by the [queue manager](#queue-manager) to conduct the message state:
- a message can be available to process by consumers
- the message can be invisible for other consumers because it is processed
- the message is moved to the dead queue because a [maximum receive count](#the-maximum-receive-count) is exceeded

### Consumer
One or more consumers can subscribe to the queue's updates but only one of them receives the message to process. The message should be processed  during a limited period of time, otherwise the message is marked as available and can be processed again by this or another consumer. See the [processing timeout](#the-processing-timeout) section to get more details.

In case if a message cannot be processed X times, it is moved to the dead queue by the [queue manager](#queue-manager). See all details about this feature in the [maximum receive count](#the-maximum-receive-count) section below.

If the consumers are started after messages were added to the queue, they check the queue for available unprocessed messages and start processing them. Your Redis infrastructure is responsible for retaining all messages that are added to the queue and the messages are stored for unlimited period of time until they are not processed by consumers.

The consumer has access to a message metadata and should filter all  outdated messages on its own using a value of the "createdDt" or "updatedDt" property (see the output of the [quick start](#quick-start) section above).

#### The processing timeout
When a message is added to the queue the consumer starts processing the message and the message is become unavailable for other consumers:

![Processing Timeout](https://raw.githubusercontent.com/ArkadiyShuvaev/durable-message-queue/master/assests/processing-timeout.png)

If something goes wrong and the message cannot be processed by the consumer due for any reason, a [queue manager](#queue-manager) makes the message visible for processing by another consumer. By default the processing timeout equals 300 seconds.

You can specify this period by assigning ............


#### The maximum receive count
If a message cannot be processed X times by a consumer, the message is moved to the dead-letter queue by a queue manager. This period of time is called the maximum receive count and equals 3 by default.

![Dead-letter queue](https://raw.githubusercontent.com/ArkadiyShuvaev/durable-message-queue/master/assests/dead-letter-queue.png)

You can .................

### Queue manager
The description is under construction.

## Metrics
The library supports a set of monitoring metrics that indicates the number of:
1. "numberOfMessagesSent" - messages are sent by producers for processing
2. "numberOfMessagesReceived" - messages are received and started processing by consumers
3. "numberOfMessagesDead" - corrupted messages are moved to the dead-letter queue by a queue manager
4. "numberOfMessagesReturned" - unprocessed messages are moved back to the queue because of crashing a consumer or for any undefined reason
5. "numberOfMessagesDeleted" - messages are successfully processed and removed from the queue.