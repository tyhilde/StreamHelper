const Alexa = require('alexa-sdk');
const responses = require('./responses');
const {
    isAccessTokenValid,
    isStreamLive,
    getFollowersCount,
    getFollowersLast,
    getFollowersLastFive,
    getViewerCount,
    getSubscribersCount,
    getSubscribersLast,
    getSubscribersLastFive,
    createClip
} = require('./modules/utils');
const {
    AlexaAppId,
    TwitchBotPassword
} = require('./secrets/credentials');



exports.handler = function (event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = AlexaAppId;
    alexa.registerHandlers(handlers);
    alexa.execute();
}

const handlers = {
    'LaunchRequest': function() {
        this.emit(':ask', responses.welcome());
    },
    'isStreamLive': function() {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            isStreamLive(this.event.session.user.accessToken, (isLive) => {
                isLive ?
                    this.emit(':tell', responses.streamLive()) :
                    this.emit(':tell', responses.streamNotLive());
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getFollowerCount': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            getFollowersCount(this.event.session.user.accessToken, (count) => {
                count > 0 ?
                    this.emit(':tellWithCard', responses.followerCount(count), 'Followers', 'Followers: ' + count) :
                    this.emit(':tell', responses.noFollowers());
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getLastFollower': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            getFollowersLast(this.event.session.user.accessToken, (follower) => {
                follower === 'NO_FOLLOWERS' ?
                    this.emit(':tell', responses.noFollowers()) :
                    this.emit(':tellWithCard', responses.lastFollower(follower), 'Followers', 'Last follower: ' + follower);
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getLastFiveFollowers': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            getFollowersLastFive(this.event.session.user.accessToken, (followers) => {
                followers === 'NO_FOLLOWERS' ?
                    this.emit(':tell', responses.noFollowers()) :
                    this.emit(':tellWithCard', responses.lastXFollowers(followers), 'Followers', 'Followers: ' + followers);
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getViewerCount': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            getViewerCount(this.event.session.user.accessToken, (count) => {
                this.emit(':tellWithCard', responses.viewerCount(count), 'Viewers', 'Viewers: ' + count);
            });
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
    'getLastSubscriber': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            getSubscribersLast(this.event.session.user.accessToken, (subscriber) => {
                this.emit(':tellWithCard', responses.lastSubscriber(subscriber), 'Subscribers', 'Last subscriber: ' + subscriber);
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    'getLastFiveSubscribers': function () {
        if(isAccessTokenValid(this.event.session.user.accessToken)) {
            getSubscribersLastFive(this.event.session.user.accessToken, (subscribers) => {
                this.emit(':tellWithCard', responses.lastXSubscribers(subscribers), 'Subscribers', 'Ssubscribers: ' + subscribers);
            });
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    },
    //getstreamuptime, createclip
    // genereic intents, help, cancenl, stop, unhanlded,catchall (revist the last two)
}