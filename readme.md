# Stream Helper Skill
Alexa skill that provides actions for streamers on Twitch.tv

## Deployments
Run `npm run deploy` to run the script that uses the gulpfile to zip files and upload to the lambda function.

TODO: add more information here about how to use / how it works


## Updating Scoping Permissions
If Twitch updates the scope permissions to hit an API follow these steps to update the skills

## TODO
1d. Better error handling for all functions
1dd. If API call fails, need to handle err, or if invalid data returned
3. How to update the account linking and get users to reauth (forcibly) rather than, option, if they dont update they wont get the new subscriber endpoint
