# Stream Helper Skill
Alexa skill that provides actions for streamers on Twitch.tv

## Developing the Skill
- add utils to the `modules/utils.js` file
- to test the util on its own, add it to the `tests/utils-run-example.js` file
- add util unit tests to the `tests/utils.tests.js` file
- `tests/all-the-tests.tests.js` is where the handlers are tested (TODO: Rename this file...)
- `index.js` file has all of the intent handlers
- `responses.js` is where all strings should live

## Deployments
Run `npm run deploy` to run the gulp script to upload files to Lambda function.

This function will inject Environment variables from the secrets file, add relevant files to the dist/ folder, zip all these files, and then upload to the selected Lambda function.

To change which Lambda function is deployed to, change `functionName` in [lambda-config.js](../src/lambda-config.js)

> If you need to deploy to the TestSkill, ensure you also update the `AlexaAppId` in the `credentials.js` file to match. If you forget to do this step, the App will not run and will give `Error: Invalid ApplicationId`.

> TODO: Upgrade the deploy script to ask which environment (EU vs US) to deploy to along with which lambda function (test vs prod) to deploy to


## Testing

To test the Util functions locally:
- Open Integrated Terminal in VS Code
- Call functions that need to be tested from file
- Run `node fileName.js`
   - example `node utilsTest.js`

Use `npm run test-utils` to run the utils unit tests.
Use `npm run test` to run all of the tests (including handler tests).

## Testing the Alexa Intents

- Use nock to mock responses from APIs (looks very similar to what is in the utils tests)




## Updating Scoping Permissions
If Twitch updates the scope permissions to hit an API follow these steps to update the skills

## TODO
1d. Better error handling for all functions
1dd. If API call fails, need to handle err, or if invalid data returned
3. How to update the account linking and get users to reauth (forcibly) rather than, option, if they dont update they wont get the new subscriber endpoint
