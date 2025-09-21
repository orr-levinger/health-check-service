import { Auth } from 'aws-amplify';
const awsmobile = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: process.env.REACT_APP_CognitoUserPoolId,
  aws_user_pools_web_client_id: process.env.REACT_APP_CognitoWebClientId,
  aws_appsync_region: 'us-east-1',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  Auth: {
    identityPoolRegion: 'us-east-1',
    userPoolId: process.env.REACT_APP_CognitoUserPoolId,
    region: 'us-east-1',
    userPoolWebClientId: process.env.REACT_APP_CognitoWebClientId,
  },
  API: {
    endpoints: [
      {
        name: 'UptimeMonitoringAPI',
        endpoint: process.env.REACT_APP_ServiceEndpoint,
        custom_header: async () => {
          let authorization = `${(await Auth.currentSession()).getIdToken().getJwtToken()}`;
          return {
            Authorization: authorization,
          };
        },
      },
    ],
  },
};

export default awsmobile;
