'use strict';

// TODO: Make sure these are the correct strings
module.exports.welcome = () =>
    'Welcome to the Stream Helper Skill. You can ask me questions about your viewers, followers or subscribers. What would you like to know?';

module.exports.loginNeeded = () =>
    'Need to login';

module.exports.streamLive = () =>
    'Stream is live';

module.exports.streamNotLive = () =>
    'Stream is NOT live';

module.exports.noFollowers = () =>
    'There are no followers.';

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