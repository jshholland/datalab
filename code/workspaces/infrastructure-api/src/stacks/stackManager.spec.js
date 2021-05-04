import * as catalogueConfig from 'common/src/config/catalogue';
import Stacks from './Stacks';
import * as stackRepository from '../dataaccess/stacksRepository';
import stackManager from './stackManager';
import deploymentApi from '../kubernetes/deploymentApi';
import nameGenerators from '../common/nameGenerators';
import centralAssetRepoRepository from '../dataaccess/centralAssetRepoRepository';
import config from '../config/config';

jest.mock('common/src/config/catalogue');
jest.mock('./Stacks');
jest.mock('../dataaccess/stacksRepository');
jest.mock('../kubernetes/deploymentApi');
jest.mock('../dataaccess/centralAssetRepoRepository');
jest.mock('../config/config');

const origConfig = jest.requireActual('../config/config');
config.get = jest.fn().mockImplementation(s => origConfig.default.default(s));

const getStackMock = jest.fn();
Stacks.getStack = getStackMock;

const createOrUpdateMock = jest.fn().mockReturnValue(Promise.resolve());
const deleteStackMock = jest.fn().mockReturnValue(Promise.resolve());
stackRepository.default = {
  createOrUpdate: createOrUpdateMock,
  deleteStack: deleteStackMock,
};

const StackResolve = {
  name: 'expectedStackName',
  category: 'ANALYSIS',
  create: vals => Promise.resolve(vals),
  delete: vals => Promise.resolve(vals),
};

const params = {
  projectKey: 'project',
  name: 'expectedName',
  type: 'jupyter',
  another: 'field',
};

const user = 'username';

describe('Stack Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStack', () => {
    beforeEach(() => {
      deploymentApi.getDeployment.mockResolvedValueOnce({
        spec: { template: { spec: {
          volumes: [],
          containers: [{
            name: nameGenerators.deploymentName(params.name, params.type),
            volumeMounts: [],
          }],
        } } },
      });
      centralAssetRepoRepository.getMetadataWithIds.mockResolvedValueOnce([]);
    });

    afterAll(() => {
      deploymentApi.getDeployment.mockReset();
      centralAssetRepoRepository.getMetadataWithIds.mockReset();
    });

    it('calls Stack.create with correct parameters', async () => {
      getStackMock.mockReturnValue(StackResolve);

      const response = await stackManager.createStack(user, params);
      expect(response).toMatchSnapshot();
    });

    it('calls stack repository with correct parameters', () => {
      getStackMock.mockReturnValue(StackResolve);

      return stackManager.createStack(user, params)
        .then(() => expect(createOrUpdateMock.mock.calls).toMatchSnapshot());
    });

    it('failed Stack.create requests are caught', () => {
      getStackMock.mockReturnValue(null);

      return stackManager.createStack(user, params)
        .catch(err => expect(err).toMatchSnapshot());
    });
  });

  describe('restartStack', () => {
    it('calls deploymentApi.restartDeployment with correct parameters', async () => {
      // Arrange
      getStackMock.mockReturnValue(StackResolve);
      const restartDeploymentMock = jest.fn().mockResolvedValue('success');
      deploymentApi.restartDeployment = restartDeploymentMock;

      // Act
      const response = await stackManager.restartStack(params);

      // Assert
      expect(restartDeploymentMock).toBeCalledWith('jupyter-expectedName', 'project');
      expect(response).toEqual('success');
    });
  });

  describe('deleteStack', () => {
    it('calls Stack.delete with correct parameters', () => {
      getStackMock.mockReturnValue(StackResolve);

      return stackManager.deleteStack(user, params)
        .then(response => expect(response).toMatchSnapshot());
    });

    it('calls stack repository with correct parameters', () => {
      getStackMock.mockReturnValue(StackResolve);

      return stackManager.deleteStack(user, params)
        .then(() => expect(deleteStackMock.mock.calls).toMatchSnapshot());
    });

    it('failed Stack.delete requests are caught', () => {
      getStackMock.mockReturnValue(null);

      return stackManager.deleteStack(user, params)
        .catch(err => expect(err).toMatchSnapshot());
    });
  });

  describe('mountAssetsOnStack', () => {
    beforeAll(() => {
      centralAssetRepoRepository.getMetadataWithIds
        .mockImplementation(ids => ids.map(assetId => ({ assetId, fileLocation: `asset_${assetId}` })));
      catalogueConfig.catalogueServer.mockReturnValue('127.0.0.1');
      catalogueConfig.catalogueFileLocation.mockReturnValue('/test/assets/');
    });

    const projectKey = 'testproj';
    const stackName = 'teststack';
    const stackType = 'jupyterlab';
    const deploymentName = nameGenerators.deploymentName(stackName, stackType);
    const testVolumeName = 'test-volume';

    const getCurrentDeployment = (initialAssetIds) => {
      const assetVolumes = initialAssetIds.map(assetId => ({ name: `asset-${assetId}-initial` }));
      return {
        metadata: {
          name: deploymentName,
        },
        spec: {
          template: {
            spec: {
              volumes: [
                {
                  name: testVolumeName,
                  persistentVolumeClaim: {
                    claimName: 'test-volume-claim',
                  },
                },
                ...assetVolumes,
              ],
              containers: [
                {
                  name: deploymentName,
                  volumeMounts: [
                    {
                      name: testVolumeName,
                      mountPath: '/data',
                    },
                    ...assetVolumes,
                  ],
                },
                { name: 'supporting-container' },
              ],
            },
          },
        },
      };
    };

    it('throws an error if there is no deployment with specified details', async () => {
      deploymentApi.getDeployment.mockResolvedValueOnce(undefined);
      const stack = {
        projectKey,
        name: 'does-not-exist',
        type: 'jupyter',
      };

      expect.assertions(1);
      try {
        await stackManager.mountAssetsOnStack(stack);
      } catch (error) {
        expect(error.message).toEqual('Could not mount assets on Stack. No stack deployment with name: jupyter-does-not-exist in namespace: testproj');
      }
    });

    describe('applies the correct patch when', () => {
      it('there are initially no assets mounted to deployment and assets are added', async () => {
        const initialDeployment = getCurrentDeployment([]);
        deploymentApi.getDeployment.mockResolvedValueOnce(initialDeployment);
        const stack = {
          projectKey,
          name: stackName,
          type: stackType,
          assetIds: ['0001', '0002', '0003'],
        };

        await stackManager.mountAssetsOnStack(stack);

        expectCalledOnceToMatchSnapshot(deploymentApi.mergePatchDeployment);
      });

      it('there are initially assets mounted and the assets are updated', async () => {
        deploymentApi.getDeployment.mockResolvedValueOnce(getCurrentDeployment(['0001', '0002', '0003']));
        const stack = {
          projectKey,
          name: stackName,
          type: stackType,
          assetIds: ['0002', '0005'],
        };

        await stackManager.mountAssetsOnStack(stack);

        expectCalledOnceToMatchSnapshot(deploymentApi.mergePatchDeployment);
      });

      it('there are initially assets and the assets are removed', async () => {
        deploymentApi.getDeployment.mockResolvedValueOnce(getCurrentDeployment(['0001', '0002', '0003']));
        const stack = {
          projectKey,
          name: stackName,
          type: stackType,
          assetIds: [],
        };

        await stackManager.mountAssetsOnStack(stack);

        expectCalledOnceToMatchSnapshot(deploymentApi.mergePatchDeployment);
      });

      function expectCalledOnceToMatchSnapshot(mock) {
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock.mock.calls[0]).toMatchSnapshot();
      }
    });
  });
});
