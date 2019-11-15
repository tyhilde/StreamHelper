const https = require('https');
const tmi = require('tmi.js');
const fetch = require('node-fetch');

const {
    TwitchBotPassword
} = require('../secrets/credentials');
const STREAM_OFFLINE = 'STREAM_OFFLINE';
const NO_FOLLOWERS = 'NO_FOLLOWERS';
const NO_SUBSCRIBERS = 'NO_SUBSCRIBERS';

function isAccessTokenValid(accessToken) {
    return !!(accessToken);
}

function getPath({path, userName, userId, accessToken, pageCursor}) {
    const paths = { // using helix api
        user: `/helix/users`,
        stream: `/helix/streams?user_id=${userId}`,
        followers: `/helix/users/follows?to_id=${userId}`,
        subscribers: '/kraken/channels/' + userName + '/subscriptions?oauth_token=' + accessToken + "&direction=desc", //TODO: Deprecate: Update to helix once added to API
        subscribersNew: `/helix/subscriptions?broadcaster_id=${userId}&first=100&after=${pageCursor}`, // TODO: Might need pass &user_id as well, &after={cursor} to get following pages
        subscribersMostRecent: `/helix/subscriptions?broadcaster_id=${userId}&first=1`,
        subscribersLastFive: `/helix/subscriptions?broadcaster_id=${userId}&first=5`,
        createClip: `/helix/clips?broadcaster_id=${userId}`,
    };

    return paths[path];
}

