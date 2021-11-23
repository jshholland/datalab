import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import { render } from '@testing-library/react';
import { PERMISSION_VALUES, PERMISSIONS } from '../../constants/permissions';
import { CheckboxCell, PermissionsCheckbox, RemoveUserButtonCell } from './UserPermissionsTableActionCells';

jest.mock('@material-ui/core/Checkbox', () => props => (<div>CheckBox mock {JSON.stringify(props)}</div>));

describe('CheckboxCell', () => {
  const classes = {
    activeSelection: 'active',
    implicitSelection: 'implicit',
  };

  it('renders correctly passing props to PermissionsCheckbox in TableCell', () => {
    const user = { role: PERMISSIONS.ADMIN };
    const checkboxSpec = { name: PERMISSIONS.ADMIN, value: PERMISSION_VALUES.ADMIN };

    expect(
      render(
        <table>
          <tbody>
            <tr>
              <CheckboxCell
                user={user}
                isCurrentUser={false}
                checkboxSpec={checkboxSpec}
                projectKey="projectKey"
                classes={classes}
                cellKey="key"
                dispatch={jest.fn()}
              />
          </tr>
        </tbody>
      </table>,
      ).container,
    ).toMatchSnapshot();
  });
});

describe('PermissionsCheckbox', () => {
  let shallow;

  const classes = {
    activeSelection: 'active',
    implicitSelection: 'implicit',
  };

  beforeEach(() => {
    shallow = createShallow();
  });

  describe('when user has rights equal to CheckboxSpec', () => {
    const user = { role: PERMISSIONS.ADMIN };
    const checkboxSpec = { name: PERMISSIONS.ADMIN, value: PERMISSION_VALUES.ADMIN };
    it('returns an checked active selection check box', () => {
      expect(
        render(
          <PermissionsCheckbox
            user={user}
            isCurrentUser={false}
            checkboxSpec={checkboxSpec}
            project="project"
            classes={classes}
            dispatch={jest.fn()}
          />,
        ).container,
      ).toMatchSnapshot();
    });
  });

  describe('when user has rights greater than CheckboxSpec', () => {
    const user = { role: PERMISSIONS.ADMIN };
    const checkboxSpec = { name: PERMISSIONS.USER, value: PERMISSION_VALUES.USER };
    it('returns an checked implicit selection check box', () => {
      expect(
        render(
          <PermissionsCheckbox
            user={user}
            isCurrentUser={false}
            checkboxSpec={checkboxSpec}
            project="project"
            classes={classes}
            dispatch={jest.fn()}
          />,
        ).container,
      ).toMatchSnapshot();
    });
  });

  describe('when user has rights less than CheckboxSpec', () => {
    const user = { role: PERMISSIONS.VIEWER };
    const checkboxSpec = { name: PERMISSIONS.ADMIN, value: PERMISSION_VALUES.ADMIN };
    it('returns an unchecked check box', () => {
      expect(
        render(
          <PermissionsCheckbox
            user={user}
            isCurrentUser={false}
            checkboxSpec={checkboxSpec}
            project="project"
            classes={classes}
            dispatch={jest.fn()}
          />,
        ).container,
      ).toMatchSnapshot();
    });
  });

  describe('when checkbox user is the current user', () => {
    const user = { role: PERMISSIONS.ADMIN };
    const checkboxSpec = { name: PERMISSIONS.USER, value: PERMISSION_VALUES.USER };

    it('renders with correct check status and as disabled', () => {
      expect(
        render(
          <PermissionsCheckbox
            user={user}
            isCurrentUser={true}
            checkboxSpec={checkboxSpec}
            project="project"
            classes={classes}
            dispatch={jest.fn()}
          />,
        ).container,
      ).toMatchSnapshot();
    });
  });

  describe('when the checkbox is clicked', () => {
    const mockActions = {
      addUserPermission: jest.fn(),
    };
    mockActions.addUserPermission.mockReturnValue('expected-result');

    const mockDispatch = jest.fn();
    const projectKey = 'projectKey';
    const user = { name: 'User One', userId: 'user-one-id', role: PERMISSIONS.USER };
    const checkboxSpec = { name: PERMISSIONS.ADMIN, value: PERMISSION_VALUES.ADMIN };

    it('dispatches update action with correct user and new permission level', () => {
      const wrapper = shallow(
        <PermissionsCheckbox
          user={user}
          isCurrentUser={true}
          checkboxSpec={checkboxSpec}
          projectKey={projectKey}
          classes={classes}
          actions={mockActions}
          dispatch={mockDispatch}
        />,
      );
      wrapper.find(Checkbox).simulate('click');
      expect(mockActions.addUserPermission).toHaveBeenCalledTimes(1);
      expect(mockActions.addUserPermission).toHaveBeenCalledWith(projectKey, user, checkboxSpec.name, mockDispatch);
    });
  });
});

describe('RemoveUserButtonCell', () => {
  const classes = { tableCell: 'tableCell' };
  const user = { name: 'User One', userId: 'user-one-id' };

  let shallow;

  beforeEach(() => {
    shallow = createShallow();
  });

  it('renders as disabled when on the row of the current user', () => {
    expect(
      render(
        <table>
          <tbody>
            <tr>
        <RemoveUserButtonCell
          user={user}
          isCurrentUser={true}
          classes={classes}
          setRemoveUserDialogState={jest.fn()}
        />
        </tr>
        </tbody>
        </table>,
      ).container,
    ).toMatchSnapshot();
  });

  it('sets the remove user dialog state so it opens when clicked', () => {
    const mockSetRemoveUserDialogState = jest.fn();
    const wrapper = shallow(
      <RemoveUserButtonCell
        user={user}
        isCurrentUser={true}
        classes={classes}
        setRemoveUserDialogState={mockSetRemoveUserDialogState}
      />,
    );

    wrapper.find(IconButton).simulate('click');
    expect(mockSetRemoveUserDialogState).toHaveBeenCalledTimes(1);
    expect(mockSetRemoveUserDialogState).toHaveBeenCalledWith({ user, open: true });
  });
});
