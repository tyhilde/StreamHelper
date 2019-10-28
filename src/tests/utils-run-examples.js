// Used to test calling the util functions

var utils = require('../modules/utils');
const {ClientAccessToken} = require('../secrets/credentials');

// utils.getUser(ClientAccessToken, (res) => {
//     console.log('getuser res', res);
// })

async function testFunc() {
    // var res = await utils.getUser(ClientAccessToken);
    // console.log('res', res);

    var res = await utils.isStreamLiveAsync(ClientAccessToken);
    console.log('streamLive res', res);
};
testFunc();

// utils.isStreamLive(ClientAccessToken, (res) => {
//     console.log('streamLive res', res);
// })

// utils.getStreamUpTime(ClientAccessToken, (res) => {
//     console.log('getStreamupTime res', res);
// })

// utils.getFollowers(ClientAccessToken, (res) => {
//     console.log('getFollowers res', res);
// });

// utils.getFollowersCount(ClientAccessToken, (res) => {
//     console.log('followersCount res', res);
// })

// utils.getFollowersLast(ClientAccessToken, (res) => {
//     console.log('getFollowersLast res', res);
// })

// utils.getFollowersLastFive(ClientAccessToken, (res) => {
//     console.log('getFollowersLastFive res', res);
// })

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