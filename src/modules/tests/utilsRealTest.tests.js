const assert = require('assert');
const utils = require('../utils');
const nock = require('nock');

const {TwitchAppClientId} = require('../../secrets/credentials');

const accessToken = 'testAccessToken';
const userName = 'test_user';

const userNameNock = nock('https://api.twitch.tv')
    .persist()
    .get('/kraken?oauth_token=' + accessToken + '&client_id=' + TwitchAppClientId)
    .reply(200, {token: {user_name: userName}});

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

    const followersNock = nock('https://api.twitch.tv')
        .persist()
        .get(`/kraken/channels/${userName}/follows?oauth_token=${accessToken}`)
        .reply(200, followerResponse);
    
    describe('getFollowers', () => {
        it('returns object containing followers', (done) => {
            utils.getFollowers(accessToken, (res) => {
                assert.deepEqual(res, followerResponse);
                done();
            })
        });
    });

    describe('getFollowersCount', () => {
        it('returns the count of followers', (done) => {
            utils.getFollowersCount(accessToken, (res) => {
                assert.equal(res, followerResponse._total);
                done();
            });
        });
    });

    describe('getFollowersLast', () => {
        it('returns the last follower', (done) => {
            utils.getFollowersLast(accessToken, (res) => {
                assert.equal(res, followerResponse.follows[0].user.display_name);
                done();
            });
        });
    });

    describe('getFollowersLastFive', () => {
       it('returns an array of the last five followers', (done) => {
            utils.getFollowersLastFive(accessToken, (res) => {
                assert.deepEqual(res, ['follower1', 'follower2', 'follower3', 'follower4', 'follower5']);
                done();
            });
        });

        it('returns an array of the last two followers if there are only 2', (done) => {
            // TODO: need to figure out how to disable the persisted nock and use a new one
            followersNock.persist(false);

            // console.log('followersNock', followersNock);

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