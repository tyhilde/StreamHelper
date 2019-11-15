// Used to test calling the util functions

var utils = require('../modules/utils');
const {ClientAccessToken} = require('../secrets/credentials');

// utils.getUser(ClientAccessToken, (res) => {
//     console.log('getuser res', res);
// })

async function isStreamLive() {
    var res = await utils.isStreamLive(ClientAccessToken);
    console.log('isStreamLive res', res);
};

async function getStreamUpTime() {
    var res = await utils.getStreamUpTime(ClientAccessToken);
    console.log('getStreamUpTime res', res);
};

async function getFollowers() {
    var res = await utils.getFollowers(ClientAccessToken);
    console.log('getFollowers res', res);
};

async function getFollowersCount() {
    var res = await utils.getFollowersCount(ClientAccessToken);
    console.log('getFollowersCount res', res);
};

async function getFollowersLast() {
    var res = await utils.getFollowersLast(ClientAccessToken);
    console.log('getFollowersLast res', res);
};

async function getFollowersLastFive() {
    var res = await utils.getFollowersLastFive(ClientAccessToken);
    console.log('getFollowersLastFive res', res);
};

async function getViewerCount() {
    var res = await utils.getViewerCount(ClientAccessToken);
    console.log('getViewerCount res', res);
};

async function getSubscribersNew() {
    var res = await utils.getSubscribersNew(ClientAccessToken, '');
    console.log('getSubscribersNew res', res);
};

async function getSubscribersLast() {
    var res = await utils.getSubscribersLast(ClientAccessToken);
    console.log('getSubscribersLast res', res);
};

async function getSubscribersLastFive() {
    var res = await utils.getSubscribersLastFive(ClientAccessToken);
    console.log('getSubscribersLastFive res', res);
};

async function getSubscribersCount() {
    var res = await utils.getSubscribersCount(ClientAccessToken);
    console.log('getSubscribersCount res', res);
};

// isStreamLive();
// getStreamUpTime();
// getFollowers();
// getFollowersCount();
// getFollowersLast();
// getFollowersLastFive();
// getViewerCount();
// getSubscribersNew();
// getSubscribersLast();
// getSubscribersLastFive();
getSubscribersCount();

// utils.getSubscribers(ClientAccessToken, (res) => {
//     console.log('old getSubscribers res', res);
//     console.log('old getSubscribers res', res.subscriptions);
// })

// utils.createClip(ClientAccessToken, (res) => {
//     console.log('createClip res', res);
// })

// utils.sendTwitchMessage('someMessage test', 'backsh00ter',  (res) => {
//     console.log('sendTwitchMessage res', res);
// })