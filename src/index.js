const Alexa = require('alexa-sdk');
const responses = require('./responses');
const {
    isAccessTokenValid,
    isStreamLive,
    getStreamUpTime,
    getFollowersCount,
    getFollowersLast,
    getFollowersLastFive,
    getViewerCount,
    getSubscribersCount,
    getSubscribersLast,
    getSubscribersLastFive,
    createClip,
    sendTwitchMessage,
    STREAM_OFFLINE,
    NO_FOLLOWERS
} = require('./modules/utils');

const {
    AlexaAppId
} = require('./secrets/credentials');



exports.handler = function (event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = AlexaAppId;
    alexa.registerHandlers(handlers);
    alexa.execute();
}

const handlers = {
    'LaunchRequest': function() {
        this.emit(':ask', responses.welcome(), responses.helpMessageReprompt());
    },
    'isStreamLive': async function() {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const isLive = await isStreamLive(this.event.session.user.accessToken);
           
            isLive ?
                this.emit(':tell', responses.streamLive()) :
                this.emit(':tell', responses.streamNotLive());
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getStreamUpTime': async function() {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const uptime = await getStreamUpTime(this.event.session.user.accessToken);

            uptime === STREAM_OFFLINE ?
                this.emit(':tell', responses.streamNotLive()) :
                this.emit(':tellWithCard', responses.streamUpTime(uptime), 'Uptime', uptime.hours + 'hrs ' + uptime.minutes + 'mins');
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getFollowerCount': async function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const count = await getFollowersCount(this.event.session.user.accessToken);

            count > 0 ?
                this.emit(':tellWithCard', responses.followerCount(count), 'Followers', 'Followers: ' + count) :
                this.emit(':tell', responses.noFollowers());
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getLastFollower': async function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const follower = await getFollowersLast(this.event.session.user.accessToken);

            follower === NO_FOLLOWERS ?
                this.emit(':tell', responses.noFollowers()) :
                this.emit(':tellWithCard', responses.lastFollower(follower), 'Followers', 'Last follower: ' + follower);
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getLastFiveFollowers': async function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const followers = await getFollowersLastFive(this.event.session.user.accessToken);
            
            followers === NO_FOLLOWERS ?
                this.emit(':tell', responses.noFollowers()) :
                this.emit(':tellWithCard', responses.lastXFollowers(followers), 'Followers', 'Followers: ' + followers);
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getViewerCount': async function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const count = await getViewerCount(this.event.session.user.accessToken);

            this.emit(':tellWithCard', responses.viewerCount(count), 'Viewers', 'Viewers: ' + count);
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getSubscriberCount': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            getSubscribersCount(this.event.session.user.accessToken, (count) => {
                this.emit(':tellWithCard', responses.subscriberCount(count), 'Subscribers', 'Subscribers: ' + count);
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getLastSubscriber': async function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const subscriber = await getSubscribersLast(this.event.session.user.accessToken);

            this.emit(':tellWithCard', responses.lastSubscriber(subscriber), 'Subscribers', 'Last subscriber: ' + subscriber);
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getLastFiveSubscribers': async function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            const subscribers = await getSubscribersLastFive(this.event.session.user.accessToken);

            this.emit(':tellWithCard', responses.lastXSubscribers(subscribers), 'Subscribers', 'Subscribers: ' + subscribers);
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'createClip': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            createClip(this.event.session.user.accessToken, (res) => {
                if (res.clip === 'STREAM_OFFLINE') {
                    this.emit(':tell', responses.clipStreamOffline());
                }
                else {
                    var clipUrl = res.clip.edit_url;
                    var clipUrlTrimmed = clipUrl.substring(0, clipUrl.length-5);
                    sendTwitchMessage(clipUrlTrimmed, res.userName, (response) => {
                        this.emit(':tellWithCard', responses.clipCreated(res.clip), 'Clip Created', 'Clip URL: ' + res.clip.edit_url);
                    })
                }   
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', responses.goodbye());
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', responses.helpMessage(), responses.helpMessageReprompt());
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', responses.goodbye());
    },
    'CatchAll': function () {
        this.emit(':ask', responses.catchAll(), responses.helpMessageReprompt());
    },
    'Unhandled': function () {
        this.emit(':ask', responses.catchAll(), responses.helpMessageReprompt());
    }
}