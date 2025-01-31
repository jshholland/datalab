import React from 'react';
import { shallow } from 'enzyme';
import createStore from 'redux-mock-store';
import { JUPYTER } from 'common/src/stackTypes';
import { NOTEBOOK_CATEGORY } from 'common/src/config/images';
import StacksContainer, { PureStacksContainer } from './StacksContainer';
import stackService from '../../api/stackService';
import listUsersService from '../../api/listUsersService';
import notify from '../../components/common/notify';

jest.mock('../../api/stackService');
let loadStacksMock;
let listUsersMock;

jest.mock('../../components/common/notify');
const toastErrorMock = jest.fn();
const toastSuccessMock = jest.fn();
notify.error = toastErrorMock;
notify.success = toastSuccessMock;

jest.useFakeTimers();

beforeEach(() => {
  loadStacksMock = jest.fn().mockReturnValue(Promise.resolve('expectedPayload'));
  stackService.loadStacksByCategory = loadStacksMock;

  listUsersMock = jest.fn();
  listUsersService.listUsers = listUsersMock;
});

describe('StacksContainer', () => {
  describe('is a connected component which', () => {
    const FormComponent = () => <div />;
    function shallowRenderConnected(store) {
      const props = {
        store,
        typeName: 'Notebook',
        containerType: NOTEBOOK_CATEGORY,
        dialogAction: 'ACTION',
        formStateName: 'createNotebook',
        PrivateComponent: () => {},
        PublicComponent: () => {},
        userPermissions: ['expectedPermission'],
        projectKey: 'project-key',
        formComponent: FormComponent,
        showCreateButton: true,
      };

      return shallow(<StacksContainer {...props} />).find('StacksContainer');
    }

    const stacks = { fetching: false, value: ['expectedArray'] };
    const currentProject = { fetching: false, value: 'project-key' };
    const store = createStore()({
      stacks,
      currentProject,
    });

    it('extracts the correct props from the redux state', () => {
      // Act
      const output = shallowRenderConnected(store);

      // Assert
      expect(output.prop('stacks')).toBe(stacks);
    });

    it('binds correct actions', () => {
      // Act
      const output = shallowRenderConnected(store).prop('actions');

      // Assert
      expect(Object.keys(output)).toMatchSnapshot();
    });

    it('loadStacks function dispatches correct action', () => {
      // Act
      const output = shallowRenderConnected(store);

      // Assert
      expect(store.getActions().length).toBe(0);
      output.prop('actions').loadStacksByCategory('project99', 'aCategory');
      const { type, payload } = store.getActions()[0];
      expect(type).toBe('LOAD_STACKS_BY_CATEGORY');
      return payload.then(value => expect(value).toEqual({ category: 'aCategory', projectKey: 'project99', stacks: 'expectedPayload' }));
    });
  });

  describe('is a container which', () => {
    function shallowRenderPure(props) {
      return shallow(<PureStacksContainer {...props} />);
    }

    const stacks = {
      fetching: false,
      value: [
        { prop: 'prop1', projectKey: 'project-key', type: JUPYTER, category: NOTEBOOK_CATEGORY, shared: 'private' },
        { prop: 'prop2', projectKey: 'project-key', type: JUPYTER, category: NOTEBOOK_CATEGORY, shared: 'project' },
      ],
    };

    const openModalDialogMock = jest.fn();
    const closeModalDialogMock = jest.fn();
    const getUrlMock = jest.fn();
    const openStackMock = jest.fn();
    const createStackMock = jest.fn();
    const deleteStackMock = jest.fn();
    const restFormMock = jest.fn();
    const getLogsMock = jest.fn();
    const shareStackMock = jest.fn();
    const updateStackShareStatusMock = jest.fn();
    const editStackMock = jest.fn();
    const restartStackMock = jest.fn();

    const FormComponent = () => <div />;

    const generateProps = () => ({
      stacks,
      typeName: 'Notebook',
      containerType: NOTEBOOK_CATEGORY,
      dialogAction: 'ACTION',
      editDialogAction: 'EDIT_DIALOG_ACTION',
      formStateName: 'createNotebook',
      userPermissions: ['expectedPermission'],
      actions: {
        loadStacksByCategory: loadStacksMock,
        getUrl: getUrlMock,
        openStack: openStackMock,
        createStack: createStackMock,
        deleteStack: deleteStackMock,
        openModalDialog: openModalDialogMock,
        closeModalDialog: closeModalDialogMock,
        resetForm: restFormMock,
        listUsers: listUsersMock,
        getLogs: getLogsMock,
        updateStackShareStatus: updateStackShareStatusMock,
        shareStack: shareStackMock,
        editStack: editStackMock,
        restartStack: restartStackMock,
      },
      projectKey: { fetching: false, value: 'project-key' },
      formComponent: FormComponent,
      modifyData: true,
    });

    beforeEach(() => jest.clearAllMocks());

    it('calls loadNotebooks action when mounted', () => {
      // Arrange
      const props = generateProps();

      // Act
      shallowRenderPure(props);

      // Assert
      expect(loadStacksMock).toHaveBeenCalledTimes(1);
    });

    it('setTimeout is called once the loadStackByCategory has resolved', async () => {
      // Arrange
      const props = generateProps();

      // Act
      const output = new PureStacksContainer(props);

      // Assert
      expect(loadStacksMock).toHaveBeenCalledTimes(0);
      expect(listUsersMock).toHaveBeenCalledTimes(0);
      expect(setTimeout).toHaveBeenCalledTimes(0);
      await output.loadStack();
      expect(loadStacksMock).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    it('passes correct props to StackCard', () => {
      // Arrange
      const props = generateProps();

      // Act
      expect(shallowRenderPure(props)).toMatchSnapshot();
    });

    it('openNotebook method calls openNotebook action on resolved getUrl', () => {
      // Arrange
      getUrlMock.mockReturnValue(Promise.resolve({ value: { redirectUrl: 'expectedUrl' } }));
      const props = generateProps();
      const output = shallowRenderPure(props);
      const openStack = output.prop('openStack');

      // Act/Assert
      expect(getUrlMock).not.toHaveBeenCalled();
      expect(openStackMock).not.toHaveBeenCalled();
      return openStack({ id: 1000 })
        .then(() => {
          expect(getUrlMock).toHaveBeenCalledTimes(1);
          expect(getUrlMock).toHaveBeenCalledWith('project-key', 1000);
          expect(openStackMock).toHaveBeenCalledTimes(1);
          expect(openStackMock).toHaveBeenCalledWith('expectedUrl');
        });
    });

    it('openStack method calls toast on unresolved getUrl', () => {
      // Arrange
      getUrlMock.mockReturnValue(Promise.reject(new Error('no url')));
      const props = generateProps();
      const output = shallowRenderPure(props);
      const openStack = output.prop('openStack');

      // Act/Assert
      expect(getUrlMock).not.toHaveBeenCalled();
      expect(toastErrorMock).not.toHaveBeenCalled();
      return openStack({ id: 1000 })
        .then(() => {
          expect(getUrlMock).toHaveBeenCalledTimes(1);
          expect(getUrlMock).toHaveBeenCalledWith('project-key', 1000);
          expect(toastErrorMock).toHaveBeenCalledTimes(1);
          expect(toastErrorMock).toHaveBeenCalledWith('Unable to open Notebook');
        });
    });

    it('confirmDeleteStack calls openModalDialog with correct action', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act/Assert
      const output = shallowRenderPure(props);
      const deleteStack = output.prop('deleteStack');
      expect(openModalDialogMock).not.toHaveBeenCalled();
      deleteStack(stack);
      expect(openModalDialogMock).toHaveBeenCalledTimes(1);
      const firstMockCall = openModalDialogMock.mock.calls[0];
      expect(firstMockCall[0]).toBe('MODAL_TYPE_CONFIRMATION');
    });

    it('confirmDeleteStack generates correct dialog', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const deleteStack = output.prop('deleteStack');
      deleteStack(stack);

      // Assert
      const firstMockCall = openModalDialogMock.mock.calls[0];
      const { title, body, onCancel } = firstMockCall[1];
      expect({ title, body }).toMatchSnapshot();
      expect(onCancel).toBe(closeModalDialogMock);
    });

    it('confirmDeleteStack - onSubmit calls deleteStack with correct value', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const deleteStack = output.prop('deleteStack');
      deleteStack(stack);
      const { onSubmit } = openModalDialogMock.mock.calls[0][1];

      // Assert
      expect(deleteStackMock).not.toHaveBeenCalled();
      return onSubmit()
        .then(() => {
          expect(deleteStackMock).toHaveBeenCalledTimes(1);
          expect(deleteStackMock).toHaveBeenCalledWith(stack);
        });
    });

    it('confirmShareStack calls openModalDialog with correct action', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act/Assert
      const output = shallowRenderPure(props);
      const shareStack = output.prop('shareStack');
      expect(openModalDialogMock).not.toHaveBeenCalled();
      shareStack(stack, 'project');
      expect(openModalDialogMock).toHaveBeenCalledTimes(1);
      const firstMockCall = openModalDialogMock.mock.calls[0];
      expect(firstMockCall[0]).toBe('MODAL_TYPE_SHARE_STACK');
    });

    it('confirmShareStack generates correct dialog for setting access to private', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const shareStack = output.prop('shareStack');
      shareStack(stack, 'private');

      // Assert
      const firstMockCall = openModalDialogMock.mock.calls[0];
      const { title, body, onCancel } = firstMockCall[1];
      expect({ title, body }).toMatchSnapshot();
      expect(onCancel).toBe(closeModalDialogMock);
    });

    it('confirmShareStack generates correct dialog for setting access to project', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const shareStack = output.prop('shareStack');
      shareStack(stack, 'project');

      // Assert
      const firstMockCall = openModalDialogMock.mock.calls[0];
      const { title, body, onCancel } = firstMockCall[1];
      expect({ title, body }).toMatchSnapshot();
      expect(onCancel).toBe(closeModalDialogMock);
    });

    it('confirmShareStack generates correct dialog for setting access to public', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const shareStack = output.prop('shareStack');
      shareStack(stack, 'public');

      // Assert
      const firstMockCall = openModalDialogMock.mock.calls[0];
      const { title, body, onCancel } = firstMockCall[1];
      expect({ title, body }).toMatchSnapshot();
      expect(onCancel).toBe(closeModalDialogMock);
    });

    it('confirmShareStack - onSubmit calls shareStack with correct value', async () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const shareStack = output.prop('shareStack');
      shareStack(stack, 'project');
      const { onSubmit } = openModalDialogMock.mock.calls[0][1];

      // Assert
      expect(updateStackShareStatusMock).not.toHaveBeenCalled();

      await onSubmit();
      expect(updateStackShareStatusMock).toHaveBeenCalledTimes(1);
      expect(updateStackShareStatusMock).toHaveBeenCalledWith({ ...stack, shared: 'project' });
      expect(toastSuccessMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).toHaveBeenCalledTimes(0);
    });

    it('confirmShareStack - notifies error if shareStack fails', async () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      updateStackShareStatusMock.mockImplementationOnce(() => { throw Error('expected test error'); });

      // Act
      const output = shallowRenderPure(props);
      const shareStack = output.prop('shareStack');
      shareStack(stack, 'project');
      const { onSubmit } = openModalDialogMock.mock.calls[0][1];

      // Assert
      expect(updateStackShareStatusMock).not.toHaveBeenCalled();

      await onSubmit();
      expect(updateStackShareStatusMock).toHaveBeenCalledTimes(1);
      expect(updateStackShareStatusMock).toHaveBeenCalledWith({ ...stack, shared: 'project' });
      expect(toastSuccessMock).toHaveBeenCalledTimes(0);
      expect(toastErrorMock).toHaveBeenCalledTimes(1);
    });

    it('openCreationForm calls openModalDialog with correct action', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act/Assert
      const output = shallowRenderPure(props);
      const openCreationForm = output.prop('openCreationForm');
      expect(openModalDialogMock).not.toHaveBeenCalled();
      openCreationForm(stack);
      expect(openModalDialogMock).toHaveBeenCalledTimes(1);
      const firstMockCall = openModalDialogMock.mock.calls[0];
      expect(firstMockCall[0]).toBe('ACTION');
    });

    it('openCreationForm generates correct dialog', () => {
      // Arrange
      const props = generateProps();
      const stack = { displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const openCreationForm = output.prop('openCreationForm');
      expect(openModalDialogMock).not.toHaveBeenCalled();
      openCreationForm(stack);

      // Assert
      const firstMockCall = openModalDialogMock.mock.calls[0];
      const { title, onCancel } = firstMockCall[1];
      expect({ title }).toMatchSnapshot();
      expect(onCancel).toBe(closeModalDialogMock);
    });

    it('openCreationForm - onSubmit calls createStack with correct value', () => {
      // Arrange
      const props = generateProps();
      const stack = { projectKey: 'project-key', displayName: 'expectedDisplayName' };

      // Act
      const output = shallowRenderPure(props);
      const openCreationForm = output.prop('openCreationForm');
      openCreationForm();
      const { onSubmit } = openModalDialogMock.mock.calls[0][1];

      // Assert
      expect(createStackMock).not.toHaveBeenCalled();
      expect(restFormMock).not.toHaveBeenCalled();
      expect(loadStacksMock).toHaveBeenCalledTimes(1);
      return onSubmit(stack)
        .then(() => {
          expect(createStackMock).toHaveBeenCalledTimes(1);
          expect(createStackMock).toHaveBeenCalledWith(stack);
          expect(restFormMock).toHaveBeenCalledTimes(1);
          expect(restFormMock).toHaveBeenCalledWith('createNotebook');
        });
    });

    describe('openEditForm', () => {
      it('calls openModalDialog with correct action', () => {
        // Arrange
        const props = generateProps();
        const stack = { displayName: 'expectedDisplayName' };

        // Act/Assert
        const output = shallowRenderPure(props);
        const openEditForm = output.prop('editStack');
        expect(openModalDialogMock).not.toHaveBeenCalled();
        openEditForm(stack);
        expect(openModalDialogMock).toHaveBeenCalledTimes(1);
        const firstMockCall = openModalDialogMock.mock.calls[0];
        expect(firstMockCall[0]).toBe('EDIT_DIALOG_ACTION');
      });

      it('calls openModalDialog with correct props', () => {
        // Arrange
        const props = generateProps();
        const inputStack = { displayName: 'expectedDisplayName' };

        // Act
        const output = shallowRenderPure(props);
        const openEditForm = output.prop('editStack');
        expect(openModalDialogMock).not.toHaveBeenCalled();
        openEditForm(inputStack);

        // Assert
        const firstMockCall = openModalDialogMock.mock.calls[0];
        const { title, onSubmit, onCancel, formComponent, stack } = firstMockCall[1];
        expect({ title }).toMatchSnapshot();
        expect(onSubmit).toBe(output.instance().editStack);
        expect(onCancel).toBe(closeModalDialogMock);
        expect(formComponent).toBe(FormComponent);
        expect(stack).toBe(inputStack);
      });

      it('onSubmit calls edit stack with correct value', async () => {
        // Arrange
        const props = generateProps();
        const stack = { projectKey: 'project-key', displayName: 'expectedDisplayName' };

        // Act
        const output = shallowRenderPure(props);
        const openEditForm = output.prop('editStack');
        openEditForm();
        const { onSubmit } = openModalDialogMock.mock.calls[0][1];

        // Assert
        expect(editStackMock).not.toHaveBeenCalled();
        expect(restFormMock).not.toHaveBeenCalled();
        expect(loadStacksMock).toHaveBeenCalledTimes(1);

        await onSubmit(stack);

        expect(editStackMock).toHaveBeenCalledTimes(1);
        expect(editStackMock).toHaveBeenCalledWith(stack);
        expect(restFormMock).toHaveBeenCalledTimes(1);
        expect(restFormMock).toHaveBeenCalledWith(props.formStateName);
      });
    });

    describe('confirmRestartStack', () => {
      it('calls openModalDialog with correct action', () => {
        // Arrange
        const props = generateProps();
        const stack = { displayName: 'expectedDisplayName' };

        // Act/Assert
        const output = shallowRenderPure(props);
        const confirmRestartStack = output.prop('restartStack');
        expect(openModalDialogMock).not.toHaveBeenCalled();
        confirmRestartStack(stack);
        expect(openModalDialogMock).toHaveBeenCalledTimes(1);
        const firstMockCall = openModalDialogMock.mock.calls[0];
        expect(firstMockCall[0]).toBe('MODAL_TYPE_RESTART_STACK');
      });

      it('calls openModalDialog with correct props', () => {
        // Arrange
        const props = generateProps();
        const stack = {
          projectKey: 'project-key',
          name: 'stackName',
          type: 'jupyter',
          displayName: 'Stack Display Name',
        };

        // Act
        const output = shallowRenderPure(props);
        const confirmRestartStack = output.prop('restartStack');
        expect(openModalDialogMock).not.toHaveBeenCalled();
        confirmRestartStack(stack);

        // Assert
        const firstMockCall = openModalDialogMock.mock.calls[0];
        const { title, onCancel } = firstMockCall[1];
        expect({ title }).toMatchSnapshot();
        expect(onCancel).toBe(closeModalDialogMock);
      });

      it('onSubmit calls restartStack with correct value', async () => {
        // Arrange
        const props = generateProps();
        const stack = { projectKey: 'project-key', name: 'stackName', type: 'jupyter' };

        // Act
        const output = shallowRenderPure(props);
        const confirmRestartStack = output.prop('restartStack');
        confirmRestartStack(stack);
        const { onSubmit } = openModalDialogMock.mock.calls[0][1];

        // Assert
        expect(restartStackMock).not.toHaveBeenCalled();
        expect(restFormMock).not.toHaveBeenCalled();
        expect(loadStacksMock).toHaveBeenCalledTimes(1);

        await onSubmit(stack);

        expect(restartStackMock).toHaveBeenCalledTimes(1);
        expect(restartStackMock).toHaveBeenCalledWith(stack);
        expect(restFormMock).toHaveBeenCalledTimes(1);
        expect(restFormMock).toHaveBeenCalledWith(props.formStateName);
      });
    });
  });
});
