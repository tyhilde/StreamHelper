const {AlexaAppId} = require('../../../secrets/credentials');

module.exports = {
	"version": "1.0",
	"session": {
		"new": false,
		"sessionId": "session123",
		"application": {
			"applicationId": AlexaAppId
		},
		"user": {
			"userId": "userId123",
			"accessToken": "testAccessToken"
		}
	},
	"request": {
		"type": "IntentRequest",
		"requestId": "request123",
		"locale": "en-US",
		"intent": {
			"name": "getLastFollower",
			"confirmationStatus": "NONE"
		}
	}
}
