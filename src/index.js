const Alexa = require('alexa-sdk');
const responses = require('./responses');
const {
    isAccessTokenValid,
    isStreamLive
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
            })
        }
        else {
            this.emit(':tellWithLinkAccountCard', responses.loginNeeded());
        }
    }
}