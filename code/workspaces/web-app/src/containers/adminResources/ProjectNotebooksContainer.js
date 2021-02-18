import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ProjectStacksContainer } from '../stacks/StacksContainer';
import { MODAL_TYPE_CREATE_NOTEBOOK, MODAL_TYPE_EDIT_NOTEBOOK } from '../../constants/modaltypes';
import EditNotebookForm from '../../components/notebooks/EditNotebookForm';
import { CONTAINER_TYPE, FORM_NAME } from '../notebooks/NotebooksContainer';
import { NOTEBOOK_TYPE_NAME, NOTEBOOK_TYPE_NAME_PLURAL } from '../notebooks/notebookTypeName';
import assetRepoActions from '../../actions/assetRepoActions';

const ProjectNotebooksContainer = (props) => {
  const dispatch = useDispatch();
  const { userPermissions, project } = props;
  const projectKey = {
    error: null,
    fetching: false,
    value: project.key,
  };

  useEffect(() => {
    dispatch(assetRepoActions.loadVisibleAssets(project.key));
  }, [dispatch, project.key]);

  return (
  <ProjectStacksContainer
    typeName={NOTEBOOK_TYPE_NAME}
    typeNamePlural={NOTEBOOK_TYPE_NAME_PLURAL}
    containerType={CONTAINER_TYPE}
    dialogAction={MODAL_TYPE_CREATE_NOTEBOOK}
    editDialogAction={MODAL_TYPE_EDIT_NOTEBOOK}
    formStateName={FORM_NAME}
    formComponent={EditNotebookForm}
    userPermissions={userPermissions}
    projectKey={projectKey}
  />
  );
};

export default ProjectNotebooksContainer;
