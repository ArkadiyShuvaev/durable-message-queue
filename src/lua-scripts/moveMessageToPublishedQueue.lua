local function moveMessageToPublishedQueue(messageResourceName, moveFrom, moveTo, metricsQueue,
    numberOfMessagesReturnedFieldName, receivedDtFieldName, updatedDtFieldName, updatedDt, messageId)

    if (messageResourceName == nil or moveFrom == nil or moveTo == nil or metricsQueue == nil
            or receivedDtFieldName == nil or updatedDtFieldName == nil or updatedDt == nil or messageId == nil) then
        error("argument cannot be nil: " .. messageResourceName .. moveFrom .. moveTo .. metricsQueue
                .. receivedDtFieldName  .. updatedDtFieldName .. updatedDt .. messageId)
    end

    local operationResult = false
    if redis.call("exists", messageResourceName) == 1 then

        --hset("queueName:message:1", "updatedDt", "1584480486476")
        redis.call("hset", messageResourceName, updatedDtFieldName, updatedDt)

        --hdel("queueName:message:1", "receivedDt")
        redis.call("hdel", messageResourceName, receivedDtFieldName)

        --lrem(this.processing, 0, messageId)
        local removeFromResult = redis.call("lrem", moveFrom, 0, messageId)

        if removeFromResult >= 1 or (type(removeFromResult) == "boolean" and removeFromResult) then
            --lpush(this.published, messageId)
            redis.call("lpush", moveTo, messageId)

            --hincrby("queueName:metricsQueue", "numberOfMessagesReturned", 1)
            redis.call("hincrby", metricsQueue, numberOfMessagesReturnedFieldName, 1)

            operationResult = true
        end
    end

    return operationResult
end

return (moveMessageToPublishedQueue(KEYS[1], KEYS[2], KEYS[3], KEYS[4], ARGV[1], ARGV[2], ARGV[3], ARGV[4], ARGV[5]))
