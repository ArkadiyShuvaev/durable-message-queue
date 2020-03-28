-- KEYS[1] - the key of the published messages queue
-- KEYS[2] - the key of the processing messages queue
-- KEYS[3] - the resource name prefix for the Redis key that stores all message keys (e.g. "registrations:message:")
-- ARGV[1] - the name of the field is updated when a message is retrieved from the published queue (e.g. receivedDt)
-- ARGV[2] - the value that should be assigned to the ARGV[1]

local function getMessageFromQueue(k1, k2, k3, a1, a2)
    if (k1 == nil or k2 == nil or k3 == nil or a1 == nil or a2 == nil) then 
        error("argument cannot be nil: " .. k1 .. k2 .. k3 .. a1 .. a2)
    end
    
    local result = nil
    --rpoplpush("queueName:publishedIds", "queueName:processingIds");
    local messageId = redis.call("rpoplpush", k1, k2)
    
    if (messageId == nil or (type(messageId) == "boolean" and not messageId)) then
        return result
    end

    local messageKey = k3..messageId
    if redis.call("exists", messageKey) == 1 then
        --hset("queueName:message:1", "receivedDt", "1584480486476")
        redis.call("hset", messageKey, a1, a2)
        --hgetall(dataKey)
        result = redis.call("hgetall", messageKey)
    end
    
    return result
end

return (getMessageFromQueue(KEYS[1], KEYS[2], KEYS[3], ARGV[1], ARGV[2]))
