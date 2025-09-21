import { useCallback, useState } from 'react';
import { API } from 'aws-amplify';
import { Endpoint, EndpointPayload, EndpointUpdatePayload } from '../types/Endpoint';

const API_NAME = 'UptimeMonitoringAPI';
const ENDPOINT_PATH = '/monitoring/endpoints';
const TENANTS_PATH = '/monitoring/tenants';

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

  const updateEndpoint = useCallback(
    async (endpointId: string, payload: EndpointUpdatePayload) => {
      try {
        const updatedEndpoint: Endpoint = await API.patch(
          API_NAME,
          `${ENDPOINT_PATH}/${endpointId}`,
          {
            body: payload,
          }
        );

        setEndpoints((prev) =>
          sortEndpoints(
            prev.map((endpoint) =>
              endpoint.endpointId === endpointId ? updatedEndpoint : endpoint
            )
          )
        );

        return updatedEndpoint;
      } catch (error) {
        console.error('Error updating endpoint:', error);
        throw error;
      }
    },
    []
  );

  const deleteEndpoint = useCallback(async (endpointId: string) => {
    try {
      await API.del(API_NAME, `${ENDPOINT_PATH}/${endpointId}`, {});

      setEndpoints((prev) =>
        sortEndpoints(prev.filter((endpoint) => endpoint.endpointId !== endpointId))
      );
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      throw error;
    }
  }, []);

  const deleteTenant = useCallback(async (tenantId: string) => {
    try {
      const response: { deletedCount?: number } = await API.del(
        API_NAME,
        `${TENANTS_PATH}/${tenantId}`,
        {}
      );

      setEndpoints((prev) =>
        sortEndpoints(prev.filter((endpoint) => endpoint.tenantId !== tenantId))
      );

      return response?.deletedCount ?? 0;
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  }, []);

  return {
    endpoints,
    isLoading,
    isCreating,
    loadEndpoints,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    deleteTenant,
  };
};

export default useEndpoints;
