import vault from './vault';
import tokenGenerator from './tokenGenerator';

function createNewJupyterCredentials() {
  return {
    token: tokenGenerator.generateUUID(),
  };
}

function createNewRStudioCredentials() {
  return {
    username: 'datalab',
    password: tokenGenerator.generateUUID(),
  };
}

function storeCredentialsInVault(datalab, id, secret) {
  return vault.ensureSecret(`${datalab}/notebooks/${id}`, secret);
}

function deleteSecret(datalab, id) {
  return vault.deleteSecret(`${datalab}/notebooks/${id}`);
}

export default { createNewJupyterCredentials, createNewRStudioCredentials, storeCredentialsInVault, deleteSecret };
