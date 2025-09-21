import { APIGatewayProxyResult } from 'aws-lambda';

export const httpError = (err: Error, status: number): APIGatewayProxyResult => {
  return {
    statusCode: status || 500,
    body: JSON.stringify(err),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Header': '*',
    },
  };
};

export const httpResponse = (body: any, status: number): APIGatewayProxyResult => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Header': '*',
      'Access-Control-Allow-Methods': '*',
    },
    statusCode: status,
    body: body ? JSON.stringify(body) : undefined,
  };
};
