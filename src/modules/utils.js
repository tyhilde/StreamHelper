const https = require('https');
const tmi = require('tmi.js');

const {TwitchAppClientId} = require('../secrets/credentials');

function isAccessTokenValid(accessToken) {
    return !!(accessToken);
}

// TODO: stop passing clientId through and just directly use TwitchAppClientId
function getPath(path, userName, accessToken, clientId) {
    const paths = {
        userId: `/helix/users?login=${userName}`,
        basicInfo: `/kraken/channels/${userName}?oauth_token=${accessToken}`,
        followers: `/kraken/channels/${userName}/follows?oauth_token=${accessToken}`,
        viewers: '/kraken/streams/' + userName + '?oauth_token=' + accessToken,
        subscribers: '/kraken/channels/' + userName + '/subscriptions?oauth_token=' + accessToken + "&direction=desc",
        userName: '/kraken?oauth_token=' + accessToken + '&client_id=' + clientId,
        live: `/kraken/streams/${userName}?client_id=${clientId}`,
        createClip: '/helix/clips?broadcaster_id=' + userId,
        default: '/kraken/channels/' + userName + '?oauth_token=' + accessToken,
        newLive: '/helix/users?login=backsh00ter'
    };

    return paths[path];
}

function fetchJson({endpoint, method, accessToken, userName, clientId}, callback) {
    var path = getPath(endpoint, userName, accessToken, clientId);

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

const userId = '32799121';

function getUserName(accessToken, callback) {
    fetchJson({
        endpoint: 'userName',
        method: 'GET',
        accessToken,
        clientId: TwitchAppClientId
    }, (res) => {
        const userName = res.token.user_name;
        callback(userName);
    });  
}

function isStreamLive(accessToken, callback) {
    getUserName(accessToken, (user) => {
        fetchJson({
            endpoint: 'live',
            method: 'GET',
            accessToken,
            userName: user,
            clientId: TwitchAppClientId
        }, (res) => {
            const isLive = !!(res.stream);
            callback(isLive);
        });
    });
}

function getFollowers(accessToken, callback) {
    getUserName(accessToken, (user) => {
        fetchJson({
            endpoint: 'followers',
            method: 'GET',
            accessToken,
            userName: user,
            clientId: TwitchAppClientId
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


module.exports = {
    isStreamLive: isStreamLive,
    isAccessTokenValid: isAccessTokenValid,
    // getUserId: getUserId,
    getUserName: getUserName,
    getFollowers: getFollowers,
    getFollowersCount: getFollowersCount,
    getFollowersLast: getFollowersLast,
    getFollowersLastFive: getFollowersLastFive
    // getFollowers: getFollowers,
    // getViewers: getViewers,
    // getSubscribers: getSubscribers,
    // createClip: createClip,
    // sendTwitchMessage: sendTwitchMessage
};