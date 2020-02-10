const moment = require('moment');
const redis = require('redis');
const client = redis.createClient();

module.exports = (req,res,next) => {

    //Rate limit constants
    const maxLimit = 1000; //Max requests allowed
    const windowSize  = 15; //Window duration in minutes

    //Determine request keys for rate limit redis queries
    const currentMinute = moment().minute(),
          nearestQtrHr = Math.floor(currentMinute / windowSize) * windowSize,
          currentWindow = moment().minute(nearestQtrHr),  //Current rate limit time window
          previousWindow = moment(currentWindow).subtract(windowSize, "minutes"), //Previous window
          currentKey = req.connection.remoteAddress + '-' + moment(currentWindow).second(0).unix(), //Current window request key
          previousKey = req.connection.remoteAddress + '-' + moment(previousWindow).second(0).unix(), //Previous window request key
          weight = 1 - (currentMinute - nearestQtrHr) / 15; //How much to weight previous window's count

    //Make sure to increment first to avoid race conditions
    client.incr(currentKey, (err, result) => {
        if(err){res.sendStatus(500)}

        let newCount = result || 0;

        client.GET(previousKey, (err, result) => {
            if(err){res.sendStatus(500)}

            let prevCount = result || 0;
            let currentCount = newCount + Math.ceil(weight * prevCount);

            if(currentCount > maxLimit){ //Over the limit

                //Make sure to decrement since request have been denied
                client.decr(currentKey, (err, result) => {
                    if(err){res.sendStatus(500)}
                });

                //Deny request and respond with error message
                res.sendStatus(429)

            } else { //Approve request
                next()
            }
        });
    })
}