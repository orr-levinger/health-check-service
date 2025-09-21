import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logLambdaEvent } from '@common/log-event';

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Header': '*',
  'Access-Control-Allow-Methods': '*',
} as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ResponseOutcome = {
  type: 'response';
  name: string;
  statusCode: number;
  message: string;
  delayMs?: number;
  headers?: Record<string, string>;
};

type TimeoutOutcome = {
  type: 'timeout';
  name: string;
  message: string;
};

type ThrowOutcome = {
  type: 'throw';
  name: string;
  message: string;
};

type Outcome = ResponseOutcome | TimeoutOutcome | ThrowOutcome;

const OUTCOMES: Outcome[] = [
  {
    type: 'response',
    name: 'fast-success',
    statusCode: 200,
    message: 'Simulated healthy response',
  },
  {
    type: 'response',
    name: 'slow-success',
    statusCode: 200,
    message: 'Healthy response after a noticeable delay',
    delayMs: 7000,
  },
  {
    type: 'response',
    name: 'created-success',
    statusCode: 201,
    message: 'Simulated resource creation response',
  },
  {
    type: 'response',
    name: 'no-content',
    statusCode: 204,
    message: 'Simulated response with no body content',
  },
  {
    type: 'response',
    name: 'bad-request',
    statusCode: 400,
    message: 'Simulated 400 Bad Request',
  },
  {
    type: 'response',
    name: 'unauthorized',
    statusCode: 401,
    message: 'Simulated 401 Unauthorized',
  },
  {
    type: 'response',
    name: 'forbidden',
    statusCode: 403,
    message: 'Simulated 403 Forbidden',
  },
  {
    type: 'response',
    name: 'not-found',
    statusCode: 404,
    message: 'Simulated 404 Not Found',
  },
  {
    type: 'response',
    name: 'conflict',
    statusCode: 409,
    message: 'Simulated 409 Conflict',
  },
  {
    type: 'response',
    name: 'rate-limited',
    statusCode: 429,
    message: 'Simulated 429 Too Many Requests',
  },
  {
    type: 'response',
    name: 'server-error',
    statusCode: 500,
    message: 'Simulated 500 Internal Server Error',
  },
  {
    type: 'response',
    name: 'bad-gateway',
    statusCode: 502,
    message: 'Simulated 502 Bad Gateway',
  },
  {
    type: 'response',
    name: 'service-unavailable',
    statusCode: 503,
    message: 'Simulated 503 Service Unavailable',
  },
  {
    type: 'response',
    name: 'gateway-timeout',
    statusCode: 504,
    message: 'Simulated 504 Gateway Timeout response',
  },
  {
    type: 'response',
    name: 'teapot',
    statusCode: 418,
    message: "Simulated 418 I'm a teapot", // fun unexpected status
  },
  {
    type: 'response',
    name: 'redirect',
    statusCode: 302,
    message: 'Simulated redirect to an alternate location',
    headers: {
      Location: 'https://example.com/maintenance',
    },
  },
  {
    type: 'throw',
    name: 'unhandled-exception',
    message: 'Simulated unexpected runtime failure',
  },
  {
    type: 'timeout',
    name: 'timeout',
    message: 'Simulated function timeout',
  },
];

const buildResponse = (
  outcome: ResponseOutcome
): APIGatewayProxyResult => {
  const headers = {
    ...COMMON_HEADERS,
    ...(outcome.headers ?? {}),
  };

  const bodyContent =
    outcome.statusCode === 204
      ? ''
      : JSON.stringify({
          outcome: outcome.name,
          statusCode: outcome.statusCode,
          message: outcome.message,
          timestamp: new Date().toISOString(),
        });

  return {
    statusCode: outcome.statusCode,
    headers,
    body: bodyContent,
  };
};

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  logLambdaEvent('Received health-qa request', event);

  const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
  console.log('Selected health-qa scenario', outcome);

  if (outcome.type === 'timeout') {
    console.warn('Simulating timeout for /health-qa request');
    return new Promise<APIGatewayProxyResult>(() => {});
  }

  if (outcome.type === 'throw') {
    console.error('Throwing simulated failure for /health-qa request');
    throw new Error(outcome.message);
  }

  if (outcome.delayMs) {
    await delay(outcome.delayMs);
  }

  return buildResponse(outcome);
};
