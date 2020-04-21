local function moveMessageToDeadQueue(messageKey, deadMessageKey, processingQueue, metricsQueue,
    numberOfMessagesDeadFieldName, updatedDtFieldName, updatedDt, messageId)

    if (messageKey == nil or processingQueue == nil or deadMessageKey == nil or metricsQueue == nil
            or numberOfMessagesDeadFieldName == nil or updatedDtFieldName == nil
            or updatedDt == nil or messageId == nil) then
        error("argument cannot be nil: " .. messageKey.. deadMessageKey .. processingQueue
            .. metricsQueue .. numberOfMessagesDeadFieldName .. updatedDtFieldName .. updatedDt .. messageId)
    end

    local operationResult = false

    if (redis.call("exists", messageKey) == 1) then

        -- remove the messageId (e.g. 2) from the processing queue (e.g. from the createUser:processing)
        local removeFromResult = redis.call("lrem", processingQueue, 0, messageId)

        if (removeFromResult >= 1 or (type(removeFromResult) == "boolean" and removeFromResult)) then

            -- move the message (e.g. "createUser:deadMessage:2") to the dead queue
            local raw_data = redis.call('hgetall', messageKey);
            -- raw_data:
            -- key: 1 value: id
            -- key: 2 value: 9
            -- key: 3 value: payload
            -- key: 4 value: {\"userId\":\"12\"}
            -- key: 5 value: createdDt
            -- key: 6 value: 2020-04-11T12:55:05.547Z
            -- key: 7 value: updatedDt
            -- key: 8 value: 2020-04-11T12:55:07.473Z"
            -- key: 9 value: receiveCount"
            -- key: 10 value: 2"
            -- key: 11 value: receivedDt"
            -- key: 12 value: 2020-04-11T12:55:07.473Z"

            if (raw_data ~= nil) then
                -- Time complexity: O(1) for each field/value pair added.
                -- See the https://redis.io/commands/hset link
                -- As a result, we can iterate hash - we have the O(N) time complexity in any case.
                for idx = 1, #raw_data, 2 do
                    redis.call('hset', deadMessageKey, raw_data[idx], raw_data[idx + 1]);
                end

                -- remove the meesage by its key (e.g. createUser:deadMessage:2)
                redis.call('del', messageKey);

                -- hset("createUser:deadMessage:2", "updatedDt", "1584480486476")
                redis.call("hset", deadMessageKey, updatedDtFieldName, updatedDt)

                -- update the metric
                redis.call("hincrby", metricsQueue, numberOfMessagesDeadFieldName, 1)

                operationResult = true
            end
        end
    end

    return operationResult
end

return (moveMessageToDeadQueue(KEYS[1], KEYS[2], KEYS[3], KEYS[4], ARGV[1], ARGV[2], ARGV[3], ARGV[4]))
