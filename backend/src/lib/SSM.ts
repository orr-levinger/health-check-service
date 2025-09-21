import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
const ssmClient = new SSMClient({ region: 'us-east-1' });

export const initSecret = async (parameterStoreName: string, envVarName: string): Promise<void> => {
  const start = new Date().getTime();
  if (!process.env[envVarName]) {
    const parameter = await ssmClient.send(
      new GetParameterCommand({
        Name: parameterStoreName,
        WithDecryption: true,
      })
    );
    process.env[envVarName] = parameter.Parameter?.Value;
  }
};