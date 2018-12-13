const assert = require('assert');
const utils = require('../utils');
const nock = require('nock');

const {TwitchAppClientId} = require('../../secrets/credentials');

const accessToken = 'testAccessToken';
const userName = 'test_user';
const userId = '123456789';

const userNameNock = nock('https://api.twitch.tv')
    .persist()
    .get('/kraken?oauth_token=' + accessToken + '&client_id=' + TwitchAppClientId)
    .reply(200, {token: {user_name: userName}});

const userIdNock = nock('https://api.twitch.tv')
    .persist()
    .get('/helix/users')
    .reply(200, {data: [{id: userId, display_name: userName}]});

// TODO: Later, test each of the util functions
// On the async tests, need to call done() to mark end of async requests

describe('isAccessTokenValid', () => {
    it('returns true when token exists', () => {
        assert.equal(utils.isAccessTokenValid('testToken'), true);
    });

    it('returns false when token is null', () => {
        assert.equal(utils.isAccessTokenValid(null), false);
    })

    it('returns false when token is undefined', () => {
        assert.equal(utils.isAccessTokenValid(), false);
    })
})

describe('getUserName', () => {
    it('returns the userName', (done) => {
        utils.getUserName(accessToken, (res) => {
            assert.equal(res, 'test_user');
            done();
        });
    });
});

describe('getUserId', () => {
    it('returns the userId', (done) => {
        utils.getUserId(accessToken, (res) => {
            assert.deepEqual(res, {userId: userId, userName: userName});
            done();
        });
    });
});

describe('isStreamLive', () => {
    it('returns true when it is live', (done) => {
        nock('https://api.twitch.tv')
            .get(`/kraken/streams/${userName}?client_id=${TwitchAppClientId}`)
            .reply(200, {stream: 'info'});

        utils.isStreamLive(accessToken, (res) => {
            assert.equal(res, true);
            done();
        });
    });

    it('returns false when it is not live', (done) => {
        nock('https://api.twitch.tv')
            .get(`/kraken/streams/${userName}?client_id=${TwitchAppClientId}`)
            .reply(200, {stream: null});

        utils.isStreamLive(accessToken, (res) => {
            assert.equal(res, false);
            done();
        });
    });
});

describe('getStreamUpTime', () => {
    it('returns STREAM_OFFLINE if stream isnt up', (done) => {
        nock('https://api.twitch.tv')
            .get(`/kraken/streams/${userName}?client_id=${TwitchAppClientId}`)
            .reply(200, {stream: null});

        utils.getStreamUpTime(accessToken, (res) => {
            assert.equal(res, 'STREAM_OFFLINE');
            done();
        });
    });

    it('returns the stream up time', (done) => {
        nock('https://api.twitch.tv')
            .get(`/kraken/streams/${userName}?client_id=${TwitchAppClientId}`)
            .reply(200, {stream: {created_at: "2018-12-13T05:30:00Z"}});

        utils.getStreamUpTime(accessToken, (res) => {
            const startDate = new Date("2018-12-13T05:30:00Z");
            const currentDate = new Date();
            const totalMins = Math.floor((currentDate - startDate) / (1000 * 60));
            const uptime = {
                minutes: totalMins % 60,
                hours: Math.floor(totalMins / 60)
            };

            assert.deepEqual(res, uptime);
            done();
        });
    });
});

