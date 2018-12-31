const {AlexaAppId} = require('../../../secrets/credentials');

module.exports = {
	"version": "1.0",
	"session": {
		"new": true,
		"sessionId": "session123",
		"application": {
			"applicationId": AlexaAppId
		},
		"user": {
			"userId": "userId123",
			"accessToken": "accessToken123"
		}
	},
	"request": {
		"type": "AMAZON.StopIntent",
		"requestId": "request123",
		"locale": "en-US"
	}
}
