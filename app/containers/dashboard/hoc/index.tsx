/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react/no-did-update-set-state */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { ipcRenderer, remote } from 'electron';
import Analytics, {
  EVENT,
  ACTION,
  LABEL,
} from '@stackabl/core/render/analytics';
import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable,
} from 'react-beautiful-dnd';

import {
  IconBox,
  SearchBar,
  Menu,
  Switch,
  List,
  ListItem,
  Accordion,
  Tooltip,
  Button,
  BottomNotification,
} from '@stackabl/ui';
import { Location as locationType, createLocation, Location } from 'history';
import _ from 'lodash';

import logger from '@stackabl/core/shared/logger';
import db from '@stackabl/core/render/Database';
import { ProjectsSchema } from '@stackabl/core/render/Database/schema';
import request from '@stackabl/core/render/api';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import { HelperRole, SiteState } from '@stackabl/core/shared/dependencies';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
// import FuntionList from '@stackabl/core/shared/constants/functionlist';
import {
  CurrenState,
  runningSites,
  startStopsite,
} from '@stackabl/core/render/common';
import semver from 'semver';

import { syncChannel } from '@stackabl/core/render/api/syncChannel';
import { SYNC_CHANNEL_RUNNING } from '@stackabl/website-push-pull/shared/constants';
import { RootState } from '../../../reducers/types';
import routes from '../../../constants/routes.json';
import { CMS, FLAGS, SearchFilter, THEME_MODE } from '../../../constants/index';
import ThemeActions from '../../../actions/theme';
import SearchActions from '../../../actions/search-bar';
import ProjectActions, { SetParamInProject } from '../../../actions/projects';
import ModalActions, {
  ModalDataType,
  EditProjectDataType,
  DeleteProjectType,
} from '../../../actions/modal';
import ToastActions, { ToastContentType } from '../../../actions/toast';
import NotificationActions, {
  NotificationContentType,
  NotificationKeys,
} from '../../../actions/notification';
import LocationActions from '../../../actions/navigation';
import { InitialSearchState } from '../../../reducers/search-bar';
import { InitialThemeState } from '../../../reducers/theme';
import { InitialModalState } from '../../../reducers/modal';
import { InitialLocationState } from '../../../reducers/navigation';
import { InitialProjectState, initialState } from '../../../reducers/projects';
import { getIcon } from '../../../utils/themes/icons';
import { IList } from '../../../utils/ListSchema';
import { contentAdaptar } from '../../../utils/common';
import WebSync from '../../../utils/websync/webSync-process';
import Style from './index.scss';
import add from '../../../resources/Icons/Common/add.svg';
import flagRed from '../../../resources/Icons/Common/flag_red.svg';
import more from '../../../resources/Icons/Dark-Mode/more.svg';
import flagPurple from '../../../resources/Icons/Common/flag_purple.svg';
import flagGreen from '../../../resources/Icons/Common/flag_green.svg';
import flagOrange from '../../../resources/Icons/Common/flag_orange.svg';
import flagBlue from '../../../resources/Icons/Common/flag_blue.svg';
import displayNotification from '../../../utils/common/notification';

interface StateProps {
  theme: InitialThemeState;
  searchList: InitialSearchState;
  modalData: InitialModalState;
  locationData: InitialLocationState;
  projectData: InitialProjectState;
}

interface DispatchProps {
  getAllSearchItem: (payload: IList[]) => void;
  selectedSearchItem: (payload: IList[]) => void;
  updateProject: (payload: IList) => void;
  showDeleteModal: (payload: DeleteProjectType) => void;
  filterSearchUsingValue: (payload: string) => void;
  getThemeMode: (payload: string) => void;
  showLogOutModal: (payload: ModalDataType) => void;
  addDescriptionModal: (payload: EditProjectDataType) => void;
  pushLocation: (payload: locationType) => void;
  goBack: (payload: locationType) => void;
  goForward: (payload: locationType) => void;
  currentLocation: (payload: Location) => void;
  setFlagForProject: (payload: SetParamInProject) => void;
  setOnlineStatusForProject: (payload: IList) => void;
  clearFlagForProject: (payload: IList) => void;
  currentProject: (payload: IList) => void;
  toggleActiveProject: (payload: IList) => void;
  getAllProjects: (payload: IList[]) => void;
  showReleaseModal: (payload: ModalDataType) => void;
  addToast: (payload: ToastContentType) => void;
  removeToast: (payload: string) => void;
  showNotification: (payload: NotificationContentType) => void;
  removeNotification: (payload: string) => void;
}

const MENU_ID = {
  NOTIFICATION_MENU: -10,
  DROPDOWN_MENU: -20,
  HIDE_MENU: -100,
};

interface State {
  menuId: number;
  searchValue: string;
  closeSearchMenu: boolean;
  showBottomNotification: boolean;
  checkThemeSwitch: boolean;
  userName: string;
  cmsListInState: CmsListType[];
}

interface CmsListType {
  id: number;
  name: RegisterPackages;
  icon: string;
  selected: boolean;
}
interface ListType {
  id: number;
  name: string;
  icon: string;
  selected: boolean;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

const log = logger.scope('Dashboard/Hoc');

class Hoc extends React.PureComponent<Props, State> {
  db!: db;

  flagList: ListType[] = [
    { id: 0, name: FLAGS.ORANGE, icon: `${flagOrange}`, selected: false },
    { id: 1, name: FLAGS.RED, icon: `${flagRed}`, selected: false },
    { id: 2, name: FLAGS.PURPLE, icon: `${flagPurple}`, selected: false },
    { id: 3, name: FLAGS.BLUE, icon: `${flagBlue}`, selected: false },
    { id: 4, name: FLAGS.GREEN, icon: `${flagGreen}`, selected: false },
  ];

  menuList: ListType[] = [
    { id: 0, name: 'Add Description', icon: '', selected: false },
    { id: 1, name: 'Create New Project', icon: '', selected: false },
    { id: 2, name: 'Delete Project', icon: '', selected: false },
  ];

  cmsList: CmsListType[] = [
    {
      id: 0,
      name: CMS.WORDPRESS,
      icon: '',
      selected: false,
    },
    {
      id: 1,
      name: CMS.JOOMLA,
      icon: '',
      selected: false,
    },
    {
      id: 2,
      name: CMS.DRUPAL,
      icon: '',
      selected: false,
    },
    {
      id: 3,
      name: CMS.CUSTOM,
      icon: '',
      selected: false,
    },
  ];

  constructor(props: Props) {
    super(props);
    const {
      projectData: { allProjects },
    } = this.props;
    this.state = {
      menuId: MENU_ID.HIDE_MENU,
      searchValue: '',
      closeSearchMenu: false,
      showBottomNotification: false,
      checkThemeSwitch: false,
      userName: '',
      cmsListInState: this.cmsList,
    };
    this.toggleDropdownMenu = this.toggleDropdownMenu.bind(this);
    this.onGoBackListener = this.onGoBackListener.bind(this);
    this.onGoForwardListener = this.onGoForwardListener.bind(this);
  }

