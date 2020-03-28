local function returnMessageToPublishedQueue(k1, k2, k3, a1, a2, a3)
    if (k1 == nil or k2 == nil or k3 == nill or a1 == nil or a2 == nil or a3 == nil) then 
        error("argument cannot be nil: " .. k1 .. k2 .. k3 .. a1 .. a2 .. a3)
    end
    
    local operationResult = false
    if redis.call("exists", KEYS[1]) == 1 then        
        --hset("queueName:message:1", "updatedDt", "1584480486476")
        redis.call("hset", KEYS[1], ARGV[1], ARGV[2])
        
        --lrem(this.processing, 0, messageId)
        local removeResult = redis.call("lrem", KEYS[2], 0, ARGV[3]) 
        
        if removeResult >= 1 or (type(removeResult) == "boolean" and removeResult) then 
            --lpush(this.published, messageId)
            redis.call("lpush", KEYS[3], ARGV[3])
            operationResult = true
        end
    end

    return operationResult
end

return (getMessageFromQueue(KEYS[1], KEYS[2], KEYS[3], ARGV[1], ARGV[2], ARGV[3]))
