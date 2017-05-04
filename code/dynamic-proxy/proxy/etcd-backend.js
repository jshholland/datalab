import etcdService from '../services/etcd.service.js';
import bunyan from 'bunyan';
import config from '../config';

const logger = bunyan.createLogger({name: 'etcd.backend'});

function startEtcdBackend(proxy) {
  etcdService.getOrCreateDirectory()
    .then(registerRoutes)
    .then(createWatcher);

  function createWatcher() {
    // Watch etcd directory
    const watcher = etcdService.createWatcher();

    // On Add/Update
    watcher.on("change", (body) => registerRoute(body.node));

    // On Delete
    watcher.on("delete", (body) => unregisterRoute(body.node));

    // Handle Errors
    watcher.on("error", (err) => logger.error(err, 'etcd backend error'));
  }

  function registerRoutes(routes) {
    routes.map((route) => registerRoute(route));
  }

  function registerRoute(route) {
    if(route.key && route.value){
      proxy.register(cleanEtcdDir(route.key), route.value);
    }
  }

  function unregisterRoute(route) {
    if(route.key){
      proxy.unregister(cleanEtcdDir(route.key));
    }
  }
}

function cleanEtcdDir(str) {
  let dirWithoutKey = str.replace(config.get('redbirdEtcdKey'), '').replace(/^\/+|\/+$/g, '');
  let decodedDir = dirWithoutKey.replace('-', '/');
  return decodedDir
}

export default startEtcdBackend;
