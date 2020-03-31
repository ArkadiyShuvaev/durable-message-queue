local function getMessageFromQueue(moveFrom, moveTo, messageResourceNamePrefix, statisticsQueue,
    numberOfMessagesReceivedFieldName, receiveCountFieldName, receivedDtFieldName,
    updatedDtFieldName, receivedDt, updatedDt)

    if (moveFrom == nil or moveTo == nil or messageResourceNamePrefix == nil
        or receiveCountFieldName == nil or receivedDtFieldName == nil or updatedDtFieldName == nil
        or receivedDt == nil or updatedDt == nil) then
        error("argument cannot be nil: " .. moveFrom .. moveTo .. messageResourceNamePrefix
            .. receiveCountFieldName .. receivedDtFieldName .. updatedDtFieldName
            .. receivedDt .. updatedDt)
    end

    local result = nil
    --rpoplpush("queueName:publishedIds", "queueName:processingIds");
    local messageId = redis.call("rpoplpush", moveFrom, moveTo)

    if (messageId == nil or (type(messageId) == "boolean" and not messageId)) then
        return result
    end

    local messageResourceName = messageResourceNamePrefix..messageId
    if redis.call("exists", messageResourceName) == 1 then

        local receiveCount = redis.call("hget", messageResourceName, receiveCountFieldName)
        redis.call("echo", tostring(receiveCount))
        if (receiveCount == nil or (type(receiveCount) == "boolean" and not receiveCount)) then
            error("The " .. receiveCountFieldName .. " cannot be found.")
        end

        receiveCount = receiveCount + 1
        --hset("queueName:message:1", "receiveCount", "2")
        redis.call("hset", messageResourceName, receiveCountFieldName, receiveCount)

        --hset("queueName:message:1", "receivedDt", "1584480486476")
        redis.call("hset", messageResourceName, receivedDtFieldName, receivedDt)

        --hset("queueName:message:1", "updatedDt", "1584480486476")
        redis.call("hset", messageResourceName, updatedDtFieldName, updatedDt)

        --hincrby("queueName:statisticsQueue", "numberOfMessagesSent", 1)
        redis.call("hincrby", statisticsQueue, numberOfMessagesReceivedFieldName, 1)

        --hgetall(dataKey)
        result = redis.call("hgetall", messageResourceName)
    end

    return result
end

return (getMessageFromQueue(KEYS[1], KEYS[2], KEYS[3], KEYS[4], ARGV[1], ARGV[2], ARGV[3], ARGV[4], ARGV[5], ARGV[6]))
