// this would be called deploymentName but this conflicts with the deploymentName arguments
// to other functions in this file.
const generateDeploymentName = (name, type) => `${type}-${name}`;
const pvcName = volumeName => `${volumeName}-claim`;
const stackCredentialSecret = generateDeploymentName;
const assetVolume = assetId => `asset-${assetId}`;
const isAssetVolume = volumeName => volumeName.match(/^asset-/);
const networkPolicyName = (name, type) => `${type}-${name}-netpol`;
const autoScalerName = (name, type) => `${type}-${name}-hpa`;

// project namespaces
const projectNamespace = projectKey => projectKey;
const projectComputeNamespace = projectKey => `${projectKey}-compute`;

// Compute submission
const computeSubmissionServiceAccount = projectKey => `${projectKey}-compute-submission-account`;
const computeSubmissionServiceAccountRoleBinding = projectKey => `${computeSubmissionServiceAccount(projectKey)}-role-binding`;
const computeSubmissionClusterRole = () => 'compute-submission-role';

// Spark
const pySparkConfigMap = deploymentName => `${deploymentName}-pyspark-config`;
const daskConfigMap = deploymentName => `${deploymentName}-dask-config`;
const sparkDriverHeadlessService = deploymentServiceName => `${deploymentServiceName}-spark-driver-headless-service`;
const sparkJob = deploymentName => `${deploymentName}-spark-job`;

// Dask
const schedulerPodLabel = name => `scheduler-${name}-po`;

export default {
  assetVolume,
  isAssetVolume,
  deploymentName: generateDeploymentName,
  computeSubmissionClusterRole,
  computeSubmissionServiceAccount,
  computeSubmissionServiceAccountRoleBinding,
  networkPolicyName,
  autoScalerName,
  projectNamespace,
  projectComputeNamespace,
  pvcName,
  pySparkConfigMap,
  daskConfigMap,
  sparkDriverHeadlessService,
  sparkJob,
  stackCredentialSecret,
  schedulerPodLabel,
};
