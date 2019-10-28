# Stream Helper Skill
Alexa skill that provides actions for streamers on Twitch.tv

## Deployments
Run `npm run deploy` to run the script that uses the gulpfile to zip files and upload to the lambda function.

TODO: add more information here about how to use / how it works


## Updating Scoping Permissions
If Twitch updates the scope permissions to hit an API follow these steps to update the skills

TODO
- How to update on the skill end
- How to encourage/force users to reauth on login
- Should be using async/await for utils instead of callbacks (need to get out of callback hell, will simplify by a lot)
-- does it still work in the handlers tho?