import { logLambdaEvent } from '@common/log-event';
import { endpointService } from '@service/endpoint-service';
import { ScheduledEvent } from 'aws-lambda';

export const handler = async (event?: ScheduledEvent) => {
  logLambdaEvent('Received refresh-all-endpoints event', event);
  try {
    const updatedEndpoints = await endpointService.refreshAllEndpoints();
    const unhealthyCount = updatedEndpoints.filter(
      (endpoint) => endpoint.status === 'unhealthy'
    ).length;

    console.log('Completed scheduled endpoint refresh', {
      refreshed: updatedEndpoints.length,
      unhealthyCount,
    });

    return {
      refreshed: updatedEndpoints.length,
      unhealthyCount,
    };
  } catch (error) {
    console.error('Failed to refresh endpoints on schedule', {
      error,
    });
    throw error;
  }
};
