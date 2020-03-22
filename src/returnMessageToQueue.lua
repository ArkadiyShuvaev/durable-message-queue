if redis.call("exists", KEYS[1]) == 1
    then 
        redis.call("hset", KEYS[1], ARGV[1], ARGV[2]) --hset("queueName:data:1", "updatedDt", "1584480486476")
        redis.call("lrem", KEYS[2], 0, ARGV[3])       --lrem(this.processingQueue, 0, jobId)
        redis.call("lpush", KEYS[3], ARGV[3])         --lpush(this.publishedQueue, jobId)
        return true
    else
        return false
end
