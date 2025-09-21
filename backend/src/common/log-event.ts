import { APIGatewayEvent } from 'aws-lambda';

const MAX_BODY_LOG_LENGTH = 2048;

type HeaderValue = string | undefined;

const isApiGatewayEvent = (event: unknown): event is APIGatewayEvent => {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const candidate = event as Record<string, unknown>;

  return 'httpMethod' in candidate && 'requestContext' in candidate;
};

const sanitizeHeaders = (
  headers: APIGatewayEvent['headers'] | null
): Record<string, HeaderValue> | undefined => {
  if (!headers) {
    return undefined;
  }

  return Object.entries(headers).reduce<Record<string, HeaderValue>>(
    (acc, [key, value]) => {
      if (typeof key !== 'string') {
        return acc;
      }

      if (key.toLowerCase() === 'authorization') {
        acc[key] = value ? '[REDACTED]' : value;
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {}
  );
};

const summarizeBody = (
  body: string | null,
  isBase64Encoded: boolean | undefined
):
  | undefined
  | {
      length: number;
      isBase64Encoded: boolean;
      truncated: boolean;
      preview?: string;
    } => {
  if (!body) {
    return undefined;
  }

  if (isBase64Encoded) {
    return {
      length: body.length,
      isBase64Encoded: true,
      truncated: false,
    };
  }

  const truncated = body.length > MAX_BODY_LOG_LENGTH;

  return {
    length: body.length,
    isBase64Encoded: false,
    truncated,
    preview: truncated ? `${body.slice(0, MAX_BODY_LOG_LENGTH)}...` : body,
  };
};

const formatApiGatewayEvent = (event: APIGatewayEvent) => {
  const { requestContext } = event;

  return {
    type: 'APIGatewayEvent',
    httpMethod: event.httpMethod,
    resource: event.resource,
    path: event.path,
    routeKey: requestContext?.routeKey,
    stage: requestContext?.stage,
    requestId: requestContext?.requestId,
    identity: requestContext?.identity
      ? {
          sourceIp: requestContext.identity.sourceIp,
          userAgent: requestContext.identity.userAgent,
        }
      : undefined,
    authorizer: requestContext?.authorizer
      ? {
          hasAuthorizer: true,
          claims: requestContext.authorizer.claims
            ? {
                sub: requestContext.authorizer.claims.sub,
              }
            : undefined,
          scopes: requestContext.authorizer.scopes,
        }
      : undefined,
    queryStringParameters: event.queryStringParameters,
    pathParameters: event.pathParameters,
    headers: sanitizeHeaders(event.headers),
    body: summarizeBody(event.body, event.isBase64Encoded),
  };
};

const formatLambdaEvent = (event: unknown) => {
  if (isApiGatewayEvent(event)) {
    return formatApiGatewayEvent(event);
  }

  return event ?? null;
};

export const logLambdaEvent = (message: string, event: unknown) => {
  try {
    console.log(message, {
      event: formatLambdaEvent(event),
    });
  } catch (error) {
    console.log(`Failed to log event for ${message}`, { error });
  }
};