// TODO: Deprecate / remove
function fetchJson({endpoint, method, accessToken, userName, userId, pageCursor}, callback) {
    var path = getPath({path: endpoint, userName, userId, accessToken, pageCursor});

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

// TODO: After all functions moved to using async version of getUser and fetchJson, remove old and rename
async function newAsyncFetch({endpoint, method, accessToken, userName, userId, pageCursor}) {
    const path = getPath({path: endpoint, userName, userId, accessToken, pageCursor});
    const options = {
        host: 'api.twitch.tv',
        port: 443,
        path: path,
        method: method,
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    };
    const absoluteUrl = 'https://api.twitch.tv' + path;

    try {
        const data = await fetch(absoluteUrl, options);
        const jsonData = await data.json();
    
        return jsonData;
    } catch(error) {
        console.log('Error fetching: ', error);
        return 'Error fetching'; // TODO: Better way to handle failures
    }
}

// TODO: After all functions moved to using async version of getUser and fetchJson, remove old and rename
async function getUserAsync(accessToken) {
    const res = await newAsyncFetch({
        endpoint: 'user',
        method: 'GET',
        accessToken
    });

    return {
        userId: res.data[0].id,
        userName: res.data[0].display_name
    };
}

function getUser(accessToken, callback) {
    fetchJson({
        endpoint: 'user',
        method: 'GET',
        accessToken
    }, (res) => {
        callback({
            userId: res.data[0].id,
            userName: res.data[0].display_name
        });
    });  
}

async function isStreamLive(accessToken) {
    const user = await getUserAsync(accessToken);
    const result = await newAsyncFetch({
        endpoint: 'stream',
        method: 'GET',
        accessToken,
        userId: user.userId
    });

    const isLive = !!(result.data[0]);
    return isLive;
}

async function getStreamUpTime(accessToken) {
    const user = await getUserAsync(accessToken);
    const result = await newAsyncFetch({
        endpoint: 'stream',
        method: 'GET',
        accessToken,
        userId: user.userId
    });

    const streamIsLive = !!(result.data[0]);

    if(streamIsLive) {
        const streamStart = result.data[0].started_at;
        const startDate = new Date(streamStart);
        const currentDate = new Date();
        
        const totalMinsUptime = Math.floor((currentDate - startDate) / (1000 * 60));

        const uptime = {
            minutes: totalMinsUptime % 60,
            hours: Math.floor(totalMinsUptime / 60)
        }

        return uptime;
    }
    else {
        return STREAM_OFFLINE;
    }
}

async function getFollowers(accessToken) {
    const user = await getUserAsync(accessToken);
    const result = await newAsyncFetch({
        endpoint: 'followers',
        method: 'GET',
        accessToken,
        userId: user.userId
    });

    return result;
}

async function getFollowersCount(accessToken) {
    const followers = await getFollowers(accessToken);

    return followers.total;
}

async function getFollowersLast(accessToken) {
    const followers = await getFollowers(accessToken);

    const follower = followers.total === 0 ? NO_FOLLOWERS : followers.data[0].from_name;
    return follower;
}

async function getFollowersLastFive(accessToken) {
    const followers = await getFollowers(accessToken);

    const lastFiveFollowers = followers.total === 0 ?
        NO_FOLLOWERS : 
        followers.data.slice(0, 5).map(follower => {
            return follower.from_name;
        });
 
    return lastFiveFollowers;
}

async function getViewerCount(accessToken) {
    const user = await getUserAsync(accessToken);
    const result = await newAsyncFetch({
        endpoint: 'stream',
        method: 'GET',
        accessToken,
        userId: user.userId
    });

    const count = result.data[0] ? result.data[0].viewer_count : 0;
    return count;
}

function getSubscribers(accessToken, callback) {
    getUser(accessToken, (user) => {
        fetchJson({
            endpoint: 'subscribers',
            method: 'GET',
            accessToken,
            userName: user.userName
        }, (res) => {
            callback(res);
        });
    });
}

// TODO: Need to update the account linking and add more params
// TODO: Verify what response looks like for zero subs - just returns empty array same shape
// TODO: what response looks like for non partner/affiliate - just returns empty array same shape
// TODO: getsubscribers count will need to use ?after=paginationCursor
// TODO: getsubscribersLast should be able to use ?first=1 (to get last sub)
// TODO: wait to here back on forum about returning in order
// Getsubscribersnew func will return first page (up to 100)

async function getSubscribersNew(accessToken, pageCursor = '') {
    const user = await getUserAsync(accessToken);
    const result = await newAsyncFetch({
        endpoint: 'subscribersNew',
        method: 'GET',
        accessToken,
        userId: user.userId,
        pageCursor
    });

    return result;
}

async function getSubscribersCount(accessToken) {
    let shouldKeepPaging = true;
    let count = 0;
    let cursor = '';

    while(shouldKeepPaging) {
        const pageResult = await getSubscribersNew(accessToken, cursor);

        cursor = pageResult.pagination.cursor;
        count = count + pageResult.data.length;
        shouldKeepPaging = !!(pageResult.data.length);
    }

    return count;
}

// This won't be the TRUE last subscriber until Twitch update endpoint to make this possible (currently doesnt allow sorting)
async function getSubscribersLast(accessToken) {
    const user = await getUserAsync(accessToken);
    const result = await newAsyncFetch({
        endpoint: 'subscribersMostRecent',
        method: 'GET',
        accessToken,
        userId: user.userId,
    });
    // Returns empty array {data: []}, if not parternered or no subs
    const subscriberName = result.data.length && result.data[0].user_name;

    return subscriberName || NO_SUBSCRIBERS;
}

// This won't be the TRUE last five subscribers until Twitch update endpoint to make this possible (currently doesnt allow sorting)
async function getSubscribersLastFive(accessToken) {
    const user = await getUserAsync(accessToken);
    const result = await newAsyncFetch({
        endpoint: 'subscribersLastFive',
        method: 'GET',
        accessToken,
        userId: user.userId,
    });

    if(!result.data.length) {
        return NO_SUBSCRIBERS;
    }

    const lastFiveSubscribers = result.data.map(subscriber => {
        return subscriber.user_name;
    })

    return lastFiveSubscribers;
}

function createClip(accessToken, callback) {
    getUser(accessToken, (user) => {
        fetchJson({
            endpoint: 'createClip',
            method: 'POST',
            accessToken,
            userId: user.userId
        }, (res) => {
            const clip = res.data ? res.data[0] : "STREAM_OFFLINE";
            const val = {
                userName: user.userName,
                clip
            }

            callback(val);
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
    getUser: getUser,
    getFollowers: getFollowers,
    getFollowersCount: getFollowersCount,
    getFollowersLast: getFollowersLast,
    getFollowersLastFive: getFollowersLastFive,
    getViewerCount: getViewerCount,
    getSubscribers: getSubscribers,
    getSubscribersNew: getSubscribersNew,
    getSubscribersCount: getSubscribersCount,
    getSubscribersLast: getSubscribersLast,
    getSubscribersLastFive: getSubscribersLastFive,
    getStreamUpTime: getStreamUpTime,
    createClip: createClip,
    sendTwitchMessage: sendTwitchMessage,
    STREAM_OFFLINE,
    NO_FOLLOWERS,
    NO_SUBSCRIBERS
};