  componentDidMount() {
    const {
      getAllSearchItem,
      theme,
      currentLocation,
      history: {
        location: { pathname },
      },
      projectData: { allProjects },
    } = this.props;
    syncChannel('hoc', (status) => {
      WebSync.getInstance().webSyncReponseHandle(status);

      log.info('syncListner', status);
    });
    currentLocation(createLocation({ pathname }));
    const userName = localStorage.getItem('UserName') || '';
    this.setState({ userName });
    this.init();
    getAllSearchItem(allProjects);
    const cmsListDragAndDrop: CmsListType[] = JSON.parse(
      localStorage.getItem('cmsListDragAndDrop') || '[]'
    ).filter((l: { name: string }) => l.name !== 'Magento');

    if (cmsListDragAndDrop.length > 0) {
      this.setState({ cmsListInState: cmsListDragAndDrop });
    }
    this.setState({
      checkThemeSwitch: theme.theme_mode === 'dark',
    });
  }

  componentDidUpdate(prevProps: Props) {
    const {
      locationData,
      history,
      location,
      theme,
      projectData: { allProjects, currentProject },
      getAllSearchItem,
    } = this.props;
    const { showBottomNotification } = this.state;
    if (!_.isEqual(allProjects, prevProps.projectData.allProjects)) {
      getAllSearchItem(allProjects);
    }
    if (prevProps.theme.theme_mode !== theme.theme_mode) {
      this.changeInTheme();
    }

    if (
      (location.pathname === routes.DASHBOARD + routes.ALL_PROJECTS ||
        location.pathname === routes.DASHBOARD + routes.LOADER) &&
      !allProjects.length
    ) {
      // if no project exist redirect to EMPTY_PROJECT  component
      history.push(routes.DASHBOARD + routes.EMPTY_PROJECT);
    } else if (
      (location.pathname === routes.DASHBOARD + routes.EMPTY_PROJECT ||
        location.pathname === routes.DASHBOARD + routes.LOADER) &&
      allProjects.length
    ) {
      history.push(routes.DASHBOARD + routes.ALL_PROJECTS);
    }

    if (
      location.pathname === routes.DASHBOARD + routes.PROJECT_SETTINGS &&
      !currentProject.subTitle
    ) {
      history.push(routes.DASHBOARD + routes.ALL_PROJECTS);
      return;
    }

    /**
     * @info why this check has been implemented.
     * code for navigation b/w screen goforward or goback
     */
    if (
      prevProps.locationData.currentLocation.pathname !==
        locationData.currentLocation.pathname &&
      locationData.currentLocation.pathname !== '' &&
      locationData.currentLocation.pathname !== location.pathname
    ) {
      history.push({
        pathname: locationData.currentLocation.pathname,
        state: locationData.currentLocation.state,
        search: locationData.currentLocation.search,
      });
      return;
    }
    // if no bottom notification is shown then showBottomNotification is false so that next time bottom notification is shown only  clicking overlay
    if (
      showBottomNotification &&
      !allProjects.filter((each) => each.loader).length &&
      !currentProject.loader
    ) {
      log.info('show bottom notification check');
      this.setState({ showBottomNotification: false });
    }

    // if (
    //   prevProps.modalData.logOut_data.yes !== modalData.logOut_data.yes ||
    //   prevProps.modalData.logOut_data.no !== modalData.logOut_data.no
    // ) {
    //   this.updateAndNotify();
    // }
  }

  init = async () => {
    this.db = await db.getInstance();
    await this.updateAllprojectRedux();
    this.showReleaseModalOnUpdate();
  };

  showReleaseModalOnUpdate = () => {
    const { showReleaseModal, modalData } = this.props;
    const currentAppVersion = remote.app.getVersion();
    log.info('Application Version', currentAppVersion);
    const appSettings = this.db.getAppSettings();
    log.info(
      'Curent application version from settings',
      `${appSettings.current_app_version}`
    );
    let flag = true;
    try {
      flag = semver.gt(currentAppVersion, `${appSettings.current_app_version}`);
    } catch (e) {
      log.warn(e);
    }
    if (flag) {
      log.info('Showing modal', appSettings.current_app_version);
      showReleaseModal({
        ...modalData.release_update,
        show: true,
      });
      appSettings.current_app_version = currentAppVersion;
      this.db.updateAppSetting(appSettings);
    }
  };

  changeInTheme = () => {
    const { theme } = this.props;
    Analytics.getInstance().eventTracking(
      EVENT.Dashboard,
      ACTION.Theme,
      theme.theme_mode
    );
    this.setState({
      checkThemeSwitch: theme.theme_mode === 'dark',
    });
  };

  toggleDropdownMenu = (id: number, description?: string): void => {
    this.menuList = this.menuList.map((each) => {
      if (each.id === 0)
        return {
          ...each,
          name: description?.trim().length
            ? 'Edit Description'
            : 'Add Description',
        };
      return each;
    });
    this.setState((prevState) => ({
      menuId: prevState.menuId === id ? MENU_ID.HIDE_MENU : id,
    }));
  };

  onClickFlagListener = (selectedFlag: ListType, project: IList) => {
    const { setFlagForProject } = this.props;
    const currentProject = this.db.getProjectByParam({
      name: project.title,
      container_name: project.subTitle,
    });
    this.db.updateProject({ ...currentProject, flag: selectedFlag.name });
    setFlagForProject({ listItem: project, name: selectedFlag.name });
  };

  onClickClearFlagListener = (project: IList) => {
    const { clearFlagForProject } = this.props;
    const currentProject = this.db.getProjectByParam({
      name: project.title,
      container_name: project.subTitle,
    });
    this.db.updateProject({ ...currentProject, flag: '' });
    clearFlagForProject(project);
  };

  onClearSearch = () => {
    this.setState({ searchValue: '', closeSearchMenu: true });
  };

  /**
   * @description This is to show the notification and toast redux functions
   * Please remove it after using and applying the redux functions
   * For @kartik
   */

  // showToast = (type: string) => {
  //   const { addToast } = this.props;

  //   const toastData: NotificationContentType = {
  //     id: type,
  //     message: 'Hey this is toast data',
  //   };
  //   addToast(toastData);
  // };

  // removeToast = (type: string) => {
  //   const { removeToast } = this.props;
  //   removeToast(type);
  // };

  // showNotification = (type: string) => {
  //   const { showNotification } = this.props;
  //   const notificationData: NotificationContentType = {
  //     id: type,
  //     message: 'Hey this is notification data',
  //   };
  //   showNotification(notificationData);
  // };

  // removeNotification = (type: string) => {
  //   const { removeNotification } = this.props;
  //   removeNotification(type);
  // };

