import { useCallback, useState } from 'react';
import { API } from 'aws-amplify';
import { Endpoint, EndpointPayload } from '../types/Endpoint';

const API_NAME = 'UptimeMonitoringAPI';
const ENDPOINT_PATH = '/monitoring/endpoints';

const sortEndpoints = (items: Endpoint[]) => {
  return [...items].sort((a, b) => {
    if (a.tenantId.localeCompare(b.tenantId) !== 0) {
      return a.tenantId.localeCompare(b.tenantId);
    }
    if (a.category.localeCompare(b.category) !== 0) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
};

const useEndpoints = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadEndpoints = useCallback(
    async (refresh = true) => {
      setIsLoading(true);
      try {
        const query = refresh ? '' : '?refresh=false';
        const response: Endpoint[] = await API.get(
          API_NAME,
          `${ENDPOINT_PATH}${query}`,
          {}
        );
        setEndpoints(sortEndpoints(response));
      } catch (error) {
        console.error('Error loading endpoints:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addEndpoint = useCallback(
    async (payload: EndpointPayload) => {
      setIsCreating(true);
      try {
        await API.post(API_NAME, ENDPOINT_PATH, {
          body: payload,
        });
        await loadEndpoints();
      } catch (error) {
        console.error('Error creating endpoint:', error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [loadEndpoints]
  );

  return {
    endpoints,
    isLoading,
    isCreating,
    loadEndpoints,
    addEndpoint,
  };
};

export default useEndpoints;
