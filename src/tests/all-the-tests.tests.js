const assert = require('assert');
const skill = require('../index');
const nock = require('nock');
const context = require('aws-lambda-mock-context');

const {TwitchAppClientId} = require('../secrets/credentials');


const sessionStartIntent = require('./event-samples/new-session/session-start.intent');
const streamIsLiveIntent = require('./event-samples/isStreamLive/streamLive.intent');
const loginNeededIntent = require('./event-samples/isStreamLive/loginNeeded.intent');


const {
    welcome,
    loginNeeded,
    streamLive,
    streamNotLive
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
        outputSpeech: getOutputSpeech(obj),
        // gameState: getAttribute(obj, 'STATE'),
        // playerCount: getAttribute(obj, 'playerCount'),
        // players: getAttribute(obj, 'players'),
        // activePlayer: getAttribute(obj, 'activePlayer'),
        // startTime: getAttribute(obj, 'startTime'),
        // currentAnswer: getAttribute(obj, 'currentAnswer'),
        // previousResponse: getAttribute(obj, 'previousResponse'),
      });
    })
    .catch(err => {
      throw new Error(err);
    });
});


// TODO: Test each of the intents
// use nock to mock the endpoints
describe('Alexa, start game', () => {
    it('Welcomes users, asks what they\'d like to know', () =>
      runIntent(sessionStartIntent)
        .then(({ outputSpeech, endOfSession }) => {
          assert.deepEqual(outputSpeech, sanitise(welcome()));
          assert(!endOfSession);
        })
    );
});

describe('isStreamLive', () => {
  const userName = 'test_user';
  const accessToken = 'testAccessToken';

  // mock userName endpoint
  nock('https://api.twitch.tv')
    .persist()
    .get('/kraken?oauth_token=' + accessToken + '&client_id=' + TwitchAppClientId)
    .reply(200, {token: {user_name: 'test_user'}});

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
      .get(`/kraken/streams/${userName}?client_id=${TwitchAppClientId}`)
      .reply(200, {stream: 'info'});

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
      .get(`/kraken/streams/${userName}?client_id=${TwitchAppClientId}`)
      .reply(200, {stream: null});

    runIntent(streamIsLiveIntent)
      .then(({ outputSpeech, endOfSession }) => {
        assert.deepEqual(outputSpeech, sanitise(streamNotLive()));
        assert(endOfSession);
        done();
      }) 
  });
})