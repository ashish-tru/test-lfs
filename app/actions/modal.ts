import { ProjectsSchema } from '@stackabl/core/render/Database/schema';
import { IList } from '../utils/ListSchema';

export enum ModalTypeKeys {
  QUIT_STACKABL = 'QUIT_STACKABL',
  LOGOUT_STACKABL = 'LOGOUT_STACKABL',
  ADD_DESCRIPTION = 'ADD_DESCRIPTION',
  SEARCH_AND_REPLACE = 'SEARCH_AND_REPLACE',
  DELETE_PROJECT = 'DELETE_PROJECT',
  ERROR_MODAL = 'ERROR_MODAL',
  NO_SIGNAL = 'NO_SIGNAL',
  UPDATE_MODAL = 'UPDATE_MODAL',
  RELEASE_UPDATES_MODAL = 'RELEASE_UPDATES_MODAL',
  IMPORT_DATABASE_MODAL = 'IMPORT_DATABASE_MODAL',
  SHOW_GIT_SWITCH_MODAL = 'SHOW_GIT_SWITCH_MODAL',
  WEBSITE_CLONE_MODAL = 'WEBSITE_CLONE_MODAL',
  SSH_KEYS_MODAL = 'SSH_KEY_MODAL',
  SSH_KEY_DETAIL_MODAL = 'SSH_KEY_DETAIL_MODAL',
  ATTACH_EXISTING_PROJECT = 'ATTACH_EXISTING_PROJECT',
}

export interface ModalDataType {
  show: boolean;
  yes: boolean;
  no: boolean;
  dont_show_again?: boolean;
}

export interface SSHKeyDataModal {
  show: boolean;
  yes: boolean;
  no: boolean;
  ssh: {
    name: string;
    id: number;
    publicKey: string;
    privateKey: string;
    keyName: string;
  };
}

export interface GithubAccount {
  show: boolean;
  yes: boolean;
  no: boolean;
}

export interface WebsiteCloneDataType {
  show: boolean;
  yes: boolean;
  no: boolean;
  project?: ProjectsSchema;
}

export interface AddSSHDataType {
  show: boolean;
  yes: boolean;
  no: boolean;
  updated?: boolean;
  removeSSHOption: string;
}

export interface SearchReplaceDataType {
  show: boolean;
  yes: boolean;
  no: boolean;
  dont_show_again: boolean;
  cancel_btn_text: string;
}

export interface ImportDataType {
  show: boolean;
  yes: boolean;
  no: boolean;
  project: IList;
}
export interface ShowSyncSuccesType {
  show: boolean;
  yes: boolean;
  no: boolean;
  project: IList;
}
export interface SyncErrorType {
  show: boolean;
  yes: boolean;
  no: boolean;
  project: IList;
}

export interface DeleteProjectType {
  show: boolean;
  project: IList[];
}

export interface UpdateStackablType {
  show: boolean;
  cancel: boolean;
  percentage: number;
  text: string;
}

export type SearchReplace = SearchReplaceDataType & { project: IList };

export interface EditProjectDataType {
  show: boolean;
  project: IList;
}

interface AddDescriptionModal {
  type: typeof ModalTypeKeys.ADD_DESCRIPTION;
  payload: EditProjectDataType;
}

interface ShowQuitModal {
  type: typeof ModalTypeKeys.QUIT_STACKABL;
  payload: ModalDataType;
}

interface ShowLogOutModal {
  type: typeof ModalTypeKeys.LOGOUT_STACKABL;
  payload: ModalDataType;
}

interface SearchAndReplaceModal {
  type: typeof ModalTypeKeys.SEARCH_AND_REPLACE;
  payload: SearchReplace;
}

interface NoSignalModal {
  type: typeof ModalTypeKeys.NO_SIGNAL;
  payload: ModalDataType;
}

interface ErrorModal {
  type: typeof ModalTypeKeys.ERROR_MODAL;
  payload: ModalDataType;
}

interface UpdateModal {
  type: typeof ModalTypeKeys.UPDATE_MODAL;
  payload: UpdateStackablType;
}

interface DeleteProjectModal {
  type: typeof ModalTypeKeys.DELETE_PROJECT;
  payload: DeleteProjectType;
}

