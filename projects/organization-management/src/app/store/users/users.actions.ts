import { createAction } from '@ngrx/store';

import { httpError, payload } from 'ish-core/utils/ngrx-creators';

import { B2bUser } from '../../models/b2b-user/b2b-user.model';

export const loadUsers = createAction('[Users] Load Users');

export const loadUsersFail = createAction('[Users API] Load Users Fail', httpError());

export const loadUsersSuccess = createAction('[Users API] Load Users Success', payload<{ users: B2bUser[] }>());

export const loadUserFail = createAction('[Users API] Load User Fail', httpError());

export const loadUserSuccess = createAction('[Users API] Load User Success', payload<{ user: B2bUser }>());

export const addUser = createAction('[Users] Add User', payload<{ user: B2bUser }>());

export const addUserFail = createAction('[Users API] Add User Fail', httpError());

export const addUserSuccess = createAction('[Users API] Add User Success', payload<{ user: B2bUser }>());

export const updateUser = createAction('[Users] Update User', payload<{ user: B2bUser }>());

export const updateUserFail = createAction('[Users API] Update User Fail', httpError());

export const updateUserSuccess = createAction('[Users API] Update User Success', payload<{ user: B2bUser }>());

export const resetUsers = createAction('[Users] Reset Users');

export const deleteUser = createAction('[Users API] Delete User', payload<{ login: string }>());

export const deleteUserFail = createAction('[Users API] Delete User Fail', httpError());

export const deleteUserSuccess = createAction('[Users API] Delete User Success', payload<{ login: string }>());