describe('followers', () => {
    const followerResponse = {
        _total: 6,
        _links: {},
        follows: [
            { user: { display_name: 'follower1' }},
            { user: { display_name: 'follower2' }},
            { user: { display_name: 'follower3' }},
            { user: { display_name: 'follower4' }},
            { user: { display_name: 'follower5' }},
            { user: { display_name: 'follower6' }}
        ]
    };
    
    describe('getFollowers', () => {
        it('returns object containing followers', (done) => {
            const followersNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/follows?oauth_token=${accessToken}`)
                .reply(200, followerResponse);

            utils.getFollowers(accessToken, (res) => {
                assert.deepEqual(res, followerResponse);
                done();
            });
        });
    });

    describe('getFollowersCount', () => {
        it('returns the count of followers', (done) => {
            const followersNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/follows?oauth_token=${accessToken}`)
                .reply(200, followerResponse);
            
            utils.getFollowersCount(accessToken, (res) => {
                assert.equal(res, followerResponse._total);
                done();
            });
        });
    });

    describe('getFollowersLast', () => {
        it('returns the last follower', (done) => {
            const followersNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/follows?oauth_token=${accessToken}`)
                .reply(200, followerResponse);
            
            utils.getFollowersLast(accessToken, (res) => {
                assert.equal(res, followerResponse.follows[0].user.display_name);
                done();
            });
        });
    });

    describe('getFollowersLastFive', () => {
       it('returns an array of the last five followers', (done) => {
            const followersNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/follows?oauth_token=${accessToken}`)
                .reply(200, followerResponse);
        
            utils.getFollowersLastFive(accessToken, (res) => {
                assert.deepEqual(res, ['follower1', 'follower2', 'follower3', 'follower4', 'follower5']);
                done();
            });
        });

        it('returns an array of the last two followers if there are only 2', (done) => {
            const followerResponseTwo = {
                _total: 2,
                _links: {},
                follows: [
                    { user: { display_name: 'follower1' }},
                    { user: { display_name: 'follower2' }}
                ]
            };
            
            nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/follows?oauth_token=${accessToken}`)
                .reply(200, followerResponseTwo);

            utils.getFollowersLastFive(accessToken, (res) => {
                assert.deepEqual(res, ['follower1', 'follower2']);
                done();
            });
        });
    });
});

describe('viewers', () => {
    describe('getViewerCount', () => {
        it('returns the count of viewers when stream is live', (done) => {
            const viewerResponse = {
                stream: {
                    viewers: 50
                }
            };

            const viewersNock = nock('https://api.twitch.tv')
                .get(`/kraken/streams/${userName}?oauth_token=${accessToken}`)
                .reply(200, viewerResponse);

            utils.getViewerCount(accessToken, (res) => {
                assert.equal(res, viewerResponse.stream.viewers);
                done();
            });
        });

        it('returns 0 when there are no viewers', (done) => {
            const viewerResponse = {
                stream: null
            };

            const viewersNock = nock('https://api.twitch.tv')
                .get(`/kraken/streams/${userName}?oauth_token=${accessToken}`)
                .reply(200, viewerResponse);

            utils.getViewerCount(accessToken, (res) => {
                assert.deepEqual(res, 0);
                done();
            });
        });
    });
});

describe('subscribers', () => {
    const subscriberResponse = {
        _total: 2,
        subscriptions: [
            {
                user: {
                    display_name: 'user1'
                }, 
            },
            {
                user: {
                    display_name: 'user2'
                }, 
            }
        ]
    };

    describe('getSubscribers', () => {
        it('returns object containing subscribers', (done) => {
            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberResponse);

            utils.getSubscribers(accessToken, (res) => {
                assert.deepEqual(res, subscriberResponse);
                done();
            });
        });
    });

    describe('getSubscribersCount', () => {
        it('returns the count of subscribers', (done) => {
            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberResponse);

            utils.getSubscribersCount(accessToken, (res) => {
                assert.deepEqual(res, subscriberResponse._total);
                done();
            });
        });

        it('returns the NOT_A_PARTNER when user is not partnered', (done) => {
            const subscriberNotAPartnerResponse = {
                error: "Bad request",
                status: 400
            };

            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberNotAPartnerResponse);

            utils.getSubscribersCount(accessToken, (res) => {
                assert.deepEqual(res, "NOT_A_PARTNER");
                done();
            });
        });
    });

    describe('getSubscribersLast', () => {
        it('returns the last subscriber', (done) => {
            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberResponse);

            utils.getSubscribersLast(accessToken, (res) => {
                assert.deepEqual(res, subscriberResponse.subscriptions[0].user.display_name);
                done();
            });
        });

        it('returns NO_SUBSCRIBERS if user doesnt have any subscribers', (done) => {
            const noSubscribersResponse = {
                _total: 1,
                subscriptions: [
                    {
                        user: {
                            display_name: 'user1'
                        }, 
                    }
                ]
            };

            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, noSubscribersResponse);

            utils.getSubscribersLast(accessToken, (res) => {
                assert.deepEqual(res, "NO_SUBSCRIBERS");
                done();
            });
        });

        it('returns the NOT_A_PARTNER when user is not partnered', (done) => {
            const subscriberNotAPartnerResponse = {
                error: "Bad request",
                status: 400
            };

            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberNotAPartnerResponse);

            utils.getSubscribersLast(accessToken, (res) => {
                assert.deepEqual(res, "NOT_A_PARTNER");
                done();
            });
        });
    });

    describe('getSubscribersLastFive', (done) => {
        it('returns the 1 subscriber if there are 2 including the user', (done) => {
            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberResponse);

            utils.getSubscribersLastFive(accessToken, (res) => {
                assert.deepEqual(res, ['user1']);
                done();
            });
        });

        it('returns the last 5 subscribers', (done) => {
            const subscriberManyResponse = {
                _total: 6,
                subscriptions: [
                    { user: { display_name: 'user1' }},
                    { user: { display_name: 'user2' }},
                    { user: { display_name: 'user3' }},
                    { user: { display_name: 'user4' }},
                    { user: { display_name: 'user5' }},
                    { user: { display_name: 'user6' }},
                ]
            };

            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberManyResponse);

            utils.getSubscribersLastFive(accessToken, (res) => {
                assert.deepEqual(res, ['user1', 'user2', 'user3', 'user4', 'user5']);
                done();
            });
        });

        it('returns NO_SUBSCRIBERS if the user doesnt have any subscribers', (done) => {
            const subscriberNoneResponse = {
                _total: 1,
                subscriptions: [
                    { user: { display_name: 'user1' }}
                ]
            };

            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberNoneResponse);

            utils.getSubscribersLastFive(accessToken, (res) => {
                assert.deepEqual(res, "NO_SUBSCRIBERS");
                done();
            });
        });

        it('returns NOT_A_PARTNER when user is not partnered', (done) => {
            const subscriberNotAPartnerResponse = {
                error: "Bad request",
                status: 400
            };

            const subscriberNock = nock('https://api.twitch.tv')
                .get(`/kraken/channels/${userName}/subscriptions?oauth_token=${accessToken}&direction=desc`)
                .reply(200, subscriberNotAPartnerResponse);

            utils.getSubscribersLastFive(accessToken, (res) => {
                assert.deepEqual(res, "NOT_A_PARTNER");
                done();
            });
        });
    });
});

describe('createClip', () => {
    it('returns the id and url of the created clip', (done) => {
        const createClipResponse = {
            data: [
                {
                    id: 'SomeRandomId',
                    edit_url: "http://clips.twitch.tv/SomeRandomId/edit"
                }
            ]
         };

         const createClipNock = nock('https://api.twitch.tv')
             .post(`/helix/clips?broadcaster_id=${userId}`)
             .reply(200, createClipResponse);
     
         utils.createClip(accessToken, (res) => {
             assert.deepEqual(res, createClipResponse.data[0]);
             done();
         });
    });

    it('returns STREAM_OFFLINE when the stream isnt live', (done) => {
        const streamOfflineResponse = {
            status: 404,
            error: 'Not found'
         };

         const createClipNock = nock('https://api.twitch.tv')
             .post(`/helix/clips?broadcaster_id=${userId}`)
             .reply(200, streamOfflineResponse);
     
         utils.createClip(accessToken, (res) => {
             assert.deepEqual(res, 'STREAM_OFFLINE');
             done();
         });
    });
});

// Not sure how to mock this request, it makes real request
// describe('sendTwitchMessage', () => {
//     it('sends the message', (done) => {
//         utils.sendTwitchMessage('someUrl', userName, (res) => {
//             assert.deepEqual(res, 'Message_Sent');
//             done();
//         });
//     });
// });
