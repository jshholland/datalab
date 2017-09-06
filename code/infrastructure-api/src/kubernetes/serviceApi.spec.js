import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import config from '../config/config';
import serviceApi from './serviceApi';

const mock = new MockAdapter(axios);

const API_BASE = config.get('kubernetesApi');
const NAMESPACE = config.get('podNamespace');

const SERVICE_URL = `${API_BASE}/api/v1/namespaces/${NAMESPACE}/services`;
const SERVICE_NAME = 'test-service';

beforeEach(() => {
  mock.reset();
});

afterAll(() => {
  mock.restore();
});

const service = createService();
const manifest = createManifest();

describe('Kubernetes Service API', () => {
  describe('get service', () => {
    it('should return the service if it exists', () => {
      mock.onGet(`${SERVICE_URL}/${SERVICE_NAME}`).reply(200, service);

      return serviceApi.getService(SERVICE_NAME)
        .then((response) => {
          expect(response).toEqual(service);
        });
    });

    it('should return undefined it the service does not exist', () => {
      mock.onGet(`${SERVICE_URL}/${SERVICE_NAME}`).reply(404, service);

      return serviceApi.getService(SERVICE_NAME)
        .then((response) => {
          expect(response).toBeUndefined();
        });
    });
  });

  describe('create service', () => {
    it('should POST manifest to bare resource URL', () => {
      mock.onPost(SERVICE_URL, manifest).reply((requestConfig) => {
        expect(requestConfig.headers['Content-Type']).toBe('application/yaml');
        return [200, service];
      });

      return serviceApi.createService(manifest)
        .then((response) => {
          expect(response.data).toEqual(service);
        });
    });

    it('should return an error if creation fails', () => {
      mock.onPost(SERVICE_URL).reply(400, { message: 'error-message' });

      return serviceApi.createService(manifest)
        .catch((error) => {
          expect(error.toString()).toEqual('Error: Unable to create kubernetes service error-message');
        });
    });
  });

  describe('update service', () => {
    it('should PUT payload to resource URL', () => {
      mock.onPut(`${SERVICE_URL}/${SERVICE_NAME}`).reply(200, service);

      return serviceApi.updateService(SERVICE_NAME, manifest, service)
        .then((response) => {
          expect(response.data).toEqual(service);
        });
    });

    it('should return an error if creation fails', () => {
      mock.onPut(`${SERVICE_URL}/${SERVICE_NAME}`).reply(400, { message: 'error-message' });

      return serviceApi.updateService(SERVICE_NAME, manifest, service)
        .catch((error) => {
          expect(error.toString()).toEqual('Error: Unable to create kubernetes service error-message');
        });
    });
  });

  describe('createOrUpdate service', () => {
    it('should CREATE if service does not exist', () => {
      mock.onGet(`${SERVICE_URL}/${SERVICE_NAME}`).reply(404);
      mock.onPost().reply(204, service);

      return serviceApi.createOrUpdateService(SERVICE_NAME, manifest)
        .then((response) => {
          expect(response).toEqual(service);
        });
    });

    it('should UPDATE if service exists', () => {
      mock.onGet(`${SERVICE_URL}/${SERVICE_NAME}`).reply(200, service);
      mock.onPut().reply(204, service);

      return serviceApi.createOrUpdateService(SERVICE_NAME, manifest)
        .then((response) => {
          expect(response).toEqual(service);
        });
    });
  });
});

function createService() {
  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: SERVICE_NAME,
      resourceVersion: 1,
    },
    spec: { clusterIP: '127.0.0.1' },
  };
}

function createManifest() {
  return 'apiVersion: v1\n' +
    'kind: Service\n' +
    'metadata:\n' +
    '  name: test-service\n' +
    'spec:\n' +
    '  type: NodePort\n';
}
