import { IList } from '../utils/ListSchema';
export const GET_ALL_PROJECTS = 'GET_ALL_PROJECTS';
export const ADD_NEW_PROJECT = 'ADD_NEW_PROJECT';
export const CURRENT_PROJECT = 'CURRENT_PROJECT';
export const FILTER_PROJECT = 'FILTER_PROJECT';
export const UPDATE_PROJECT = 'UPDATE_PROJECT';
export const SET_FLAG = 'SET_FLAG';
export const CLEAR_FLAG = 'CLEAR_FLAG';
export const SET_ONLINE_STATUS = 'SET_ONLINE_STATUS';
export const TOGGLE_SELECTION = 'TOGGLE_SELECTION';
export const CLEAR_SELECTION = 'CLEAR_SELECTION';
export const TOGGLE_ACTIVE_STATE = 'TOGGLE_ACTIVE_PROJECT';

export interface SetParamInProject {
  listItem: IList;
  name: string;
}

interface GetAllProjects {
  type: typeof GET_ALL_PROJECTS;
  payload: IList[];
}
interface AddNewProject {
  type: typeof ADD_NEW_PROJECT;
  payload: IList;
}
interface GetCurrentProject {
  type: typeof CURRENT_PROJECT;
  payload: IList;
}
interface UpdateProject {
  type : typeof UPDATE_PROJECT;
  payload : IList
}
interface FilterProject {
  type : typeof FILTER_PROJECT;
  payload: IList;
}
// export type ProjectType = GetAllProjects | GetCurrentProject | AddNewProject | FilterProject | UpdateProject;

interface SetFlagForProject {
  type: typeof SET_FLAG;
  payload: SetParamInProject;
}

interface SetOnlineStatusForProject {
  type: typeof SET_ONLINE_STATUS;
  payload: IList;
}

interface ClearFlagForProject {
  type: typeof CLEAR_FLAG;
  payload: IList;
}

interface ToggleSelect {
  type: typeof TOGGLE_SELECTION;
  payload: IList;
}

interface ClearSelection {
  type: typeof CLEAR_SELECTION;
  payload: IList;
}

interface ToggleActiveProject {
  type: typeof TOGGLE_ACTIVE_STATE;
  payload: IList;
}

export type ProjectType =
  | GetAllProjects
  | GetCurrentProject
  | AddNewProject
  | SetFlagForProject
  | SetOnlineStatusForProject
  | ClearFlagForProject
  | ToggleSelect
  | ClearSelection
  |UpdateProject
  |FilterProject
  | ToggleActiveProject;

export const getAllProjects = (payload: IList[]) => {
  return {type:GET_ALL_PROJECTS ,payload}

};

export const updateProject = (payload:IList) => {
  return {type : UPDATE_PROJECT ,payload}
}

export const filterProjects = (payload:IList) => {
  return {type :FILTER_PROJECT ,payload }
};


export const addNewProject = (payload: IList) => {
  return { type: ADD_NEW_PROJECT, payload };
};

export const currentProject = (payload: IList) => {
  return { type: CURRENT_PROJECT, payload };
};

export const setFlagForProject = (payload: SetParamInProject) => {
  return { type: SET_FLAG, payload };
};

export const setOnlineStatusForProject = (payload: IList) => {
  return { type: SET_ONLINE_STATUS, payload };
};

export const clearFlagForProject = (payload: IList) => {
  return { type: CLEAR_FLAG, payload };
};

export const toggleSelectionOfProject = (payload: IList) => {
  return { type: TOGGLE_SELECTION, payload };
};

export const clearSelectionOfProject = (payload: IList) => {
  return { type: CLEAR_SELECTION, payload };
};

export const toggleActiveProject = (payload: IList) => {
  return { type: TOGGLE_ACTIVE_STATE, payload };
};

export default {
  getAllProjects,
  addNewProject,
  currentProject,
  filterProjects,
  updateProject,
  setFlagForProject,
  setOnlineStatusForProject,
  clearFlagForProject,
  toggleSelectionOfProject,
  clearSelectionOfProject,
  toggleActiveProject,
};
