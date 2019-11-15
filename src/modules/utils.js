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

function getPath({path, userId, pageCursor}) {
    const paths = {
        user: `/helix/users`,
        stream: `/helix/streams?user_id=${userId}`,
        followers: `/helix/users/follows?to_id=${userId}`,
        subscribers: `/helix/subscriptions?broadcaster_id=${userId}&first=100&after=${pageCursor}`,
        subscribersMostRecent: `/helix/subscriptions?broadcaster_id=${userId}&first=1`,
        subscribersLastFive: `/helix/subscriptions?broadcaster_id=${userId}&first=5`,
        createClip: `/helix/clips?broadcaster_id=${userId}`,
    };

    return paths[path];
}

async function asyncFetch({endpoint, method, accessToken, userId, pageCursor}) {
    const path = getPath({path: endpoint, userId, pageCursor});
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

async function getUser(accessToken) {
    const res = await asyncFetch({
        endpoint: 'user',
        method: 'GET',
        accessToken
    });

    return {
        userId: res.data[0].id,
        userName: res.data[0].display_name
    };
}

async function isStreamLive(accessToken) {
    const user = await getUser(accessToken);
    const result = await asyncFetch({
        endpoint: 'stream',
        method: 'GET',
        accessToken,
        userId: user.userId
    });

    const isLive = !!(result.data[0]);
    return isLive;
}

async function getStreamUpTime(accessToken) {
    const user = await getUser(accessToken);
    const result = await asyncFetch({
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
    const user = await getUser(accessToken);
    const result = await asyncFetch({
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
    const user = await getUser(accessToken);
    const result = await asyncFetch({
        endpoint: 'stream',
        method: 'GET',
        accessToken,
        userId: user.userId
    });

    const count = result.data[0] ? result.data[0].viewer_count : 0;
    return count;
}

// TODO: Need to update the account linking and add more params
//Returns one page (up to 100) at a time
async function getSubscribers(accessToken, pageCursor = '') {
    const user = await getUser(accessToken);
    const result = await asyncFetch({
        endpoint: 'subscribers',
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
        const pageResult = await getSubscribers(accessToken, cursor);

        cursor = pageResult.pagination.cursor;
        count = count + pageResult.data.length;
        shouldKeepPaging = !!(pageResult.data.length);
    }

    return count;
}

// This won't be the TRUE last subscriber until Twitch update endpoint to make this possible (currently doesnt allow sorting)
async function getSubscribersLast(accessToken) {
    const user = await getUser(accessToken);
    const result = await asyncFetch({
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
    const user = await getUser(accessToken);
    const result = await asyncFetch({
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

async function createClip(accessToken) {
    const user = await getUser(accessToken);
    const result = await asyncFetch({
        endpoint: 'createClip',
        method: 'POST',
        accessToken,
        userId: user.userId
    });

    return {
        userName: user.userName,
        clip: result.data ? result.data[0] : STREAM_OFFLINE
    };
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