  /**
   * @description  - for starting & stoping project
   * @param project
   */
  handleOnlineStatus = async (project: IList) => {
    Analytics.getInstance().eventTracking(
      EVENT.Sidebar,
      ACTION.Start,
      LABEL.Maximized
    );
    const currentProject = this.db.getProjectByParam({
      name: project.title,
      container_name: project.subTitle,
    });

    const {
      history,
      updateProject,
      projectData: { currentProject: reduxCurrentProject },
      currentProject: currentProjectEvent,
    } = this.props;
    const {
      name,
      type,
      meta,
      container_name,
      description,
      credential,
      sslFlag,
      location,
    } = currentProject;
    updateProject({ ...project, loader: true }); // update all project
    if (reduxCurrentProject.subTitle === container_name) {
      currentProjectEvent({ ...reduxCurrentProject, loader: true }); // update current project
    }

    try {
      const args = await startStopsite({
        projectName: name,
        id: container_name,
        projectUsername: credential.username,
        projectPass: credential.password,
        projectEmail: credential.email,
        type,
        addDescription: description,
        location,
        ssl: sslFlag,
        versionValue: meta.find((each) => each.role === HelperRole.SCRIPT)!
          .version,
        databaseValue: meta.find((each) => each.role === HelperRole.DATABASE)!
          .version,
      });
      if (args.status === SiteState.RUNNING) {
        Analytics.getInstance().eventTracking(
          EVENT.Sidebar,
          ACTION.Start,
          LABEL.Maximized
        );
        this.db.updateProject({
          ...currentProject,
          meta: args.response.meta,
          port: args.response.port,
          domain_url: args.response.domain_url,
          update_date: args.response.update_date,
          status: args.response.status,
        });
        updateProject({
          ...project,
          status: SiteState.RUNNING,
          timeStamp: args.response.update_date,
        });
        if (reduxCurrentProject.subTitle === project.subTitle) {
          currentProjectEvent({
            ...project,
            status: SiteState.RUNNING,
            timeStamp: args.response.update_date,
          });
        }
        const payload: NotificationContentType = {
          id: 'WEBSITE',
          message: 'Your site is ready!.',
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'All Done',
        };
        displayNotification(payload);
        // ipcRenderer.send('notification', {
        //   title: 'All Done',
        //   body: `Your site is ready!.`,
        // });
      } else {
        Analytics.getInstance().eventTracking(
          EVENT.Sidebar,
          ACTION.Stop,
          LABEL.Maximized
        );
        const time = new Date().toJSON();
        this.db.updateProject({
          ...currentProject,
          update_date: time,
          status: SiteState.STOP,
        });

        if (reduxCurrentProject.subTitle === project.subTitle) {
          currentProjectEvent({
            ...project,
            status: SiteState.STOP,
            timeStamp: time,
          });
        }
        updateProject({
          ...project,
          status: SiteState.STOP,
          timeStamp: time,
        });
        const payload: NotificationContentType = {
          id: 'stop-site',
          message: `The site has stopped.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'All Done',
        };
        displayNotification(payload);
      }

      //  if (project.status !== SiteState.RUNNING) {
      //     const args: ProjectsSchema = await request(
      //       EndPoint.SERVICE_START,
      //       type,
      //       [
      // {
      //   projectName: name,
      //   id: container_name,
      //   projectUsername: credential.username,
      //   projectPass: credential.password,
      //   projectEmail: credential.email,
      //   versionValue: meta.find(
      //     (each) => each.role === HelperRole.SCRIPT
      //   )!.version,
      //   databaseValue: meta.find(
      //     (each) => each.role === HelperRole.DATABASE
      //   )!.version,
      // },
      //       ]
      //     );
      //     this.db.updateProject({
      //       ...currentProject,
      //       meta: args.meta,
      //       port: args.port,
      //       domain_url: args.domain_url,
      //     });
      //     this.props.updateProject({ ...project, status: SiteState.RUNNING });
      //     if(reduxCurrentProject.subTitle === project.subTitle){
      //       currentProjectEvent({ ...project, status: SiteState.RUNNING })
      //     }
      //   } else {
      //     log.info('stop site');
      //     await request(EndPoint.SERVICE_FUNCTION, type, [
      //       FuntionList.STOP_PROVISION,
      //       [container_name, name],
      //       [],
      //     ]);
      //     if(reduxCurrentProject.subTitle === project.subTitle){
      //       currentProjectEvent({ ...project, status: SiteState.STOP })
      //     }
      //     this.props.updateProject({ ...project, status: SiteState.STOP });
      //   }
    } catch (ERR) {
      updateProject({
        ...project,
        status: SiteState.STOP,
      });
      // ipcRenderer.send('notification', {
      //   title: 'Failed',
      //   body: `failed to ${
      //     project.status === SiteState.RUNNING ? 'stop' : 'start.'
      //   }`,
      // });
      const payload: NotificationContentType = {
        id: 'WEBSITE',
        message: `failed to ${
          project.status === SiteState.RUNNING ? 'stop' : 'start.'
        }`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Failed',
      };
      displayNotification(payload);
      history.push({
        pathname: `${routes.LANDING}${routes.ERROR}`,
        state: {
          error: ERR,
          origin: routes.PROJECT_SETTINGS,
          parent: routes.DASHBOARD,
        },
      });
    }
  };

  updateAllprojectRedux = async () => {
    const {
      getAllProjects,
      projectData: { allProjects },
    } = this.props;
    const result: string[] = await runningSites();
    const userId = localStorage.getItem('UserId');
    const projectList: IList[] = contentAdaptar(
      this.db.getAllProject(userId || '', true, 'update_date'),
      allProjects,
      initialState.currentProject,
      result
    );
    log.info('getAllProjects');
    getAllProjects(projectList);
  };

  /**
   * @todo handle online status dynamically
   *
   */
  // handleOnlineStatus = (project: IList) => {
  //   const { setOnlineStatusForProject } = this.props;
  //   setOnlineStatusForProject(project);
  // };

  showAddDescriptionModal = (i: IList) => {
    Analytics.getInstance().eventTracking(
      EVENT.Sidebar,
      ACTION.Description,
      LABEL.Maximized
    );
    const { addDescriptionModal } = this.props;

    addDescriptionModal({ show: true, project: i });
  };

  handleSearchInput = (value: string, pos: number) => {
    const {
      filterSearchUsingValue,
      history: {
        location: { pathname },
      },
    } = this.props;
    Analytics.getInstance().eventTracking(
      pathname === routes.DASHBOARD + routes.ALL_PROJECTS
        ? EVENT.Dashboard
        : EVENT.Project,
      ACTION.Search,
      LABEL.Unique
    );
    if (value !== '') {
      filterSearchUsingValue(value.trim());
      this.setState(
        {
          searchValue: value,
          closeSearchMenu: false,
        },
        () => {
          const inputEle: HTMLInputElement = document.getElementById(
            'inputid'
          ) as HTMLInputElement;
          if (inputEle !== null && pos !== -2) {
            this.doSetCaretPosition(inputEle, pos);
          }
        }
      );
    }
  };

  toggleTheme = () => {
    this.setState(
      (prevState) => ({
        checkThemeSwitch: !prevState.checkThemeSwitch,
      }),
      () => {
        const { getThemeMode } = this.props;
        const { checkThemeSwitch } = this.state;
        const theme = checkThemeSwitch ? THEME_MODE.DARK : THEME_MODE.LIGHT;
        Analytics.getInstance().eventTracking(
          EVENT.Dashboard,
          ACTION.Theme,
          theme
        );
        getThemeMode(theme);
      }
    );
  };

  onLogOutClickListener = async () => {
    Analytics.getInstance().eventTracking(
      EVENT.Dashboard,
      ACTION.Logout,
      LABEL.Dropdown
    );
    const { showLogOutModal, modalData, history } = this.props;
    const appSettings = this.db.getAppSettings();
    /* whenever user checks the box for dont warn me again on logout modal , user id for that user
         is added to database in signed_in_user_ids array . So when user again clicks on logout ,
         signed_in_user_ids array is checked .If it contains the userid then logout modal is not shown again
         */
    if (appSettings.signed_in_user_ids) {
      if (
        appSettings.signed_in_user_ids.includes(
          localStorage.getItem('UserId') || ''
        )
      ) {
        await request(EndPoint.LOGOUT, RegisterPackages.skip, ['logout']);
        localStorage.removeItem('UserToken');
        localStorage.removeItem('UserEmail');
        localStorage.removeItem('UserId');
        localStorage.removeItem('UserName');
        localStorage.removeItem('gitUsers');
        history.push(routes.LANDING + routes.LOGIN);
        return;
      }
    }
    showLogOutModal({
      ...modalData.logOut_data,
      show: !modalData.logOut_data.show,
      yes: false,
      no: false,
    });
  };

  onClickSearchListItem = async (item: IList) => {
    this.setState({ closeSearchMenu: true });
    const { cmsListInState } = this.state;
    const { currentProject, searchList, selectedSearchItem } = this.props;
    const state = this.db.getProjectByParam({
      name: item.title,
      container_name: item.subTitle,
    });
    log.info('onClickSearchListItem', item, state);
    const test: IList[] = [...searchList.selectedSearch];

    if (!test.includes(item)) {
      test.unshift(item);
    }
    if (test.length > 3) {
      test.length = 3;
    }

    selectedSearchItem(test);
    const {
      history: {
        location: { pathname },
      },
    } = this.props;
    const seletedCms = cmsListInState.find((each) => each.name === item.type);
    const type = seletedCms ? SearchFilter.PROJECT : item.type;
    switch (type) {
      case SearchFilter.PROJECT:
        currentProject(item);
        this.goToPage(routes.DASHBOARD + routes.REDIRECT, {
          ...state,
          meta: [...state.meta],
        });

        break;
      case SearchFilter.LOCATION:
        this.goToPage(routes.DASHBOARD + item.groupTitle);

        break;
      default:
        break;
    }
    Analytics.getInstance().eventTracking(
      pathname === routes.DASHBOARD + routes.ALL_PROJECTS
        ? EVENT.Dashboard
        : EVENT.Project,
      ACTION.Search,
      type === SearchFilter.LOCATION
        ? `Screen name - ${type}`
        : `Project name - ${item.title}`
    );
  };

  OnSelectedProjectListener = (project: IList) => {
    const { currentProject, toggleActiveProject, projectData } = this.props;
    if (projectData.currentProject.id !== -10) {
      const lastCurrentProject: IList = projectData.currentProject;
      toggleActiveProject(lastCurrentProject);
    }

    toggleActiveProject(project);
    currentProject({ ...project, active: true });

    log.info('xxxxxxx---xxxx ', projectData.currentProject);
    this.goToPage(routes.DASHBOARD + routes.REDIRECT);
  };

  onClickProjectMenu = (item: ListType | HTMLLIElement, project: IList) => {
    const id = item.id.toString();
    switch (id) {
      case '0':
        this.showAddDescriptionModal(project);
        break;
      case '1':
        Analytics.getInstance().eventTracking(
          EVENT.Sidebar,
          ACTION.Create,
          LABEL.Maximized
        );
        this.goToPage(
          routes.DASHBOARD + routes.CREATE_NEW_PROJECT,
          undefined,
          `type=${project.type}`
        );
        break;
      case '2':
        this.showDeleteProjectModal(project);
        break;
      default:
        break;
    }
    this.toggleDropdownMenu(MENU_ID.HIDE_MENU);
  };

  showDeleteProjectModal = async (project: IList) => {
    Analytics.getInstance().eventTracking(
      EVENT.Sidebar,
      ACTION.Delete,
      LABEL.Maximized
    );
    const { showDeleteModal } = this.props;
    showDeleteModal({ show: true, project: [project] });
  };

  getIconForSearchBarList = (cms: string, type: string) => {
    const { theme } = this.props;
    const { cmsListInState } = this.state;
    const cmsInUppercase = cms.toUpperCase();
    const choice = cmsListInState.find((cmsType) => cmsType.name === type)
      ? SearchFilter.PROJECT
      : type;
    switch (choice) {
      case SearchFilter.PROJECT:
        return getIcon(cmsInUppercase, theme.theme_mode);
      case SearchFilter.LOCATION:
        return getIcon('LOCATION', theme.theme_mode);
      default:
        return getIcon('LOCATION', theme.theme_mode);
    }
  };

  getSecondaryTextSearchBar = (type: RegisterPackages, groupTitle: string) => {
    const { cmsListInState } = this.state;
    const choice = cmsListInState.find(
      (cmsType: CmsListType) => cmsType.name === type
    )
      ? SearchFilter.PROJECT
      : type;
    switch (choice) {
      case SearchFilter.LOCATION:
        return 'Jump to';
      case SearchFilter.PROJECT:
        return groupTitle;
      default:
        return groupTitle;
    }
  };

  handleFlagIcons = (project: IList) => {
    switch (project.flag) {
      case FLAGS.ORANGE:
        return flagOrange;
      case FLAGS.RED:
        return flagRed;
      case FLAGS.BLUE:
        return flagBlue;
      case FLAGS.GREEN:
        return flagGreen;
      case FLAGS.PURPLE:
        return flagPurple;
      default:
        return '';
    }
  };

  onGoBackListener = (): void => {
    const {
      history: {
        location: { pathname },
      },
    } = this.props;
    Analytics.getInstance().eventTracking(
      pathname === routes.DASHBOARD + routes.ALL_PROJECTS
        ? EVENT.Dashboard
        : EVENT.Project,
      ACTION.Back,
      LABEL.Unique
    );
    const { goBack } = this.props;
    goBack(createLocation({ pathname: '' }));
  };

  onGoForwardListener = (): void => {
    const {
      history: {
        location: { pathname },
      },
    } = this.props;
    Analytics.getInstance().eventTracking(
      pathname === routes.DASHBOARD + routes.ALL_PROJECTS
        ? EVENT.Dashboard
        : EVENT.Project,
      ACTION.Forward,
      LABEL.Unique
    );
    const { goForward } = this.props;
    goForward(createLocation({ pathname: '' }));
  };

  onSettingsClickListener = () => {
    this.goToPage(routes.DASHBOARD + routes.SETTINGS);
    this.toggleDropdownMenu(MENU_ID.HIDE_MENU);
  };

  goToPage = async (location: string, state?: ProjectsSchema, query = '') => {
    const { history, pushLocation } = this.props;

    log.info('gotopage', state, query);
    const projectState = state ? { ...state, meta: [...state.meta] } : state;
    if (location !== routes.DASHBOARD + routes.REDIRECT) {
      pushLocation(
        createLocation({
          pathname: location,
          state,
          search: query,
        })
      );
    }

    history.push({ pathname: location, state, search: query });
  };

  onSubmitListItemListener = (item: HTMLLIElement) => {
    const { cmsListInState } = this.state;
    const str = item.id;
    const listId = str.split('^')[0];
    // const id = str.split('^')[1];
    const grouptitle = str.split('^')[2];
    const type = str.split('^')[3];
    const title = str.split('^')[4];
    log.info(str, 'onSubmitListItemListener');
    const {
      history: {
        location: { pathname },
      },
      searchList,
      currentProject,
      selectedSearchItem,
      projectData: { allProjects },
    } = this.props;

    Analytics.getInstance().eventTracking(
      pathname === routes.DASHBOARD + routes.ALL_PROJECTS
        ? EVENT.Dashboard
        : EVENT.Project,
      ACTION.Search,
      LABEL.Unique
    );
    if (listId.includes('search')) {
      const filteredSearchList: IList[] = [...searchList.filteredList];

      const selectedItem = filteredSearchList.filter(
        (selectedSearch) =>
          selectedSearch.title === title &&
          selectedSearch.groupTitle === grouptitle &&
          selectedSearch.type === type
      );

      const test: IList[] = [...searchList.selectedSearch, ...allProjects];

      selectedItem.map((i: IList) => {
        if (!test.includes(i)) {
          test.unshift(i);
        }
        if (test.length > 3) {
          test.length = 3;
        }

        selectedSearchItem(test);

        return item;
      });
    } else if (listId.includes('dropdown')) {
      this.toggleDropdownMenu(MENU_ID.HIDE_MENU);
    }

    const choice = cmsListInState.find(
      (cmsType: CmsListType) => cmsType.name === type
    )
      ? SearchFilter.PROJECT
      : type;
    log.info(choice, ' onSubmitListItemListener choice  before switch');
    switch (choice) {
      case SearchFilter.PROJECT:
        {
          const SelectedProject = allProjects.find(
            (project: IList) =>
              project.title === title &&
              project.type === type &&
              project.groupTitle === grouptitle
          );
          if (SelectedProject) {
            const { subTitle } = SelectedProject;
            const project = this.db.getProjectByParam({
              name: title,
              container_name: subTitle,
            });
            currentProject(SelectedProject);
            this.goToPage(routes.DASHBOARD + routes.REDIRECT, project);
          }
        }
        break;
      case SearchFilter.LOCATION:
        this.goToPage(routes.DASHBOARD + grouptitle);
        break;
      case 'MODAL':
        if (title === 'Logout') {
          this.onLogOutClickListener();
          this.toggleDropdownMenu(MENU_ID.HIDE_MENU);
        }
        break;
      default:
        break;
    }
    Analytics.getInstance().eventTracking(
      pathname === routes.DASHBOARD + routes.ALL_PROJECTS
        ? EVENT.Dashboard
        : EVENT.Project,
      ACTION.Search,
      choice === SearchFilter.LOCATION
        ? `Screen name - ${choice}`
        : `Project name - ${title}`
    );
  };

  handleOnDragEndForCMS = (result: DropResult) => {
    const { cmsListInState } = this.state;
    if (!result.destination) return;

    const items = Array.from(cmsListInState);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    localStorage.setItem('cmsListDragAndDrop', JSON.stringify(items));

    this.setState({ cmsListInState: items }, () => {});
  };

  enableBottomNotification = () => {
    this.setState({ showBottomNotification: true });
  };

  doSetCaretPosition = (oField: HTMLInputElement, iCaretPos: number) => {
    // Firefox support
    if (oField) {
      if (oField.selectionStart || oField.selectionStart === 0) {
        oField.selectionStart = iCaretPos;
        oField.selectionEnd = iCaretPos;
        oField.focus();
      }
    }
  };

  render() {
    const {
      menuId,
      searchValue,
      closeSearchMenu,
      checkThemeSwitch,
      showBottomNotification,
      userName,
      cmsListInState,
    } = this.state;
    const {
      children,
      theme,
      history,
      searchList,
      locationData,
      projectData: { allProjects, currentProject },
    } = this.props;
    const currentLoadedProject = allProjects.filter((each) => each.loader);

    return (
      <div className={classNames(Style.hoc_darshboard)}>
        <div className={classNames(Style.sidebar)}>
          <div className={classNames(Style.sidebar_content)}>
            <div className={classNames(Style.sidebar_header_content)}>
              <IconBox
                customClass={Style.sidebar_logo}
                icon={getIcon('SIDEBAR_LOGO', theme.theme_mode)}
                tooltip
                tooltipPlacement="right"
                name="Stackabl"
                onClickListener={() => {
                  this.goToPage(routes.DASHBOARD);
                  Analytics.getInstance().eventTracking(
                    EVENT.Sidebar,
                    ACTION.Logo,
                    LABEL.Unique
                  );
                }}
              />
              <IconBox
                customClass={Style.sidebar_add_new_project}
                width="15px"
                radius="4px"
                name="Create Project"
                tooltipPlacement="right"
                variant={IconBox.getVariant.FILLED}
                size={IconBox.Size.LARGE}
                icon={add}
                onClickListener={() => {
                  Analytics.getInstance().eventTracking(
                    EVENT.Sidebar,
                    ACTION.Create,
                    LABEL.Minimized
                  );
                  this.goToPage(routes.DASHBOARD + routes.CREATE_NEW_PROJECT);
                }}
                active={
                  history.location.pathname ===
                  routes.DASHBOARD + routes.CREATE_NEW_PROJECT
                }
              />

              <IconBox
                customClass={Style.sidebar_home}
                width="20px"
                radius="4px"
                name="Home"
                tooltipPlacement="right"
                variant={IconBox.getVariant.DEFAULT}
                size={IconBox.Size.LARGE}
                icon={
                  [
                    routes.DASHBOARD + routes.ALL_PROJECTS,
                    routes.DASHBOARD + routes.EMPTY_PROJECT,
                  ].includes(history.location.pathname)
                    ? getIcon('HOME_ACTIVE', theme.theme_mode)
                    : getIcon('HOME', theme.theme_mode)
                }
                onClickListener={() => {
                  Analytics.getInstance().eventTracking(
                    EVENT.Sidebar,
                    ACTION.Home,
                    LABEL.Minimized
                  );
                  const route: string = allProjects.length
                    ? routes.ALL_PROJECTS
                    : routes.EMPTY_PROJECT;
                  this.goToPage(routes.DASHBOARD + route);
                }}
                active={[
                  routes.DASHBOARD + routes.ALL_PROJECTS,
                  routes.DASHBOARD + routes.EMPTY_PROJECT,
                ].includes(history.location.pathname)}
              />
              {false && (
                <IconBox
                  width="20px"
                  radius="4px"
                  name="Project Settings"
                  tooltipPlacement="right"
                  variant={IconBox.getVariant.DEFAULT}
                  size={IconBox.Size.LARGE}
                  icon={
                    history.location.pathname ===
                    routes.DASHBOARD + routes.PROJECT_SETTINGS
                      ? getIcon('ALL_PROJECT_ACTIVE', theme.theme_mode)
                      : getIcon('ALL_PROJECT', theme.theme_mode)
                  }
                  onClickListener={() => {
                    /**
                     * cannot move directly to project_settings
                     */
                    this.goToPage(routes.DASHBOARD);
                  }}
                  active={
                    history.location.pathname ===
                    routes.DASHBOARD + routes.PROJECT_SETTINGS
                  }
                />
              )}
            </div>
            <div className={classNames(Style.sidebar_footer_content)}>
              {/** Enable when extension screen will add */}
              {/* <IconBox
                customClass={Style.sidebar_extension}
                width="20px"
                radius="4px"
                name="Extensions"
                tooltipPlacement="right"
                variant={IconBox.getVariant.DEFAULT}
                size={IconBox.Size.LARGE}
                disable={true}
                icon={
                  history.location.pathname === routes.DASHBOARD + routes.ERROR
                    ? getIcon('EXTENSION_ACTIVE', theme.theme_mode)
                    : getIcon('EXTENSION', theme.theme_mode)
                }
                onClickListener={() => {
                  history.push(routes.LANDING + routes.ERROR);
                }}
                active={
                  history.location.pathname === routes.DASHBOARD + routes.ERROR
                }
              /> */}
              <IconBox
                width="20px"
                radius="4px"
                name="Help Center"
                tooltipPlacement="right"
                variant={IconBox.getVariant.DEFAULT}
                size={IconBox.Size.LARGE}
                icon={
                  history.location.pathname ===
                  routes.DASHBOARD + routes.HELP_CENTER
                    ? getIcon('HELP_ACTIVE', theme.theme_mode)
                    : getIcon('HELP', theme.theme_mode)
                }
                onClickListener={() => {
                  this.goToPage(routes.DASHBOARD + routes.HELP_CENTER);
                }}
                active={
                  history.location.pathname ===
                  routes.DASHBOARD + routes.HELP_CENTER
                }
              />
            </div>
          </div>
        </div>
        <div
          className={classNames(
            Style.project_sidebar,
            history.location.pathname ===
              routes.DASHBOARD + routes.PROJECT_SETTINGS
              ? Style.expand
              : ''
          )}
        >
          <h5 className={classNames(Style.project_sidebar_heading)}>
            Projects
          </h5>
          <DragDropContext onDragEnd={this.handleOnDragEndForCMS}>
            <Droppable droppableId="cms">
              {(cmsProvided) => (
                <div
                  className="cms"
                  {...cmsProvided.droppableProps}
                  ref={cmsProvided.innerRef}
                >
                  <div
                    className={classNames(
                      Style.project_sidebar_outer,
                      Style.project_draggable_accordion
                    )}
                  >
                    {cmsListInState.map((cms: CmsListType, index) => (
                      <Draggable
                        draggableId={`${cms.id}`}
                        key={cms.id}
                        index={index}
                      >
                        {(cmsdraggableProvided, snapshot) => {
                          return (
                            <div
                              ref={cmsdraggableProvided.innerRef}
                              {...cmsdraggableProvided.draggableProps}
                              {...cmsdraggableProvided.dragHandleProps}
                              className={classNames(
                                snapshot.isDragging ? Style.dragging : ''
                              )}
                            >
                              <Accordion
                                id={`accordion_${cms.id}`}
                                key={`cms_${cms.id}`}
                                title={cms.name}
                                icon={
                                  /// [CMS.DRUPAL, CMS.MAGENTO].includes(cms.name)
                                  [CMS.DRUPAL].includes(cms.name)
                                    ? getIcon(
                                        'PROJECT_FOLDER',
                                        theme.theme_mode
                                      )
                                    : getIcon(
                                        'PROJECT_FOLDER',
                                        theme.theme_mode
                                      )
                                }
                                draggIcon={getIcon('MOVE', theme.theme_mode)}
                                variant={Accordion.getVariant.OUTLINED}
                                toggleIcon={
                                  // [CMS.DRUPAL, CMS.MAGENTO].includes(cms.name)
                                  [CMS.DRUPAL].includes(cms.name)
                                    ? getIcon('DROPDOWN', theme.theme_mode)
                                    : getIcon('DROPDOWN', theme.theme_mode)
                                }
                                customClass={classNames(
                                  Style.project_sidebar_accordion
                                )}
                                CustomToggleIcon={classNames(
                                  Style.project_sidebar_accordion_toggle_icon
                                )}
                                customPanel={classNames(
                                  Style.project_sidebar_accordion_panel
                                )}
                              >
                                <List
                                  customClass={classNames(
                                    Style.project_sidebar_accordion_list_main
                                  )}
                                >
                                  {allProjects.filter(
                                    (project) => project.groupTitle === cms.name
                                  ).length > 0 ? (
                                    allProjects.map(
                                      (project, i) =>
                                        project.groupTitle === cms.name && (
                                          <ListItem
                                            id={`acc_${project.id}`}
                                            key={`key_${project.id}`}
                                            primaryText={_.capitalize(
                                              project.title
                                            )}
                                            onCickListener={() => {
                                              this.OnSelectedProjectListener(
                                                project
                                              );
                                            }}
                                            customOuter={classNames(
                                              Style.project_sidebar_list_outer
                                            )}
                                            customClass={classNames(
                                              Style.project_sidebar_accordion_list
                                            )}
                                            beforeTextCustom={classNames(
                                              Style.project_sidebar_flag_icon
                                            )}
                                            parentClass={
                                              Style.project_sidebar_li
                                            }
                                            active={project.active}
                                            header={
                                              <>
                                                <Tooltip
                                                  title={project.status}
                                                  placement={
                                                    Tooltip.getPlacement.TOP
                                                  }
                                                  customClass={classNames(
                                                    Style.project_sidebar_accordion_list_online_active
                                                  )}
                                                >
                                                  <div
                                                    className={classNames(
                                                      Style.project_sidebar_accordion_list_indicator,
                                                      Style[`${project.status}`]
                                                    )}
                                                  />
                                                </Tooltip>
                                              </>
                                            }
                                            beforeText={
                                              project.flag && (
                                                <IconBox
                                                  icon={this.handleFlagIcons(
                                                    project
                                                  )}
                                                  tooltip={false}
                                                  customClass={classNames(
                                                    Style.project_sidebar_accordion_list_flag
                                                  )}
                                                />
                                              )
                                            }
                                            footer={
                                              <>
                                                <IconBox
                                                  id={`more_${project.id}`}
                                                  icon={more}
                                                  name="More"
                                                  disable={
                                                    project.projectcurrentState !==
                                                    CurrenState.COMPLETE
                                                  }
                                                  tooltipPlacement="bottom"
                                                  customClass={classNames(
                                                    Style.project_sidebar_accordion_list_more
                                                  )}
                                                  onClickListener={() => {
                                                    this.toggleDropdownMenu(
                                                      project.id,
                                                      project.descritption
                                                    );
                                                  }}
                                                  tooltipInactive={
                                                    menuId === project.id
                                                  }
                                                />
                                                {menuId === project.id ? (
                                                  <Menu
                                                    id={`listview_menu_${project.id}`}
                                                    onRemoveMenu={() => {
                                                      this.toggleDropdownMenu(
                                                        project.id
                                                      );
                                                    }}
                                                    disable
                                                    customClass={classNames(
                                                      Style.project_sidebar_card_dropdown
                                                    )}
                                                    list={this.menuList}
                                                    onSubmitSelectedItem={(
                                                      selectedItem
                                                    ) => {
                                                      this.onClickProjectMenu(
                                                        selectedItem,
                                                        project
                                                      );
                                                    }}
                                                    onClickItemListener={(
                                                      selectedItem
                                                    ) => {
                                                      this.onClickProjectMenu(
                                                        selectedItem,
                                                        project
                                                      );
                                                    }}
                                                  >
                                                    <div
                                                      className={classNames(
                                                        Style.project_sidebar_card_dropdown_footer
                                                      )}
                                                    >
                                                      <div
                                                        className={classNames(
                                                          Style.project_sidebar_flag_list
                                                        )}
                                                      >
                                                        <h4>Flag:</h4>
                                                        <div
                                                          className={classNames(
                                                            Style.project_sidebar_card_dropdown_flag_set
                                                          )}
                                                        >
                                                          <IconBox
                                                            customClass={classNames(
                                                              Style.project_sidebar_card_dropdown_clear_flag,
                                                              Style.icon_flag_gap
                                                            )}
                                                            tooltip
                                                            name="Clear Flag"
                                                            variant={
                                                              IconBox.getVariant
                                                                .OUTLINED
                                                            }
                                                            radius="50%"
                                                            width="6px"
                                                            icon={getIcon(
                                                              'CLEAR',
                                                              theme.theme_mode
                                                            )}
                                                            onClickListener={() => {
                                                              this.onClickClearFlagListener(
                                                                project
                                                              );
                                                            }}
                                                          />
                                                          {this.flagList.map(
                                                            (flag) => (
                                                              <IconBox
                                                                customClass={classNames(
                                                                  Style.icon_flag_gap
                                                                )}
                                                                tooltip
                                                                name={flag.name}
                                                                key={`ico_${flag.id}`}
                                                                width="10px"
                                                                icon={flag.icon}
                                                                onClickListener={() => {
                                                                  this.onClickFlagListener(
                                                                    flag,
                                                                    project
                                                                  );
                                                                }}
                                                              />
                                                            )
                                                          )}
                                                        </div>
                                                      </div>
                                                      <div
                                                        className={classNames(
                                                          Style.footer_btn
                                                        )}
                                                      >
                                                        <Button
                                                          text={
                                                            project.status ===
                                                            'Online'
                                                              ? 'Stop Site'
                                                              : 'Start Site'
                                                          }
                                                          loader={
                                                            project.loader
                                                              ? getIcon(
                                                                  'BUTTON_LOADER',
                                                                  theme.theme_mode
                                                                )
                                                              : ''
                                                          }
                                                          onClickListener={() => {
                                                            this.handleOnlineStatus(
                                                              project
                                                            );
                                                          }}
                                                          icon={
                                                            project.status ===
                                                            'Online'
                                                              ? getIcon(
                                                                  'STOP_SITE',
                                                                  theme.theme_mode
                                                                )
                                                              : getIcon(
                                                                  'START_SITE',
                                                                  theme.theme_mode
                                                                )
                                                          }
                                                          alignIcon={
                                                            Button.getPosition
                                                              .LEFT
                                                          }
                                                          customClass={classNames(
                                                            Style.project_status_btn
                                                          )}
                                                        />
                                                      </div>
                                                    </div>
                                                  </Menu>
                                                ) : null}
                                              </>
                                            }
                                          />
                                        )
                                    )
                                  ) : (
                                    <div
                                      className={classNames(
                                        Style.no_project_found
                                      )}
                                    >
                                      <IconBox
                                        customClass={classNames(
                                          Style.no_project_found_icon
                                        )}
                                        icon={
                                          // [CMS.DRUPAL, CMS.MAGENTO].includes(
                                          getIcon(
                                            'NO_PROJECT',
                                            theme.theme_mode
                                          )
                                        }
                                        tooltip={false}
                                      />
                                      <div
                                        className={classNames(
                                          Style.no_project_found_heading
                                        )}
                                      >
                                        No project found
                                      </div>
                                    </div>
                                  )}
                                </List>
                              </Accordion>
                            </div>
                          );
                        }}
                      </Draggable>
                    ))}
                  </div>
                  {cmsProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div
          className={classNames(
            Style.main_header,
            history.location.pathname ===
              routes.DASHBOARD + routes.PROJECT_SETTINGS
              ? Style.header_slide
              : ''
          )}
        >
          <div
            className={classNames(
              Style.header_container,
              history.location.pathname !==
                routes.DASHBOARD + routes.SETTING_UP_SITE &&
                history.location.pathname !==
                  routes.DASHBOARD + routes.CREATE_NEW_PROJECT
                ? ''
                : Style.header_right_fixed
            )}
          >
            {history.location.pathname !==
              routes.DASHBOARD + routes.SETTING_UP_SITE &&
              history.location.pathname !==
                routes.DASHBOARD + routes.CREATE_NEW_PROJECT && (
                <div className={classNames(Style.navigation)}>
                  <IconBox
                    customClass={classNames(Style.icon_gap)}
                    width="10px"
                    name="Previous"
                    radius="4px"
                    tooltipPlacement="bottom"
                    variant={IconBox.getVariant.OUTLINED}
                    size={IconBox.Size.MEDIUM}
                    icon={getIcon('ARROW_PREV', theme.theme_mode)}
                    disable={locationData.goBackStack.length <= 0}
                    onClickListener={this.onGoBackListener}
                  />
                  <IconBox
                    width="10px"
                    name="Next"
                    radius="4px"
                    tooltipPlacement="bottom"
                    variant={IconBox.getVariant.OUTLINED}
                    size={IconBox.Size.MEDIUM}
                    icon={getIcon('ARROW_NEXT', theme.theme_mode)}
                    disable={locationData.goForwardStack.length <= 0}
                    onClickListener={this.onGoForwardListener}
                  />
                </div>
              )}
            {history.location.pathname !==
              routes.DASHBOARD + routes.SETTING_UP_SITE &&
              history.location.pathname !==
                routes.DASHBOARD + routes.CREATE_NEW_PROJECT && (
                <div className={classNames(Style.search_header)}>
                  <SearchBar
                    id="inputid"
                    closeMenu={closeSearchMenu}
                    radius="4px"
                    searchIcon={getIcon('SEARCH', theme.theme_mode)}
                    value={searchValue}
                    onChangeListener={this.handleSearchInput}
                    onClearTextListener={this.onClearSearch}
                    cancelIcon={getIcon('CLEAR', theme.theme_mode)}
                    isSearchFound={searchList.filteredList.length > 0}
                  >
                    {!closeSearchMenu && searchList.filteredList.length > 0 ? (
                      <List
                        focusOnRender={false}
                        id="searchId"
                        maxHeight="240"
                        customClass={classNames(
                          Style.hoc_search_list,
                          searchList.selectedSearch.length === 0
                            ? Style.hoc_list_view
                            : ''
                        )}
                        onSubmitListener={this.onSubmitListItemListener}
                      >
                        {searchList.filteredList.map((item) => (
                          <ListItem
                            customOuter={Style.search_list_outer}
                            beforeText={
                              <IconBox
                                customClass={classNames(Style.search_icon)}
                                icon={this.getIconForSearchBarList(
                                  item.groupTitle,
                                  item.type
                                )}
                                tooltip={false}
                              />
                            }
                            key={`key_${item.id}`}
                            id={`search^${item.id}^${item.groupTitle}^${item.type}^${item.title}`}
                            primaryText={item.title}
                            secondaryText={this.getSecondaryTextSearchBar(
                              item.type,
                              item.groupTitle
                            )}
                            onCickListener={() => {
                              this.onClickSearchListItem(item);
                            }}
                          />
                        ))}
                      </List>
                    ) : (
                      <div className={classNames(Style.search_bar_no_result)}>
                        No result found
                      </div>
                    )}

                    {!closeSearchMenu &&
                    searchList.selectedSearch.length > 0 ? (
                      <>
                        <div className={classNames(Style.divider)} />
                        <div className={classNames(Style.list_group_title)}>
                          Recent Search:
                        </div>
                      </>
                    ) : null}

                    <List
                      customClass={classNames(Style.hoc_recent_search_list)}
                    >
                      {searchList.selectedSearch.map((item) => (
                        <ListItem
                          customOuter={Style.recent_search_list_outer}
                          beforeText={
                            <IconBox
                              customClass={classNames(Style.search_icon)}
                              icon={getIcon('RECENT', theme.theme_mode)}
                              tooltip={false}
                            />
                          }
                          key={`key_${item.id}`}
                          id={`search_${item.id}_${item.type}_${item.title}`}
                          primaryText={item.title}
                          // secondaryText={item.type}
                          onCickListener={() => {
                            this.onClickSearchListItem(item);
                          }}
                          afterText={
                            <div
                              className={classNames(Style.recent_search_type)}
                            >
                              {this.getSecondaryTextSearchBar(
                                item.type,
                                item.groupTitle
                              )}
                            </div>
                          }
                        />
                      ))}
                    </List>
                  </SearchBar>
                </div>
              )}
            <div className={classNames(Style.hoc_header_setting)}>
              {/** For notification icon uncomment the div */}
              {/* <IconBox
                customClass={classNames(Style.hoc_notification_icon)}
                icon={getIcon('NOTIFICATION', theme.theme_mode)}
                name="Notifications"
                tooltipPlacement="bottom"
                onClickListener={() => {
                  // this.goToPage(routes.DASHBOARD + routes.ALL_PROJECTS);
                }}
                disable={true}
              /> */}
              <div className={classNames(Style.hoc_account)}>
                <Tooltip
                  customClass={Style.hoc_account_tooltip}
                  title={userName}
                  placement={Tooltip.getPlacement.LEFT}
                  variant={Tooltip.getVariant.WRAP}
                  show={menuId === MENU_ID.DROPDOWN_MENU}
                >
                  <span
                    role="presentation"
                    onClick={() => {
                      this.toggleDropdownMenu(MENU_ID.DROPDOWN_MENU);
                    }}
                    className={classNames(
                      Style.hoc_user,
                      menuId === MENU_ID.DROPDOWN_MENU ? Style.active : ''
                    )}
                  >
                    {_.capitalize(userName[0])}
                  </span>
                </Tooltip>
                {/* <span
                  role="presentation"
                  onClick={() => this.toggleDropdownMenu(MENU_ID.DROPDOWN_MENU)}
                  className={classNames(
                    Style.hoc_user,
                    menuId === MENU_ID.DROPDOWN_MENU ? Style.active : ''
                  )}
                >
                  J
                </span> */}
                {menuId === MENU_ID.DROPDOWN_MENU ? (
                  <Menu
                    customClass={classNames(Style.hoc_account_dropdown)}
                    header={<h2>Hi {_.capitalize(userName)}</h2>}
                    footer={
                      <Switch
                        customClass={classNames(Style.hoc_switch)}
                        leftTitle="Dark Mode"
                        size={Switch.Size.SMALL}
                        checked={checkThemeSwitch}
                        onClickListener={this.toggleTheme}
                      />
                    }
                    onRemoveMenu={() => {
                      this.toggleDropdownMenu(MENU_ID.HIDE_MENU);
                    }}
                  >
                    <List
                      customClass={classNames(Style.hoc_list)}
                      id="dropdown_list"
                      onSubmitListener={this.onSubmitListItemListener}
                    >
                      <ListItem
                        id={`dropdown^0^${routes.SETTINGS}^${SearchFilter.LOCATION}^Settings`}
                        onCickListener={this.onSettingsClickListener}
                        primaryText="Settings"
                        afterText={
                          <img
                            className={classNames(Style.hoc_icon)}
                            src={getIcon('SETTING', theme.theme_mode)}
                            alt="setting"
                          />
                        }
                      />
                      <ListItem
                        id="dropdown^1^modal-logout^MODAL^Logout"
                        primaryText="Logout"
                        onCickListener={this.onLogOutClickListener}
                        afterText={
                          <img
                            className={classNames(Style.hoc_icon)}
                            src={getIcon('LOGOUT', theme.theme_mode)}
                            alt="logout"
                          />
                        }
                      />
                    </List>
                  </Menu>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div
          className={classNames(
            Style.main_container,
            history.location.pathname ===
              routes.DASHBOARD + routes.PROJECT_SETTINGS
              ? Style.slide
              : ''
          )}
        >
          {children}
        </div>
        {/* !.currentProject.subTitle condition for handle setting up site */}
        {(currentLoadedProject.length ||
          (!currentProject.subTitle && currentProject.loader)) && (
          <>
            {showBottomNotification && (
              <BottomNotification
                floating
                // eslint-disable-next-line no-underscore-dangle
                bottom={BottomNotification.bottom._15}
                // autoRemove - enable for auto remove notifocation
                id="start_stop"
                customClass={Style.hoc_bottom_notification}
              >
                <div
                  className={classNames(Style.hoc_bottom_notification_content)}
                >
                  <IconBox
                    tooltip={false}
                    icon={getIcon('INFORMATION', theme.theme_mode)}
                  />
                  <div
                    className={classNames(Style.hoc_bottom_notification_title)}
                  >
                    {
                      (() => {
                        if (currentLoadedProject[0]) {
                          return `Hang on! We’re ${
                            currentLoadedProject[0].status !==
                            SiteState.RUNNING.toString()
                              ? 'starting'
                              : 'stopping'
                          }  your website.`;
                        }
                        if (!currentProject.subTitle.trim().length) {
                          return 'Just few more minutes and your site will be up and running.';
                        }
                        return '';
                      })()
                      //  if(currentLoadedProject[0]){

                      // }
                      // else{

                      // }
                    }
                  </div>
                </div>
              </BottomNotification>
            )}
            <div
              onClick={() => {
                this.enableBottomNotification();
              }}
              className={classNames(Style.overlay)}
            />
          </>
        )}
      </div>
    );
  }
}
const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    searchList: state.search_attributes,
    modalData: state.modal_attributes,
    locationData: state.location_attributes,
    projectData: state.project_attributes,
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(
    {
      ...SearchActions,
      ...ThemeActions,
      ...ModalActions,
      ...LocationActions,
      ...ProjectActions,
      ...ToastActions,
      ...NotificationActions,
    },
    dispatch
  );
};

export default withRouter(connect(mapStateToProps, mapDispatchToAction)(Hoc));
