const assert = require('assert');
const skill = require('../index');
const nock = require('nock');
const context = require('aws-lambda-mock-context');

const {TwitchAppClientId} = require('../secrets/credentials');

const sessionStartIntent = require('./event-samples/new-session/session-start.intent');
const sessionCancelIntent = require('./event-samples/new-session/session-cancel.intent');
const sessionStopIntent = require('./event-samples/new-session/session-stop.intent');
const sessionHelpIntent = require('./event-samples/new-session/session-help.intent');
const sessionCatchAllIntent = require('./event-samples/new-session/session-catchall.intent');
const streamIsLiveIntent = require('./event-samples/isStreamLive/streamLive.intent');
const loginNeededIntent = require('./event-samples/isStreamLive/loginNeeded.intent');
const getFollowersCountIntent = require('./event-samples/followers/getFollowersCount.intent');
const getLastFollowerIntent = require('./event-samples/followers/getLastFollower.intent');
const getLastFiveFollowersIntent = require('./event-samples/followers/getLastFiveFollowers.intent');
const getViewerCountIntent = require('./event-samples/getViewerCount.intent');
const getSubscriberCountIntent = require('./event-samples/subscribers/getSubscriberCount.intent');
const getLastSubscriberIntent = require('./event-samples/subscribers/getLastSubscriber.intent');
const getLastFiveSubscribersIntent = require('./event-samples/subscribers/getLastFiveSubscribers.intent');
const getStreamUpTimeIntent = require('./event-samples/getStreamUpTime.intent');
const createClipIntent = require('./event-samples/createClip/createClip.intent');

const {
    welcome,
    goodbye,
    helpMessage,
    catchAll,
    loginNeeded,
    streamLive,
    streamNotLive,
    streamUpTime,
    followerCount,
    noFollowers,
    lastFollower,
    lastXFollowers,
    viewerCount,
    subscriberCount,
    lastSubscriber,
    lastXSubscribers,
    clipStreamOffline,
    clipCreated
} = require('../responses');

const sanitise = text => text.replace(/\n/g, '');

const getOutputSpeech = ({ response: { outputSpeech: { ssml } } }) =>
  sanitise(ssml).match(/<speak>(.*)<\/speak>/i)[1].trim();

const getAttribute = ({ sessionAttributes }, attr) => sessionAttributes[attr]; //sessionAttributes might not exist on my end

const runIntent = intent => new Promise(res => {
  const ctx = context();
  skill.handler(intent, ctx);

  ctx
    .Promise
    .then(obj => {
      //  console.log(obj);
      res({
        endOfSession: obj.response.shouldEndSession,
        outputSpeech: getOutputSpeech(obj)
      });
    })
    .catch(err => {
      throw new Error(err);
    });
});

