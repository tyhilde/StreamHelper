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

// isStreamLive();
// getStreamUpTime();
// getFollowers();
// getFollowersCount();
// getFollowersLast();
getFollowersLastFive();

// utils.getViewerCount(ClientAccessToken, (res) => {
//     console.log('getViewerCount res', res);
// })

// utils.getSubscribers(ClientAccessToken, (res) => {
//     console.log('old getSubscribers res', res);
//     console.log('old getSubscribers res', res.subscriptions);
// })

// utils.getSubscribersNew(ClientAccessToken, '', (res) => {
//     console.log('new getSubscribers res', res);
//     // console.log('new getSubscribers res', res.data);
// })

// utils.getSubscribersCountNew(ClientAccessToken, (res) => {
//     console.log('new getSubscribersCountNew res', res);
// })

// utils.getSubscribersCount(ClientAccessToken, (res) => {
//     console.log('getSubscribersCount res', res);
// })

// utils.getSubscribersLast(ClientAccessToken, (res) => {
//     console.log('getSubscribersLast res', res);
// })

// utils.getSubscribersLastFive(ClientAccessToken, (res) => {
//     console.log('getSubscribersLastFive res', res);
// })

// utils.createClip(ClientAccessToken, (res) => {
//     console.log('createClip res', res);
// })

// utils.sendTwitchMessage('someMessage test', 'backsh00ter',  (res) => {
//     console.log('sendTwitchMessage res', res);
// })