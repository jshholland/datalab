import { Redirect, Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { permissionTypes } from 'common';
import DaskPage from './pages/DaskPage';
import DataStoragePage from './pages/DataStoragePage';
import InfoPage from './pages/InfoPage';
import ModalRoot from './containers/modal/ModalRoot';
import NavigationContainer from './containers/app/NavigationContainer';
import NotebooksPage from './pages/NotebooksPage';
import NotFoundPage from './pages/NotFoundPage';
import ProjectsPage from './pages/ProjectsPage';
import PublishingPage from './pages/PublishingPage';
import RoutePermissions from './components/common/RoutePermissionWrapper';
import SparkPage from './pages/SparkPage';
import SettingsPage from './pages/SettingsPage';

const { projectPermissions: { PROJECT_STORAGE_LIST, PROJECT_STACKS_LIST, PROJECT_SETTINGS_LIST } } = permissionTypes;

const PrivateApp = ({ promisedUserPermissions }) => (
  <NavigationContainer userPermissions={promisedUserPermissions.value}>
    <Switch>
      <RoutePermissions
       exact path="/projects"
       component={ProjectsPage}
       promisedUserPermissions={promisedUserPermissions}
       permission={PROJECT_STACKS_LIST}
       alt={NotFoundPage} />
       />
      <Redirect exact from="/" to="/projects" />
      <RoutePermissions
        exact
        path="/info"
        component={InfoPage}
        promisedUserPermissions={promisedUserPermissions}
        permission={PROJECT_STORAGE_LIST}
        alt={NotFoundPage} />
      <RoutePermissions
        exact
        path="/storage"
        component={DataStoragePage}
        promisedUserPermissions={promisedUserPermissions}
        permission={PROJECT_STORAGE_LIST}
        alt={NotFoundPage} />
      <RoutePermissions
        exact
        path="/notebooks"
        component={NotebooksPage}
        promisedUserPermissions={promisedUserPermissions}
        permission={PROJECT_STACKS_LIST}
        alt={NotFoundPage} />
      <RoutePermissions
        exact
        path="/publishing"
        component={PublishingPage}
        promisedUserPermissions={promisedUserPermissions}
        permission={PROJECT_STACKS_LIST}
        alt={NotFoundPage} />
      <RoutePermissions
        exact
        path="/settings"
        component={SettingsPage}
        promisedUserPermissions={promisedUserPermissions}
        permission={PROJECT_SETTINGS_LIST}
        alt={NotFoundPage} />
      <Route exact path="/dask" component={DaskPage} />
      <Route exact path="/spark" component={SparkPage} />
      <Route component={NotFoundPage} />
    </Switch>
    <ModalRoot />
  </NavigationContainer>
);

PrivateApp.propTypes = {
  promisedUserPermissions: PropTypes.shape({
    error: PropTypes.any,
    fetching: PropTypes.bool.isRequired,
    value: PropTypes.array.isRequired,
  }).isRequired,
};

export default PrivateApp;