interface ReleaseUpdateModal {
  type: typeof ModalTypeKeys.RELEASE_UPDATES_MODAL;
  payload: ModalDataType;
}

interface ShowImportDataBaseModal {
  type: typeof ModalTypeKeys.IMPORT_DATABASE_MODAL;
  payload: ImportDataType;
}

interface ShowGitSwitchModal {
  type: typeof ModalTypeKeys.SHOW_GIT_SWITCH_MODAL;
  payload: GithubAccount;
}

interface ShowWebsiteCloneModal {
  type: typeof ModalTypeKeys.WEBSITE_CLONE_MODAL;
  payload: WebsiteCloneDataType;
}

interface ShowSSHKeysModal {
  type: typeof ModalTypeKeys.SSH_KEYS_MODAL;
  payload: AddSSHDataType;
}

interface ShowSSHKeyDetailModal {
  type: typeof ModalTypeKeys.SSH_KEY_DETAIL_MODAL;
  payload: SSHKeyDataModal;
}

interface ShowAttachExistingProjectModal {
  type: typeof ModalTypeKeys.ATTACH_EXISTING_PROJECT;
  payload: ModalDataType;
}

export type ModalType =
  | ShowQuitModal
  | ShowLogOutModal
  | AddDescriptionModal
  | SearchAndReplaceModal
  | NoSignalModal
  | ErrorModal
  | UpdateModal
  | DeleteProjectModal
  | ReleaseUpdateModal
  | ShowImportDataBaseModal
  | ShowWebsiteCloneModal
  | ShowSSHKeysModal
  | ShowGitSwitchModal
  | ShowSSHKeyDetailModal
  | ShowAttachExistingProjectModal;

export const showWebsiteCloneModal = (payload: WebsiteCloneDataType) => {
  return {
    type: ModalTypeKeys.WEBSITE_CLONE_MODAL,
    payload,
  };
};

export const showQuitModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.QUIT_STACKABL,
    payload,
  };
};

export const showLogOutModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.LOGOUT_STACKABL,
    payload,
  };
};

export const addDescriptionModal = (payload: EditProjectDataType) => {
  return {
    type: ModalTypeKeys.ADD_DESCRIPTION,
    payload,
  };
};

// for the optimization in future

// export const showModal = (type: '', payload: '') => {
//   return {
//     type,
//     payload,
//   };
// };

export const showSearchAndReplaceModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.SEARCH_AND_REPLACE,
    payload,
  };
};

export const showErrorModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.ERROR_MODAL,
    payload,
  };
};

export const showNoSignalModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.NO_SIGNAL,
    payload,
  };
};

export const showUpdateModal = (payload: UpdateStackablType) => {
  return {
    type: ModalTypeKeys.UPDATE_MODAL,
    payload,
  };
};

export const showDeleteModal = (payload: DeleteProjectType) => {
  return {
    type: ModalTypeKeys.DELETE_PROJECT,
    payload,
  };
};

export const showReleaseModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.RELEASE_UPDATES_MODAL,
    payload,
  };
};

export const showImportDatabaseModal = (payload: ImportDataType) => {
  return {
    type: ModalTypeKeys.IMPORT_DATABASE_MODAL,
    payload,
  };
};

export const showGitSwitchModal = (payload: GithubAccount) => {
  return {
    type: ModalTypeKeys.SHOW_GIT_SWITCH_MODAL,
  };
};

export const showSSHKeys = (payload: AddSSHDataType) => {
  return {
    type: ModalTypeKeys.SSH_KEYS_MODAL,
    payload,
  };
};

export const showSSHKeyDetailModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.SSH_KEY_DETAIL_MODAL,
    payload,
  };
};

export const showAttachExistingProjectModal = (payload: ModalDataType) => {
  return {
    type: ModalTypeKeys.ATTACH_EXISTING_PROJECT,
    payload,
  };
};

export default {
  showImportDatabaseModal,
  showGitSwitchModal,
  showLogOutModal,
  showQuitModal,
  addDescriptionModal,
  showSearchAndReplaceModal,
  showErrorModal,
  showNoSignalModal,
  showUpdateModal,
  showDeleteModal,
  showReleaseModal,
  showWebsiteCloneModal,
  showSSHKeys,
  showSSHKeyDetailModal,
  showAttachExistingProjectModal,
};