describe('intents', () => {
  const userName = 'test_user';
  const userId = 123456789;
  // mock user endpoint
  nock('https://api.twitch.tv')
    .persist()
    .get(`/helix/users`)
    .reply(200, {data: [{id: userId, display_name: userName}]});
  
  describe('LaunchRequest', () => {
      it('Welcomes users, asks what they\'d like to know', () =>
        runIntent(sessionStartIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, sanitise(welcome()));
            assert(!endOfSession);
          })
      );
  });

  describe('CancelIntent', () => {
    it('Ends session and says goodbye', () =>
      runIntent(sessionCancelIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(goodbye()));
          assert(endOfSession);
        })
    );
  });

  describe('StopIntent', () => {
    it('Ends session and says goodbye', () =>
      runIntent(sessionStopIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(goodbye()));
          assert(endOfSession);
        })
    );
  });

  describe('HelpIntent', () => {
    it('tells users what they can say', () =>
      runIntent(sessionHelpIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(helpMessage()));
          assert(!endOfSession);
        })
    );
  });

  describe('CatchAll', () => {
    it('says didnt understand what was said', () =>
      runIntent(sessionCatchAllIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(catchAll()));
          assert(!endOfSession);
        })
    );
  });

  describe('isStreamLive', () => {
    it('tells the user to authenticate if they aren\'t linked', () => {
      runIntent(loginNeededIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(loginNeeded()));
          assert(endOfSession);
        })
    });

    it('tells the user that the stream is live', (done) => {
      // mock stream live endpoint
      nock('https://api.twitch.tv')
        .get(`/helix/streams?user_id=${userId}`)
        .reply(200, {data: [{display_name: userName}]});

      runIntent(streamIsLiveIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(streamLive()));
          assert(endOfSession);
          done();
        });
    });

    it('tells the user that the stream is not live', (done) => {
      // mock stream live endpoint
      nock('https://api.twitch.tv')
        .get(`/helix/streams?user_id=${userId}`)
        .reply(200, {data: []});

      runIntent(streamIsLiveIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(streamNotLive()));
          assert(endOfSession);
          done();
        }) 
    });
  });

  describe('getStreamUpTime', () => {
    it('tells the user that the stream is not live', (done) => {
      // mock stream live endpoint
      nock('https://api.twitch.tv')
        .get(`/helix/streams?user_id=${userId}`)
        .reply(200, {data: []});

      runIntent(getStreamUpTimeIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(streamNotLive()));
          assert(endOfSession);
          done();
        }) 
    });

    it('tells the user the stream uptime', (done) => {
      // mock stream live endpoint
      nock('https://api.twitch.tv')
        .get(`/helix/streams?user_id=${userId}`)
        .reply(200, {data: [{started_at: "2018-12-13T05:30:00Z"}]});

      runIntent(getStreamUpTimeIntent)
        .then(({ outputSpeech, endOfSession }) => {
            const startDate = new Date("2018-12-13T05:30:00Z");
            const currentDate = new Date();
            const totalMins = Math.floor((currentDate - startDate) / (1000 * 60));
            const uptime = {
                minutes: totalMins % 60,
                hours: Math.floor(totalMins / 60)
            };
          assert.deepEqual(outputSpeech, sanitise(streamUpTime(uptime)));
          assert(endOfSession);
          done();
        }) 
    });
  });

  describe('followers', () => {
    describe('getFollowerCount', () => {
      it('tells the user the number of followers', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 50, data:[{}]});

        runIntent(getFollowersCountIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, followerCount(50));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user there are NO FOLLOWERS', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 0, data:[]});

        runIntent(getFollowersCountIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, noFollowers());
            assert(endOfSession);
            done();
          });
      });
    });

    describe('getLastFollower', () => {
      it('tells the user the last follower', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 50, data:[{from_name: userName}]});

        runIntent(getLastFollowerIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastFollower(userName));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user there are NO FOLLOWERS', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 0, data:[]});

        runIntent(getLastFollowerIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, noFollowers());
            assert(endOfSession);
            done();
          });
      });
    });

    describe('getLastFiveFollowers', () => {
      it('tells the user the last follower', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 1, data:[{from_name: 'user1'}]});

        runIntent(getLastFiveFollowersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastXFollowers(['user1']));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user the last two followers', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 2, data:[{from_name: 'user1'}, {from_name: 'user2'}]});

        runIntent(getLastFiveFollowersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastXFollowers(['user1', 'user2']));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user the last five followers', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 5, data:[{from_name: 'user1'}, {from_name: 'user2'}, {from_name: 'user3'}, {from_name: 'user4'}, {from_name: 'user5'}]});

        runIntent(getLastFiveFollowersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastXFollowers(['user1', 'user2', 'user3', 'user4', 'user5']));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user there are NO FOLLOWERS', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/users/follows?to_id=${userId}`)
          .reply(200, {total: 0, data:[]});

        runIntent(getLastFiveFollowersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, noFollowers());
            assert(endOfSession);
            done();
          });
      });
    });
  });

  describe('getViewerCount', () => {
    it('tells the user the number of viewers', (done) => {
      nock('https://api.twitch.tv')
          .get(`/helix/streams?user_id=${userId}`)
          .reply(200, { data:[{viewer_count: 5}]});

        runIntent(getViewerCountIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, viewerCount(5));
            assert(endOfSession);
            done();
          });
    });
  });

  describe('subscribers', () => {
    describe('getSubscriberCount', () => {
      it('tells the user the number of subscribers', (done) => {
        nock('https://api.twitch.tv')
          .get(`/kraken/channels/${userName}/subscriptions?oauth_token=testAccessToken&direction=desc`)
          .reply(200, {_total: 50, data:[{}]});

        runIntent(getSubscriberCountIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, subscriberCount(50));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user they have zero subscribers and are not parterned', (done) => {
        nock('https://api.twitch.tv')
          .get(`/kraken/channels/${userName}/subscriptions?oauth_token=testAccessToken&direction=desc`)
          .reply(200, {});

        runIntent(getSubscriberCountIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, subscriberCount('NOT_A_PARTNER'));
            assert(endOfSession);
            done();
          });
      });
    });

    describe('getLastSubscriber', () => {
      it('tells the user the name of the last subscriber', (done) => {
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

        nock('https://api.twitch.tv')
          .get(`/helix/subscriptions?broadcaster_id=${userId}&first=1`)
          .reply(200, oneSubscriberResponse);

        runIntent(getLastSubscriberIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastSubscriber('userName1'));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user they have zero subscribers', (done) => {
        nock('https://api.twitch.tv')
          .get(`/helix/subscriptions?broadcaster_id=${userId}&first=1`)
          .reply(200, {
            data: [],
            pagination: {
                cursor: 'cursorId1'
            }
        });

        runIntent(getLastSubscriberIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastSubscriber('NO_SUBSCRIBERS'));
            assert(endOfSession);
            done();
          });
      });
    });
  
    describe('getLastFiveSubscribers', () => {
      it('tells the user the name of the one subscriber', (done) => {
        nock('https://api.twitch.tv')
          .get(`/kraken/channels/${userName}/subscriptions?oauth_token=testAccessToken&direction=desc`)
          .reply(200, {_total: 2, subscriptions:[{user: { display_name: 'user1'}}]});

        runIntent(getLastFiveSubscribersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastXSubscribers(['user1']));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user the name of the subscribers', (done) => {
        nock('https://api.twitch.tv')
          .get(`/kraken/channels/${userName}/subscriptions?oauth_token=testAccessToken&direction=desc`)
          .reply(200, {_total: 6, subscriptions:[{user: { display_name: 'user1'}}, {user: { display_name: 'user2'}}, {user: { display_name: 'user3'}}, {user: { display_name: 'user4'}}]});

        runIntent(getLastFiveSubscribersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastXSubscribers(['user1', 'user2', 'user3', 'user4']));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user they have zero subscribers', (done) => {
        nock('https://api.twitch.tv')
          .get(`/kraken/channels/${userName}/subscriptions?oauth_token=testAccessToken&direction=desc`)
          .reply(200, {_total: 1, subscriptions:[]});

        runIntent(getLastFiveSubscribersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastXSubscribers('NO_SUBSCRIBERS'));
            assert(endOfSession);
            done();
          });
      });

      it('tells the user they have zero subscribers and are not parterned', (done) => {
        nock('https://api.twitch.tv')
          .get(`/kraken/channels/${userName}/subscriptions?oauth_token=testAccessToken&direction=desc`)
          .reply(200, {});

        runIntent(getLastFiveSubscribersIntent)
          .then(({ outputSpeech, endOfSession }) => {
            assert.deepEqual(outputSpeech, lastXSubscribers('NOT_A_PARTNER'));
            assert(endOfSession);
            done();
          });
      });
    });
  });

  describe('createClip', () => {
    it('tells the user that the stream is offline', (done) => {
      // mock stream live endpoint
      nock('https://api.twitch.tv')
        .post(`/helix/clips?broadcaster_id=${userId}`)
        .reply(200, {});

      runIntent(createClipIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(clipStreamOffline()));
          assert(endOfSession);
          done();
        }) 
    });

    it('tells the user the clip has been created', (done) => {
      // mock stream live endpoint
      nock('https://api.twitch.tv')
        .post(`/helix/clips?broadcaster_id=${userId}`)
        .reply(200, {data: [{id: 'clipId', edit_url: 'clip_edit_url'}]});

      runIntent(createClipIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(clipCreated({id: 'clipId', edit_url: 'clip_edit_url'})));
          assert(endOfSession);
          done();
        }) 
    });
  });
});
