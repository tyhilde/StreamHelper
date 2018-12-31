'use strict';

module.exports.welcome = () =>
    'Welcome to the Stream Helper Skill. You can ask me questions about your viewers, followers or subscribers. What would you like to know?';

module.exports.goodbye = () =>
    'Goodbye!';

module.exports.helpMessage = () =>
    'You can ask me questions about your followers, viewers, or subscribers. You can also create a clip of your stream. What can I help you with?';

module.exports.helpMessageReprompt = () =>
    'You can ask me questions about your followers, viewers, or subscribers or you can create a clip. Just say something like who was my last subscriber or create a clip. What can I help you with?';

module.exports.loginNeeded = () =>
    'To start using this skill please use the companion app to authenticate with your Twitch account. And then try again.';

module.exports.streamLive = () =>
    'Your stream is currently <phoneme alphabet="ipa" ph="l aɪ v">live</phoneme>.';

module.exports.streamNotLive = () =>
    'Your stream is currently offline.'

module.exports.streamUpTime = (uptime) => {
    if (uptime.hours >= 23 && uptime.minutes >= 59) {
        return 'Your stream has been <phoneme alphabet="ipa" ph="l aɪ v">live</phoneme> for more than 24 hours.';
    }
    else {
        return `Your stream has been <phoneme alphabet="ipa" ph="l aɪ v">live</phoneme> for ${uptime.hours} hours and ${uptime.minutes} minutes.`;
    }
}

module.exports.noFollowers = () =>
    'You don\'t have any followers.';

module.exports.followerCount = (count) =>
    `You have ${count} followers.`;

module.exports.lastFollower = (follower) =>
    `Your last follower was ${follower}.`;

module.exports.lastXFollowers = (followers) => {
    if (followers.length === 1) {
        return `Your last follower was ${followers}.`;
    }
    else if (followers.length === 2) {
        const names = followers.join(' and ');
        return `Your last two followers were ${names}.`;
    }
    else {
        const length = followers.length;
        const names = followers.slice(0, -1).join(', ') + ', and ' + followers.slice(-1);
        return `Your last ${length} followers were ${names}.`;
    }
}

module.exports.viewerCount = (count) => {
    if (count === 1) {
        return 'You currently have one viewer.';
    }
    else {
        return `You currently have ${count} viewers.`;
    }
}

module.exports.subscriberCount = (count) => {
    if (count === 'NOT_A_PARTNER') {
        return 'You have zero subscribers, you are not a Twitch partner or affiliate.';
    }
    else {
        if(count === 1) {
            return `You currently have one subscriber.`;
        }
        else {
            return `You currently have ${count} subscribers.`;
        }
    }
}

module.exports.lastSubscriber = (subscriber) => {
    if (subscriber === 'NOT_A_PARTNER') {
        return 'You have zero subscribers, you are not a Twitch partner or affiliate.';
    }
    else if (subscriber === 'NO_SUBSCRIBERS') {
        return 'You currently do not have any subscribers.';
    }
    else {
        return `Your last subscriber was ${subscriber}.`;
    }
}

module.exports.lastXSubscribers = (subscribers) => {
    if (subscribers === 'NOT_A_PARTNER') {
        return 'You have zero subscribers, you are not a Twitch partner or affiliate.';
    }
    else if (subscribers === 'NO_SUBSCRIBERS') {
        return 'You currently do not have any subscribers.';
    }
    else {
        if (subscribers.length === 1) {
            return `Your last subscriber was ${subscribers}.`;
        }
        else if (subscribers.length === 2) {
            const names = subscribers.join(' and ');
            return `Your last two subscribers were ${names}.`;
        }
        else {
            const length = subscribers.length;
            const names = subscribers.slice(0, -1).join(', ') + ', and ' + subscribers.slice(-1);
            return `Your last ${length} followers were ${names}.`;
        }
    }
}

module.exports.clipStreamOffline = () =>
    'Sorry I can\'t create a clip while your channel is offline.';

module.exports.clipCreated = (clip) => 
    `I created a clip with the id of ${clip.id}.`;

module.exports.catchAll = () =>
    'I\'m sorry I didn\'t understand that. Try asking again.';