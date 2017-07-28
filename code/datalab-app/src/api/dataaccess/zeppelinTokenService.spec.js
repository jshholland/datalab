import moxios from 'moxios';
import logger from 'winston';
import zeppelinTokenService from './zeppelinTokenService';
import vault from './vault/vault';

jest.mock('winston');

const vaultMock = jest.fn();
vault.requestZeppelinKeys = vaultMock;

beforeEach(() => {
  moxios.install();
});

afterEach(() => {
  moxios.uninstall();
  logger.clearMessages();
});

const notebook = {
  name: 'zeppelin',
  url: 'http://zeppelin',
};
const loginUrl = `${notebook.url}/api/login`;

describe('zeppelinTokenService', () => {
  it('should request login cookie from zeppelin', () => {
    vaultMock.mockImplementationOnce(() => (Promise.resolve({
      username: 'datalab',
      password: 'password',
    })));

    moxios.stubRequest(loginUrl, {
      status: 200,
      response: { message: 'message' },
      headers: getSuccessfulLoginResponse(),
    });

    return zeppelinTokenService.requestZeppelinCookie(notebook)
      .then((token) => {
        expect(token).toEqual('8214bf3f-3988-45f2-a33c-58d4be09f02b');
      });
  });

  it('should return undefined and log error if keys are not returned', () => {
    vaultMock.mockImplementationOnce(() => (Promise.resolve({})));

    return zeppelinTokenService.requestZeppelinCookie(notebook)
      .then((token) => {
        expect(token).toBeUndefined();
        expect(logger.getErrorMessages()).toMatchSnapshot();
      });
  });

  it('should return undefined and log error if login fails', () => {
    vaultMock.mockImplementationOnce(() => (Promise.resolve({
      username: 'datalab',
      password: 'password',
    })));

    moxios.stubRequest(loginUrl, {
      status: 403,
      response: getFailedLoginResponse(),
    });

    return zeppelinTokenService.requestZeppelinCookie(notebook)
      .then((token) => {
        expect(token).toBeUndefined();
        expect(logger.getErrorMessages()).toMatchSnapshot();
      });
  });
});

function getSuccessfulLoginResponse() {
  return {
    date: 'Fri, 28 Jul 2017 12:48:40 GMT, Friday, July 28, 2017 12:48:40 PM UTC, Fri, 28 Jul 2017 12:48:40 GMT',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization,Content-Type',
    'access-control-allow-methods': 'POST, GET, OPTIONS, PUT, HEAD, DELETE',
    'set-cookie': [
      'rememberMe=deleteMe; Path=/; Max-Age=0; Expires=Thu, 27-Jul-2017 12:48:40 GMT',
      'JSESSIONID=ec35437e-c9b7-4203-8633-fd08bfde2b62; Path=/; HttpOnly',
      'JSESSIONID=deleteMe; Path=/; Max-Age=0; Expires=Thu, 27-Jul-2017 12:48:40 GMT',
      'JSESSIONID=8214bf3f-3988-45f2-a33c-58d4be09f02b; Path=/; HttpOnly',
      'rememberMe=deleteMe; Path=/; Max-Age=0; Expires=Thu, 27-Jul-2017 12:48:40 GMT',
    ],
    'content-type': 'application/json',
    connection: 'close',
    server: 'Jetty(9.2.15.v20160210)',
  };
}

function getFailedLoginResponse() {
  return {
    status: 'FORBIDDEN',
    message: '',
    body: '',
  };
}
