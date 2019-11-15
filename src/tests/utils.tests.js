const assert = require('assert');
const utils = require('../modules/utils');
const nock = require('nock');

const accessToken = 'testAccessToken';
const userName = 'test_user';
const userId = '123456789';

const userNock = nock('https://api.twitch.tv')
    .persist()
    .get('/helix/users')
    .reply(200, {data: [{id: userId, display_name: userName}]});

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

describe('getUser', () => {
    it('returns the userId', (done) => {
        utils.getUser(accessToken, (res) => {
            assert.deepEqual(res, {userId: userId, userName: userName});
            done();
        });
    });
});

describe('isStreamLive', () => {
    it('returns true when it is live', async (done) => {
        nock('https://api.twitch.tv')
            .get(`/helix/streams?user_id=${userId}`)
            .reply(200, {data: [{id: 1234, user_id: 'user123'}]});

        const res = await utils.isStreamLive(accessToken);

        assert.equal(res, true);
        done();
    });

    it('returns false when it is not live', async (done) => {
        nock('https://api.twitch.tv')
            .get(`/helix/streams?user_id=${userId}`)
            .reply(200, {data: []});

        const res = await utils.isStreamLive(accessToken);

        assert.equal(res, false);
        done();
    });
});

describe('getStreamUpTime', () => {
    it('returns STREAM_OFFLINE if stream isnt up', async (done) => {
        nock('https://api.twitch.tv')
            .get(`/helix/streams?user_id=${userId}`)
            .reply(200, {data: []});

        const res = await utils.getStreamUpTime(accessToken);

        assert.equal(res, utils.STREAM_OFFLINE);
        done();
    });

    it('returns the stream up time', async (done) => {
        nock('https://api.twitch.tv')
            .get(`/helix/streams?user_id=${userId}`)
            .reply(200, {data: [{started_at: "2018-12-13T05:30:00Z"}]});

        const res = await utils.getStreamUpTime(accessToken);

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

describe('followers', () => {
    const followerResponse = {
        total: 6,
        data: [
            { from_name: 'follower1' },
            { from_name: 'follower2' },
            { from_name: 'follower3' },
            { from_name: 'follower4' },
            { from_name: 'follower5' },
            { from_name: 'follower6' }
        ]
    };

    const noFollowersResponse = {
        total: 0,
        data: []
    };
    
    describe('getFollowers', () => {
        it('returns object containing followers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/users/follows?to_id=${userId}`)
                .reply(200, followerResponse);

            const res = await utils.getFollowers(accessToken);

            assert.deepEqual(res, followerResponse);
            done();
        });
    });

    describe('getFollowersCount', () => {
        it('returns the count of followers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/users/follows?to_id=${userId}`)
                .reply(200, followerResponse);
            
            const res = await utils.getFollowersCount(accessToken);
                
            assert.equal(res, followerResponse.total);
            done();
        });
    });

    describe('getFollowersLast', () => {
        it('returns the last follower', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/users/follows?to_id=${userId}`)
                .reply(200, followerResponse);
            
            const res = await utils.getFollowersLast(accessToken);

            assert.equal(res, followerResponse.data[0].from_name);
            done();
        });

        it('returns the NO_FOLLOWERS if there are none', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/users/follows?to_id=${userId}`)
                .reply(200, noFollowersResponse);
            
            const res = await utils.getFollowersLast(accessToken);

            assert.equal(res, utils.NO_FOLLOWERS);
            done();
        });
    });

    describe('getFollowersLastFive', () => {
       it('returns an array of the last five followers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/users/follows?to_id=${userId}`)
                .reply(200, followerResponse);
        
            const res = await utils.getFollowersLastFive(accessToken);

            assert.deepEqual(res, ['follower1', 'follower2', 'follower3', 'follower4', 'follower5']);
            done();
        });

        it('returns an array of the last two followers if there are only 2', async (done) => {
            const followerResponseTwo = {
                total: 2,
                data: [
                    { from_name: 'follower1' },
                    { from_name: 'follower2' }
                ]
            };
            
            nock('https://api.twitch.tv')
                .get(`/helix/users/follows?to_id=${userId}`)
                .reply(200, followerResponseTwo);

            const res = await utils.getFollowersLastFive(accessToken);

            assert.deepEqual(res, ['follower1', 'follower2']);
            done();
        });

        it('returns the NO_FOLLOWERS if there are none', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/users/follows?to_id=${userId}`)
                .reply(200, noFollowersResponse);
            
            const res = await utils.getFollowersLastFive(accessToken);

            assert.equal(res, utils.NO_FOLLOWERS);
            done();
        });
    });
});

describe('viewers', () => {
    describe('getViewerCount', async () => {
        it('returns the count of viewers when stream is live', async (done) => {
            const viewerResponse = {
                data: [
                    {
                        viewer_count: 50
                    }
                ]
            };

            nock('https://api.twitch.tv')
                .get(`/helix/streams?user_id=${userId}`)
                .reply(200, viewerResponse);

            const res = await utils.getViewerCount(accessToken);

            assert.equal(res, viewerResponse.data[0].viewer_count);
            done();
        });

        it('returns 0 when there are no viewers', async (done) => {
            const viewerResponse = {
                data: []
            };

            nock('https://api.twitch.tv')
                .get(`/helix/streams?user_id=${userId}`)
                .reply(200, viewerResponse);

            const res = await utils.getViewerCount(accessToken);

            assert.deepEqual(res, 0);
            done();
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
});

describe('subscribersNew', () => {
    const subscriberResponse = {
        data: [ 
            {
                broadcaster_id: 'broadcasterId1',
                broadcaster_name: 'broadcasterName1',
                is_gift: false,
                plan_name: 'Channel Subscription',
                tier: '1000',
                user_id: 'userId1',
                user_name: 'userName1'
            },
            {
                broadcaster_id: 'broadcasterId2',
                broadcaster_name: 'broadcasterName2',
                is_gift: false,
                plan_name: 'Channel Subscription',
                tier: '1000',
                user_id: 'userId2',
                user_name: 'userName2'
            },
            { 
                broadcaster_id: 'broadcasterId3',
                broadcaster_name: 'broadcasterName3',
                is_gift: false,
                plan_name: 'Channel Subscription',
                tier: '1000',
                user_id: 'userId3',
                user_name: 'userName3'
            }
          ],
        pagination: {
            cursor: 'cursorId1'
        }
    };

    const subscriberManyResponse = {
        data: [ 
            { user_name: 'userName1' },
            { user_name: 'userName2' },
            { user_name: 'userName3' },
            { user_name: 'userName4' },
            { user_name: 'userName5' }
          ],
        pagination: {
            cursor: 'cursorId2'
        }
    };

    const oneSubscriberResponse = {
        data: [ 
            {
                broadcaster_id: 'broadcasterId1',
                broadcaster_name: 'broadcasterName1',
                is_gift: false,
                plan_name: 'Channel Subscription',
                tier: '1000',
                user_id: 'userId1',
                user_name: 'userName1'
            }
          ],
        pagination: {
            cursor: 'cursorId1'
        }
    };

    const noSubscriberResponse = {
        data: [],
        pagination: {
            cursor: 'lastCursor'
        }
    };

    describe('getSubscribersNew', () => {
        it('returns object containing array of subscribers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=`)
                .reply(200, subscriberResponse);


            const res = await utils.getSubscribersNew(accessToken, '');

            assert.deepEqual(res, subscriberResponse);
            done();
        });

        it('returns correct object when empty array of subscribers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=`)
                .reply(200, {data: [],  pagination: {cursor: 'cursor1'}});

            const res = await utils.getSubscribersNew(accessToken, '');

            assert.deepEqual(res, {data: [],  pagination: {cursor: 'cursor1'}});
            done();
        });
    });

    describe('getSubscribersLast', () => {
        it('returns the last subscriber', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=1`)
                .reply(200, oneSubscriberResponse);

            const res = await utils.getSubscribersLast(accessToken);

            assert.deepEqual(res, subscriberResponse.data[0].user_name);
            done();
        });

        it('returns NO_SUBSCRIBERS if user doesnt have any subscribers or is not partnered', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=1`)
                .reply(200, noSubscriberResponse);

            const res = await utils.getSubscribersLast(accessToken);
            assert.deepEqual(res, utils.NO_SUBSCRIBERS);
            done();
        });
    });

    describe('getSubscribersLastFive', () => {
        it('returns the 3 subscriber names if there less than 5', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=5`)
                .reply(200, subscriberResponse);

            const res = await utils.getSubscribersLastFive(accessToken);

            assert.deepEqual(res, ['userName1', 'userName2', 'userName3']);
            done();
        });

        it('returns the last 5 subscribers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=5`)
                .reply(200, subscriberManyResponse);

            const res = await utils.getSubscribersLastFive(accessToken);

            assert.deepEqual(res, ['userName1', 'userName2', 'userName3', 'userName4', 'userName5']);
            done();
        });

        it('returns NO_SUBSCRIBERS if the user doesnt have any subscribers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=5`)
                .reply(200, noSubscriberResponse);

            const res = await utils.getSubscribersLastFive(accessToken);

            assert.deepEqual(res, utils.NO_SUBSCRIBERS);
            done();
        });
    });

    describe('getSubscribersCount', () => {
        it('returns the count 3 when there are 3 subscribers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=`)
                .reply(200, subscriberResponse);

            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=cursorId1`)
                .reply(200, noSubscriberResponse);

            const res = await utils.getSubscribersCount(accessToken);

            assert.deepEqual(res, 3);
            done();
        });

        it('returns the count 0 when there are no subscribers', async (done) => {
            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=`)
                .reply(200, noSubscriberResponse);

            const res = await utils.getSubscribersCount(accessToken);

            assert.deepEqual(res, 0);
            done();
        });

        it('returns the count 105 when there are 105 and multiple pages of subscribers', async (done) => {
            const subsArr = [];
            for(let i = 0; i < 100; i++) {
                subsArr.push(i);
            }

            const subscriberFullPageResponse = {
                data: [...subsArr],
                pagination: {
                    cursor: 'cursorId1'
                }
            };

            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=`)
                .reply(200, subscriberFullPageResponse);

            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=cursorId1`)
                .reply(200, subscriberManyResponse);

            nock('https://api.twitch.tv')
                .get(`/helix/subscriptions?broadcaster_id=${userId}&first=100&after=cursorId2`)
                .reply(200, noSubscriberResponse);

            const res = await utils.getSubscribersCount(accessToken);

            assert.deepEqual(res, 105);
            done();
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
             assert.deepEqual(res, {clip: createClipResponse.data[0], userName});
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
             assert.deepEqual(res, {clip: 'STREAM_OFFLINE', userName});
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
