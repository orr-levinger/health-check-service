import { endpointService } from '@service/endpoint-service';

export const handler = async () => {
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
