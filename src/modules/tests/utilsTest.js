var utils = require('../utils');

// TODO: Replace the accessToken with credentials.accessToken
// Test calling util functions
// utils.getUserId((res) => {
//     console.log('userId res', res);
// })

// utils.getUserName('lhus3ijsnbqxatz1jk19gtedrxv5wt', (res) => {
//     console.log('userName res', res);
// })

// utils.isStreamLive('lhus3ijsnbqxatz1jk19gtedrxv5wt', (res) => {
//     console.log('streamLive res', res);
// })

utils.getFollowers('lhus3ijsnbqxatz1jk19gtedrxv5wt', (res) => {
    console.log('getFollowers res', res);
});

// utils.getFollowersCount('lhus3ijsnbqxatz1jk19gtedrxv5wt', (res) => {
//     console.log('followersCount res', res);
// })

// utils.getFollowersLast('lhus3ijsnbqxatz1jk19gtedrxv5wt', (res) => {
//     console.log('getFollowersLast res', res);
// })

// utils.getFollowersLastFive('lhus3ijsnbqxatz1jk19gtedrxv5wt', (res) => {
//     console.log('getFollowersLastFive res', res);
// })

// utils.getFollowers((res) => {
//     console.log('followers res', res);
// })

// utils.getViewers((res) => {
//     console.log('viewers res', res);
// })

// utils.getSubscribers((res) => {
//     console.log('subscribers res', res);
// })



// utils.createClip((res) => {
//     console.log('createClip res', res);
// })

// utils.sendTwitchMessage('someMessage test', 'backsh00ter',  (res) => {
//     console.log('sendTwitchMessage res', res);
// })

// var accTok = utils.isAcessTokenValid({accessToken: 'null'}, (res) => {
//     console.log('what it does');
// })

// console.log('accTok', accTok);
