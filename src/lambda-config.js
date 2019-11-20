module.exports = {
  region: 'us-east-1',
  handler: 'index.handler',
  role: '@@ROLE',
  functionName: 'streamHelperDevelop', // Set the function name to deploy to [streamHelperDevelop, Test-StreamHelperRefactor]
  timeout: 10,
  memorySize: 128,
  publish: true,
  accessKeyId: '@@ACCESS_KEY_ID',
  secretAccessKey: '@@SECRET_ACCESS_KEY',
};


// For Deploying to the EU Lambda Function
// module.exports = {
//   region: 'eu-west-1',
//   handler: 'index.handler',
//   role: '@@ROLE',
//   functionName: 'streamHelperDevelopEU',
//   timeout: 10,
//   memorySize: 128,
//   publish: true,
//   accessKeyId: '@@ACCESS_KEY_ID',
//   secretAccessKey: '@@SECRET_ACCESS_KEY',
// };
