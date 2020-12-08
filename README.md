# Durable message queue
[![Build Status](https://travis-ci.org/ArkadiyShuvaev/durable-message-queue.svg?branch=master)](https://travis-ci.org/ArkadiyShuvaev/durable-message-queue)

The library helps you build a distributed application with decoupled components using a FIFO queue.

It implements the [Redis Reliable queue](https://redis.io/commands/rpoplpush) pattern and supports moving unprocessed or corrupted messages to a dead-letter queue.

All important operations are produced with LUA scripts that [guarantee](https://redis.io/commands/eval#atomicity-of-scripts) that they are executed in an atomic way.

## Table of contents
- [Features](#features)
- [Quick start](#quick-start)
- [Components](#components)
  - [Producer](#producer)
  - [Consumer](#consumer)
    - [The processing timeout](#the-processing-timeout)
    - [The maximum receive count](#the-maximum-receive-count)
  - [Queue manager](#queue-manager)
  - [Monitor](#monitor)
- [Settings](#settings)
  - [Library related settings](#library-related-settings)
  - [Ioredis related settings](#ioredis-related-settings)
- [Metrics](#metrics)
- [Debug](#debug)


## Features
The library supports the following features (described below in details):
1. A FIFO queue for published messages
1. Monitoring metrics that allow you to integrate the library with your monitoring system
1. A processing timeout that determines the length of time for which a message is invisible for other consumer when the message begins to be processed
1. A maximum number of processing attempts before a message is moved to the dead-letter queue


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
    ```
    {  
        id: '2',  
        receiveCount: '1',  
        updatedDt: '2020-11-26T21:46:01.870Z',  
        createdDt: '2020-11-26T21:46:01.827Z',  
        payload: '{"userId":"1","messageType":"registrationConfirmation","to":"user@company.com"}',  
        receivedDt: '2020-11-26T21:46:01.870Z'  
    }
    ```

## Components
### Producer
One or more producers can send messages to a FIFO queue. Messages are stored in the order that they were successfully received by Redis.

Before being added to the queue each message is updated by metadata. This metadata is used by the [queue manager](#queue-manager) to conduct the message state:
- a message can be available to process by consumers
- the message can be invisible for other consumers because it is processed
- the message is moved to the dead queue because a [maximum receive count](#the-maximum-receive-count) is exceeded

### Consumer
One or more consumers can subscribe to the queue's updates but only one of them receives the message to process. The message should be processed  during a limited period of time, otherwise, the message is marked as available and can be processed again by this or another consumer. See the [processing timeout](#the-processing-timeout) section to get more details.

In case if a message cannot be processed X times, it is moved to the dead queue by the [queue manager](#queue-manager). See all details about this feature in the [maximum receive count](#the-maximum-receive-count) section below.

If the consumers are started after messages were added to the queue, they check the queue for available unprocessed messages and start processing them. Your Redis infrastructure is responsible for retaining all messages that are added to the queue and the messages are stored for an unlimited period of time until they are not processed by consumers.

The consumer has access to message metadata and should filter all  outdated messages on its own using a value of the "createdDt" or "updatedDt" property (see the output of the [quick start](#quick-start) section above).

#### The processing timeout
When a message is added to the queue the consumer starts processing the message and the message is become unavailable for other consumers:

![Processing Timeout](https://raw.githubusercontent.com/ArkadiyShuvaev/durable-message-queue/master/assests/processing-timeout.png)

If something goes wrong and the message cannot be processed by the consumer due to any reason, a [queue manager](#queue-manager) makes the message visible for processing by another consumer. By default, the processing timeout equals 300 seconds.

You can specify this period by assigning desired value in seconds to the visibilityTimeout value. See the [Settings](#settings) section to get more details.

#### The maximum receive count
If a message cannot be processed X times by a consumer, the message is moved to the dead-letter queue by a queue manager. This period of time is called the maximum receive count and equals 3 by default.

![Dead-letter queue](https://raw.githubusercontent.com/ArkadiyShuvaev/durable-message-queue/master/assests/dead-letter-queue.png)

You can change the default value by modifying the maxReceiveCount property. See the [Settings](#settings) section to get more details.

### Queue manager
The description is under construction.

### Monitor
The monitor tool is an additional component that allows us to keep up to date on metrics across all queues.

![Dead-letter queue](https://raw.githubusercontent.com/ArkadiyShuvaev/durable-message-queue/master/assests/monitor-animation.gif)

 Please use the [start-monitor.js](examples/start-monitor.js) file as an example to start the monitor tool and see the [Settings](#settings) section to get more details about configuration.

## Settings
### Library related settings
There are three settings that you can use with this library:
1. visibilityTimeout - the period of time in seconds during which the library prevents other consumers from receiving and processing the message. The default visibility timeout for a message is 300 seconds (5 minutes).
1. maxReceiveCount - the maximum number of receives that are allowed before the message is moved to the dead-letter queue. If something goes wrong and the number of receives exceeds the MaxReceiveCount value, the queue manager moves the message to the dead-letter queue (see the picture of the [maximum receive count](#the-maximum-receive-count) section to get more details). The default value is 3.
1. monitorUpdateInterval - the period of time in seconds to update metrics of the queue monitor tool.

### Ioredis related settings
As far as the library uses [ioredis](https://github.com/luin/ioredis) to access to Redis, all ioredis-related configuration settings are transmitted to ioredis as is. Visit the ioredis main page to get more details about configuration of the connection.

The simplest configuration includes only a host property with the server address:
  ```
  const config = {
    host: "server name or ip address"
  };
  ```

## Metrics
The library supports a set of monitoring metrics that indicates the number of:
1. "numberOfMessagesSent" - messages are sent by producers for processing
1. "numberOfMessagesReceived" - messages are received and started processing by consumers
1. "numberOfMessagesDead" - corrupted messages are moved to the dead-letter queue by a queue manager
1. "numberOfMessagesReturned" - unprocessed messages are moved back to the queue because of crashing a consumer or for an undefined reason
1. "numberOfMessagesDeleted" - messages are successfully processed and removed from the queue.

## Debug
You can set the DEBUG env to ioredis:* to print debug and error info. Here is the example for Windows and the [quick-start.js](examples/quick-start.js) file:
```
set DEBUG=dmq:* & node quick-start.js
```