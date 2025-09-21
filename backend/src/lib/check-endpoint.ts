import axios from 'axios';
import { URL } from 'url';

export type CheckEndpointResult = {
  status: 'healthy' | 'unhealthy';
  statusCode?: number;
  responseTimeMs: number;
  errorMessage?: string;
};

export async function CheckEndpoint(
  url: string,
  timeout: number
): Promise<CheckEndpointResult> {
  const effectiveTimeout = Number.isFinite(timeout) && timeout > 0 ? Math.floor(timeout) : 1;
  const startedAt = Date.now();

  try {
    const parsedUrl = new URL(url);
    const response = await axios.get(parsedUrl.toString(), {
      timeout: effectiveTimeout,
      validateStatus: () => true,
      proxy: false,
    });
    const responseTimeMs = Date.now() - startedAt;

    if (response.status >= 200 && response.status < 300) {
      return {
        status: 'healthy',
        statusCode: response.status,
        responseTimeMs,
      };
    }

    return {
      status: 'unhealthy',
      statusCode: response.status,
      responseTimeMs,
      errorMessage: `Non-2xx status code: ${response.status}`,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;
    let errorMessage = 'Unexpected error';
    let statusCode: number | undefined;

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status;
      if (error.code === 'ECONNABORTED') {
        errorMessage = `Request timed out after ${effectiveTimeout} ms`;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      status: 'unhealthy',
      statusCode,
      responseTimeMs,
      errorMessage,
    };
  }
}
