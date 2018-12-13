const https = require('https');
const tmi = require('tmi.js');

const {
    TwitchAppClientId,
    TwitchBotPassword
} = require('../secrets/credentials');

function isAccessTokenValid(accessToken) {
    return !!(accessToken);
}

function getPath({path, userName, userId, accessToken}) {
    const paths = {
        userId: `/helix/users`,
        basicInfo: `/kraken/channels/${userName}?oauth_token=${accessToken}`,
        followers: `/kraken/channels/${userName}/follows?oauth_token=${accessToken}`,
        viewers: '/kraken/streams/' + userName + '?oauth_token=' + accessToken,
        subscribers: '/kraken/channels/' + userName + '/subscriptions?oauth_token=' + accessToken + "&direction=desc",
        userName: '/kraken?oauth_token=' + accessToken + '&client_id=' + TwitchAppClientId,
        live: `/kraken/streams/${userName}?client_id=${TwitchAppClientId}`,
        createClip: '/helix/clips?broadcaster_id=' + userId,
        default: '/kraken/channels/' + userName + '?oauth_token=' + accessToken,
        newLive: '/helix/users?login=backsh00ter'
    };

    return paths[path];
}

function fetchJson({endpoint, method, accessToken, userName, userId}, callback) {
    var path = getPath({path: endpoint, userName, userId, accessToken});

    var options = {
        host: 'api.twitch.tv',
        port: 443,
        path: path,
        method: method,
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    };

    var req = https.request(options, (res) => {
        var returnData = "";

        res.setEncoding('utf8');

        res.on('data', chunk => {
            returnData += chunk;
        });

        res.on('end', () => {
            if(returnData) {
                callback(JSON.parse(returnData));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    })
    req.end();
}

function getUserName(accessToken, callback) {
    fetchJson({
        endpoint: 'userName',
        method: 'GET',
        accessToken
    }, (res) => {
        const userName = res.token.user_name;
        callback(userName);
    });  
}

function getUserId(accessToken, callback) {
    fetchJson({
        endpoint: 'userId',
        method: 'GET',
        accessToken
    }, (res) => {
        callback({
            userId: res.data[0].id,
            userName: res.data[0].display_name
        });
    });
}

function isStreamLive(accessToken, callback) {
    getUserName(accessToken, (user) => {
        fetchJson({
            endpoint: 'live',
            method: 'GET',
            accessToken,
            userName: user
        }, (res) => {
            const isLive = !!(res.stream);
            callback(isLive);
        });
    });
}

function getStreamUpTime(accessToken, callback) {
    getUserName(accessToken, (user) => {
        fetchJson({
            endpoint: 'live',
            method: 'GET',
            accessToken,
            userName: user
        }, (res) => {
            const streamIsLive = !!(res.stream);
            if(streamIsLive) {
                const streamStart = res.stream.created_at;
                const startDate = new Date(streamStart);
                const currentDate = new Date();
                
                const totalMinsUptime = Math.floor((currentDate - startDate) / (1000 * 60));

                const uptime = {
                    minutes: totalMinsUptime % 60,
                    hours: Math.floor(totalMinsUptime / 60)
                }

                callback(uptime);
            }
            else {
                callback("STREAM_OFFLINE");
            }
        });
    });
}

function getFollowers(accessToken, callback) {
    getUserName(accessToken, (user) => {
        fetchJson({
            endpoint: 'followers',
            method: 'GET',
            accessToken,
            userName: user
        }, (res) => {
            callback(res);
        });
    });
}

function getFollowersCount(accessToken, callback) {
    getFollowers(accessToken, (followers) => {
        callback(followers._total);
    });
}

function getFollowersLast(accessToken, callback) {
    getFollowers(accessToken, (followers) => {
        callback(followers.follows[0].user.display_name);
    });
}

function getFollowersLastFive(accessToken, callback) {
    getFollowers(accessToken, (followers) => {
        const lastFiveFollowers = followers.follows.slice(0, 5).map(followers => {
            return followers.user.display_name;
        });

        callback(lastFiveFollowers); 
        //TODO: index file will handle the array.join for output speech, which will pass the array to the responses file
        // for the correct response based on 0, 1, 2-5 followers
    });
}

function getViewerCount(accessToken, callback) {
    getUserName(accessToken, (user) => {
        fetchJson({
            endpoint: 'viewers',
            method: 'GET',
            accessToken,
            userName: user
        }, (res) => {
            const count = res.stream ? res.stream.viewers : 0;
            callback(count);
        });
    });
}

function getSubscribers(accessToken, callback) {
    getUserName(accessToken, (user) => {
        fetchJson({
            endpoint: 'subscribers',
            method: 'GET',
            accessToken,
            userName: user
        }, (res) => {
            callback(res);
        });
    });
}

function getSubscribersCount(accessToken, callback) {
    getSubscribers(accessToken, (subscribers) => {
        const isPartnered = !!(subscribers._total);
        const count = isPartnered ? subscribers._total : "NOT_A_PARTNER";

        callback(count);
    });
}

function getSubscribersLast(accessToken, callback) {
    getSubscribers(accessToken, (subscribers) => {
        const isPartnered = !!(subscribers._total);
        // Counts self as first subscriber
        const lastSubscriber = subscribers._total > 1 ? subscribers.subscriptions[0].user.display_name : "NO_SUBSCRIBERS";
        
        callback(isPartnered ? lastSubscriber : "NOT_A_PARTNER");
    });
}

function getSubscribersLastFive(accessToken, callback) {
    getSubscribers(accessToken, (subscribers) => {
        const isPartnered = !!(subscribers._total);
        // Counts self as first subscriber, if less than 5 don't include self in output
        const endSlice = subscribers._total > 5 ? 5 : subscribers._total -1;
        const lastFiveSubscribers = subscribers.subscriptions && subscribers._total > 1 ?
            subscribers.subscriptions.slice(0, endSlice).map(subscribers => {
                return subscribers.user.display_name;
            }) :
            "NO_SUBSCRIBERS";

        callback(isPartnered ? lastFiveSubscribers : "NOT_A_PARTNER");
    });
}

function createClip(accessToken, callback) {
    getUserId(accessToken, (user) => {
        fetchJson({
            endpoint: 'createClip',
            method: 'POST',
            accessToken,
            userId: user.userId
        }, (res) => {
            const clip = res.data ? res.data[0] : "STREAM_OFFLINE";
            
            callback(clip);
        });
    })
}

function sendTwitchMessage(clipUrl, userName, callback) {
    var options = {
        options: {
            debug: true
        },
        connection: {
            cluster: "aws",
            reconnect: true
        },
        identity: { // Identity of user that is sending the message
            username: "twitchtoolsbot",
            password: TwitchBotPassword
        },
        channel: userName // Channel that receives message
    };

    var client = new tmi.client(options);

    client.connect().then(() => {
        client.say(options.channel, clipUrl).then(() => {
            client.disconnect()
        });
        callback("Message_Sent");
    }).catch(function(err) {
        console.log('Error detected trying to connect to chat:', err);
        client.disconnect();
        callback("Message_Failed_To_Send");
    });
}



module.exports = {
    isStreamLive: isStreamLive,
    isAccessTokenValid: isAccessTokenValid,
    getUserId: getUserId,
    getUserName: getUserName,
    getFollowers: getFollowers,
    getFollowersCount: getFollowersCount,
    getFollowersLast: getFollowersLast,
    getFollowersLastFive: getFollowersLastFive,
    getViewerCount: getViewerCount,
    getSubscribers: getSubscribers,
    getSubscribersCount: getSubscribersCount,
    getSubscribersLast: getSubscribersLast,
    getSubscribersLastFive: getSubscribersLastFive,
    getStreamUpTime: getStreamUpTime,
    createClip: createClip,
    sendTwitchMessage: sendTwitchMessage
};