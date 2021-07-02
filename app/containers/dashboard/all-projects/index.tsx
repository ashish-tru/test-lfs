/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react/no-unused-state */
import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ipcRenderer } from 'electron';
import _ from 'lodash';
import { Location, createLocation } from 'history';

import {
  IconBox,
  SelectOptions,
  Grid,
  Card,
  CheckBox,
  Tooltip,
  TextHighlighter,
  Button,
  Menu,
  BottomNotification,
  Notification,
} from '@stackabl/ui';

import db from '@stackabl/core/render/Database';
import logger from '@stackabl/core/shared/logger';
import { ProjectsSchema } from '@stackabl/core/render/Database/schema';
import { HelperRole, SiteState } from '@stackabl/core/shared/dependencies';
import {
  startStopsite,
  runningSites,
  CurrenState,
} from '@stackabl/core/render/common';
import Analytics, {
  EVENT,
  LABEL,
  ACTION,
} from '@stackabl/core/render/analytics';
import displayNotification, {
  DISPLAYTYPE,
} from '../../../utils/common/notification';

import { RootState } from '../../../reducers/types';
import Style from './index.scss';
import routes from '../../../constants/routes.json';
import ModalActions, {
  EditProjectDataType,
  DeleteProjectType,
} from '../../../actions/modal';

import { InitialThemeState } from '../../../reducers/theme';
import { InitialModalState } from '../../../reducers/modal';

import ProjectActions, { SetParamInProject } from '../../../actions/projects';
import { InitialProjectState, initialState } from '../../../reducers/projects';
import { InitialNotificationState } from '../../../reducers/notification';

import { getIcon, getColoredIcon } from '../../../utils/themes/icons';
import flagRed from '../../../resources/Icons/Common/flag_red.svg';
import flagPurple from '../../../resources/Icons/Common/flag_purple.svg';
import flagGreen from '../../../resources/Icons/Common/flag_green.svg';
import flagOrange from '../../../resources/Icons/Common/flag_orange.svg';
import flagBlue from '../../../resources/Icons/Common/flag_blue.svg';
import Tick from '../../../resources/Icons/Common/check.svg';
import { IList } from '../../../utils/ListSchema';
import { contentAdaptar } from '../../../utils/common';
import { CMS, FLAGS, convertFormatedDate } from '../../../constants/index';
import LocationActions from '../../../actions/navigation';
import NotificationActions, {
  NotificationContentType,
  NotificationKeys,
} from '../../../actions/notification';
import Success from '../../../resources/Icons/Common/success.svg';

const MenuId = {
  MENU_BOTTOM_NOTIFICATION: -2,
  HIDE_MENU: -1,
};

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
  projectsData: InitialProjectState;
  notification: InitialNotificationState;
}

interface State {
  menuId: number;
  sortBy: string;
  filterBy: string;
  projects: IList[];
  selectList: ListType[];
  flagFilterList: ListType[];
  runningProjects: string[];
  selectedprojects: IList[];
  viewType: string;
  isFlagOptionsClicked: boolean;
  renderSortList: boolean;
}

interface ListType {
  id: number;
  name: string;
  icon: string;
  selected: boolean;
  text?: string;
  bgColor?: string;
  textColor?: string;
}

interface DispatchProps {
  addDescriptionModal: (payload: EditProjectDataType) => void;
  showDeleteModal: (payload: DeleteProjectType) => void;
  currentProject: (payload: IList) => void;
  addNewProject: (payload: IList) => void;
  updateProject: (payload: IList) => void;
  getAllProjects: (payload: IList[]) => void;
  pushLocation: (payload: Location) => void;
  setFlagForProject: (payload: SetParamInProject) => void;
  setOnlineStatusForProject: (payload: IList) => void;
  clearFlagForProject: (payload: IList) => void;
  toggleSelectionOfProject: (payload: IList) => void;
  clearSelectionOfProject: (payload: IList) => void;
  showNotification: (payload: NotificationContentType) => void;
  removeNotification: (payload: string) => void;
}
const log = logger.scope('AllProjects');

type Props = StateProps & RouteComponentProps & DispatchProps;

class AllProjects extends React.Component<Props, State> {
  db!: db;
  // demo for the accessing all the projects using redux

  menuList: ListType[] = [
    { id: 0, name: 'Add description', icon: '', selected: false },
    { id: 1, name: 'Create New Project', icon: '', selected: false },
    { id: 2, name: 'Delete Project', icon: '', selected: false },
  ];

  flagList: ListType[] = [
    { id: 0, name: FLAGS.ORANGE, icon: `${flagOrange}`, selected: false },
    { id: 1, name: FLAGS.RED, icon: `${flagRed}`, selected: false },
    { id: 2, name: FLAGS.PURPLE, icon: `${flagPurple}`, selected: false },
    { id: 3, name: FLAGS.BLUE, icon: `${flagBlue}`, selected: false },
    { id: 4, name: FLAGS.GREEN, icon: `${flagGreen}`, selected: false },
  ];

  flagFilterList: ListType[] = [
    {
      id: 0,
      name: FLAGS.NONE_SELECTED,
      icon: '',
      selected: false,
    },
    {
      id: 1,
      name: FLAGS.ALL_FLAGGED,
      icon: '',
      selected: false,
      text: '(66)',
      bgColor: 'transparent',
    },
    {
      id: 2,
      name: FLAGS.ORANGE,
      icon: `${flagOrange}`,
      selected: false,
      text: '80',
      bgColor: '#ea9419',
      textColor: '#fff',
    },
    {
      id: 3,
      name: FLAGS.RED,
      icon: `${flagRed}`,
      selected: false,
      bgColor: '#f35057',
      textColor: '#fff',
      text: '19',
    },
    {
      id: 4,
      name: FLAGS.PURPLE,
      icon: `${flagPurple}`,
      selected: false,
      bgColor: '#9e5bd0',
      textColor: '#fff',
      text: '14',
    },
    {
      id: 5,
      name: FLAGS.BLUE,
      icon: `${flagBlue}`,
      selected: false,
      bgColor: '#00becd',
      textColor: '#fff',
      text: '2',
    },
    {
      id: 6,
      name: FLAGS.GREEN,
      icon: `${flagGreen}`,
      selected: false,
      bgColor: '#00c68d',
      textColor: '#fff',
      text: '2',
    },
  ];

  constructor(props: Props) {
    super(props);

    const viewType = localStorage.getItem('viewType') || 'grid';
    if (viewType) {
      localStorage.setItem('viewType', viewType);
    }

    // // sortBy
    const sortByFilter = localStorage.getItem('sortBy');
    // flag
    const flagFilter = localStorage.getItem('flag');
    this.state = {
      menuId: MenuId.HIDE_MENU,
      sortBy: sortByFilter || 'Please select',
      filterBy: flagFilter || FLAGS.NONE_SELECTED,
      projects: [],
      selectList: [
        { id: 0, name: 'Sort A to Z', icon: '', selected: false },
        { id: 1, name: 'Sort Z to A', icon: '', selected: false },
        { id: 2, name: 'Last Updated', icon: '', selected: false },
      ],
      runningProjects: [],
      selectedprojects: [],
      flagFilterList: [...this.flagFilterList],
      viewType,
      isFlagOptionsClicked: false,
      renderSortList: false,
    };
    this.toggleDropdownMenu = this.toggleDropdownMenu.bind(this);
  }

  componentDidMount() {
    Analytics.getInstance().screenView('All Projects');
    const { selectList, sortBy, filterBy, flagFilterList } = this.state;
    const sortList = selectList.map((each) => ({
      ...each,
      selected: each.name === sortBy,
    }));
    const flagList = flagFilterList.map((each) => ({
      ...each,
      selected: filterBy === each.name,
    }));
    this.setState({ selectList: [...sortList], flagFilterList: [...flagList] });
    this.init();
  }

  /**
   *@description - to inilise filter view database
   * @param initial - if true initilise database & map all database projects to redux
   */

  componentWillUnmount() {
    this.unSelectCheckedProjects();
  }

  init = async () => {
    this.db = await db.getInstance();
    await this.updateAllprojectRedux();
    this.changeFilterList();
  };

  /**
   *  @description common function for  maping database projects to redux
   */
  updateAllprojectRedux = async () => {
    const {
      getAllProjects,
      projectsData: { allProjects },
    } = this.props;
    const result: string[] = await runningSites();
    const userId = localStorage.getItem('UserId');
    const projectList: IList[] = contentAdaptar(
      this.db.getAllProject(userId || '', true, 'update_date'),
      allProjects,
      initialState.currentProject,
      result
    );
    getAllProjects(projectList);
  };

  toggleDropdownMenu = (id: number, description?: string): void => {
    this.menuList = this.menuList.map((each) => {
      if (each.id === 0) {
        return {
          ...each,
          name: description?.trim().length
            ? 'Edit Description'
            : 'Add Description',
        };
      }
      return each;
    });

    this.setState((prevState) => ({
      menuId: prevState.menuId === id ? MenuId.HIDE_MENU : id,
    }));
  };

  getProjectFromDB = async (container_name: string, title: string) => {
    const metaDb = await db.getInstance();
    const project = metaDb.getProjectByParam({
      name: title,
      container_name,
    });
    return project;
  };

  onClickFlagListener = async (selectedFlag: ListType, project: IList) => {
    const { setFlagForProject } = this.props;
    const currentProject = await this.getProjectFromDB(
      project.subTitle,
      project.title
    );
    this.db.updateProject({ ...currentProject, flag: selectedFlag.name });
    setFlagForProject({ listItem: project, name: selectedFlag.name });
  };

  /**
   * @description - clear single project flag
   * @param project  -selected project
   */
  onClickClearFlagListener = async (project: IList) => {
    const { clearFlagForProject } = this.props;
    const currentProject = await this.getProjectFromDB(
      project.subTitle,
      project.title
    );
    this.db.updateProject({ ...currentProject, flag: '' });
    clearFlagForProject(project);
  };

  /**
   * filter based on selected sort
   */
  getSortedArray = (): IList[] => {
    const {
      projectsData: { allProjects },
    } = this.props;
    const { selectList, sortBy } = this.state;
    // allProjects[0].timeStamp;
    const selected = selectList.find((each) => each.name === sortBy);
    const newProjects = [...allProjects];
    switch (selected ? selected.id : '') {
      case 0:
        return _.sortBy(newProjects, 'title');
      case 1:
        return _.reverse(_.sortBy(newProjects, 'title'));
      case 2:
        return _.reverse(_.sortBy(newProjects, 'timeStamp'));
      default:
        return newProjects;
    }
  };

  onClickSortItem = (item: ListType) => {
    const { selectList } = this.state;
    localStorage.setItem('sortBy', item.name);
    const sortList: ListType[] = [...selectList].map((sortByEl: ListType) => {
      let el = sortByEl;
      el = { ...sortByEl, selected: sortByEl.name === item.name };
      return el;
    });
    this.setState({
      selectList: sortList,
      sortBy: item.name,
    });
  };

  changeFilterList = () => {
    log.info('changeFilterList');
    const { flagFilterList, filterBy } = this.state;
    const {
      projectsData: { allProjects },
    } = this.props;
    const list = flagFilterList.map((each) => {
      if (each.name === FLAGS.NONE_SELECTED) {
        return { ...each, selected: each.name === filterBy };
      }
      if (each.name === FLAGS.ALL_FLAGGED) {
        return {
          ...each,
          selected: each.name === filterBy,
          text: allProjects
            .filter((eachProject) => eachProject.flag.trim().length)
            .length.toString(),
        };
      }
      return {
        ...each,
        selected: each.name === filterBy,
        text: allProjects
          .filter((project) => each.name === project.flag)
          .length.toString(),
      };
    });
    this.setState({ flagFilterList: [...list] });
  };

  filterprojectbyflag = (allProjects: IList[]) => {
    const { filterBy } = this.state;

    if (filterBy === FLAGS.ALL_FLAGGED) {
      return allProjects.filter((project) => project.flag !== '');
      // this.setState({ projects: flagFilteredList });
    }
    if (filterBy === FLAGS.NONE_SELECTED) {
      return allProjects;
      // this.setState({ projects: projectsData.allProjects });
    }
    return allProjects.filter((each) => each.flag === filterBy);
  };

  onSelectFlagFilter = (item: ListType) => {
    log.info('onselectfilter', item.name);
    this.setState({
      filterBy: item.name,
    });

    localStorage.setItem('flag', item.name);
  };

  onClickToggleView = (view: string) => {
    Analytics.getInstance().eventTracking(EVENT.Dashboard, ACTION.View, view);
    this.setState({
      viewType: view,
      menuId: MenuId.HIDE_MENU,
    });
    if (view) {
      localStorage.setItem('viewType', view);
      this.setState({ viewType: view });
    }
  };

  handleFlagsForSelectedProjects = (flag: ListType) => {
    const selectedprojects = this.filterprojectbyflag(
      this.getSortedArray()
    ).filter((each) => each.selected);
    // const { selectedprojects } = this.state;
    const { setFlagForProject } = this.props;
    if (selectedprojects.length > 0) {
      selectedprojects.forEach((each) => {
        setFlagForProject({
          listItem: each,
          name: flag.name,
        });
      });

      this.db.updateMultipleProject(
        selectedprojects.map((project: IList) => project.subTitle),
        { flag: flag.name }
      );
    }
  };

  clearFlagsForSelectedProjects = () => {
    const selectedprojects = this.filterprojectbyflag(
      this.getSortedArray()
    ).filter((each) => each.selected);

    const { clearFlagForProject } = this.props;
    if (selectedprojects.length > 0) {
      selectedprojects.forEach((each) => {
        clearFlagForProject(each);
      });
      this.db.updateMultipleProject(
        selectedprojects.map((project: IList) => project.subTitle),
        { flag: '' }
      );
    }
  };

  onProjectCheckChange = (project: IList) => {
    const { toggleSelectionOfProject } = this.props;
    toggleSelectionOfProject(project);
  };

  /**
   * @description disabling button of selected stop site
   */
  validateMultipleStopSite = () => {
    const selectedprojects: IList[] = this.filterprojectbyflag(
      this.getSortedArray()
    ).filter((each) => each.selected);

    return !selectedprojects.filter((each) => each.status === SiteState.RUNNING)
      .length;
  };

  /**
   * @description used for stoping multiple project at same time
   */
  handleMultipleOnlineStatus = async () => {
    const selectedprojects: IList[] = this.filterprojectbyflag(
      this.getSortedArray()
    ).filter((each) => each.selected);
    Analytics.getInstance().eventTracking(
      EVENT.Dashboard,
      ACTION.MultipleStop,
      `${selectedprojects.length}`
    );
    log.info('handleMultipleOnlineStatus');
    const action = selectedprojects
      .filter((each: IList) => each.status === SiteState.RUNNING)
      .map((each) => this.handleOnlineStatus(each, true));
    try {
      const result = await Promise.allSettled(action);

      if (action.length) {
        const payload: NotificationContentType = {
          id: 'WEBSITE',
          message:
            action.length > 1
              ? `The selected running sites has been stopped.`
              : 'The site has stopped.',
          type: Notification.Type.SUCCESS,
          title: 'All Done',
        };
        displayNotification(payload);
        // ipcRenderer.send('notification', {
        //   title: 'All Done',
        //   body:
        //     action.length > 1
        //       ? `The selected running sites has been stopped.`
        //       : 'The site has stopped.',
        // });
      }
      this.updateAllprojectRedux();
      log.info(result);
    } catch (err) {
      log.info(err);
    }
  };

  /**
   *@description starting or stoping site
   * @param project
   */
  handleOnlineStatus = async (project: IList, multiple?: boolean) => {
    const currentProject = await this.getProjectFromDB(
      project.subTitle,
      project.title
    );
    const {
      name,
      type,
      meta,
      container_name,
      credential,
      description,
      sslFlag,
      location,
    } = currentProject;
    const { updateProject, history } = this.props;
    updateProject({ ...project, disable: false, loader: true });
    try {
      const args = await startStopsite({
        id: container_name,
        projectName: name,
        projectEmail: credential.email,
        projectPass: credential.password,
        projectUsername: credential.username,
        versionValue: meta.find((each) => each.role === HelperRole.SCRIPT)!
          .version,
        databaseValue: meta.find((each) => each.role === HelperRole.DATABASE)!
          .version,
        type,
        location,
        addDescription: description,
        ssl: sslFlag,
      });
      if (args.status === SiteState.RUNNING) {
        Analytics.getInstance().eventTracking(
          EVENT.Dashboard,
          ACTION.Start,
          LABEL.Dropdown
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
          disable: false,
          loader: false,
          timeStamp: args.response.update_date,
        });
        if (!multiple) {
          const payload: NotificationContentType = {
            id: 'WEBSITE',
            message: `Your site is ready!`,
            type: NotificationKeys.ADD_NOTIFICATION,
            title: 'All Done',
          };
          displayNotification(payload);
          // ipcRenderer.send('notification', {
          //   title: 'All Done',
          //   body: `Your site is ready!`,
          // });
        }
      } else {
        Analytics.getInstance().eventTracking(
          EVENT.Dashboard,
          ACTION.Stop,
          LABEL.Dropdown
        );
        const time = new Date().toJSON();
        this.db.updateProject({
          ...currentProject,
          update_date: time,
          status: SiteState.STOP,
        });
        updateProject({
          ...project,
          status: SiteState.STOP,
          timeStamp: time,
        });
        if (!multiple) {
          const payload: NotificationContentType = {
            id: 'stop-site',
            message: `The site has stopped.`,
            type: NotificationKeys.ADD_NOTIFICATION,
            title: 'All Done',
          };
          displayNotification(payload);
        }
      }
    } catch (ERR) {
      updateProject({ ...project, status: SiteState.STOP });
      log.info(ERR, 'stat,stop site');
      if (!multiple) {
        const payload: NotificationContentType = {
          id: 'WEBSITE',
          message: `failed to ${
            project.status === SiteState.RUNNING ? 'stop' : 'start.'
          }`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Failed',
        };
        displayNotification(payload);
        // ipcRenderer.send('notification', {
        //   title: 'Failed',
        //   body: `failed to ${
        //     project.status === SiteState.RUNNING ? 'stop' : 'start.'
        //   }`,
        // });
      }
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

  unSelectCheckedProjects = () => {
    const { clearSelectionOfProject } = this.props;
    const selectedprojects: IList[] = this.filterprojectbyflag(
      this.getSortedArray()
    ).filter((each) => each.selected);

    selectedprojects.forEach((project: IList) => {
      clearSelectionOfProject(project);
    });
  };

  showAddDescriptionModal = (i: IList) => {
    Analytics.getInstance().eventTracking(
      EVENT.Dashboard,
      ACTION.Description,
      LABEL.Dropdown
    );
    const { addDescriptionModal } = this.props;
    addDescriptionModal({ show: true, project: i });
  };

  onClickProjectCardListener = (project: IList) => {
    const { history, currentProject } = this.props;
    currentProject(project);
    const dbProject = this.db.getProjectByParam({
      name: project.title,
      container_name: project.subTitle,
    });
    log.info(
      {
        ...dbProject,
        credential: { ...dbProject.credential, password: undefined },
      },
      'dbproject'
    );

    history.push({
      pathname: `${routes.DASHBOARD}${routes.PROJECT_SETTINGS}`,
      state: {
        ...dbProject,
        meta: [...dbProject.meta],
        webSync: dbProject.webSync ? { ...dbProject.webSync } : undefined,
      },
    });
    this.goToPage(routes.DASHBOARD + routes.PROJECT_SETTINGS, dbProject);
  };

  goToPage = (location: string, state?: ProjectsSchema, query?: string) => {
    const { pushLocation } = this.props;
    // history.push(location);
    const projectState = state ? { ...state, meta: [...state.meta] } : state;
    pushLocation(
      createLocation({ pathname: location, state: projectState, search: query })
    );
  };

  onClickSelectProjectListener = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    i: IList
  ) => {
    const element = event.target as HTMLElement;
    const clickedElement = element.id;
    if (clickedElement.includes('project_details_')) {
      this.onClickProjectCardListener(i);
    } else if (clickedElement.includes('checkbox_')) {
      this.onProjectCheckChange(i);
    } else if (clickedElement.includes('description_')) {
      this.showAddDescriptionModal(i);
    }
  };

  onClickProjectMenuitems = (
    item: ListType | HTMLLIElement,
    project: IList
  ) => {
    log.info('onClickProjectMenuitems');
    const id = item.id.toString();

    switch (id) {
      case '0':
        this.showAddDescriptionModal(project);
        break;
      case '1':
        Analytics.getInstance().eventTracking(
          EVENT.Dashboard,
          ACTION.Create,
          LABEL.Dropdown
        );
        this.goToPage(
          routes.DASHBOARD + routes.CREATE_NEW_PROJECT,
          undefined,
          `?type=${project.type}`
        );
        break;
      case '2':
        this.showDeleteProject(project);
        break;
      default:
        break;
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

  getCMSIconsUsingId = (project: IList) => {
    switch (project.groupTitle) {
      case CMS.WORDPRESS:
        return 'WORDPRESS';
      case CMS.JOOMLA:
        return 'JOOMLA';
      case CMS.DRUPAL:
        return 'DRUPAL';
      // case CMS.MAGENTO:
      //   return 'MAGENTO';
      default:
        return '';
    }
  };

  /**
   * @description delete single project
   * @param project projectdetail
   */
  showDeleteProject = (project: IList) => {
    const { showDeleteModal } = this.props;
    Analytics.getInstance().eventTracking(
      EVENT.Dashboard,
      ACTION.Delete,
      LABEL.Dropdown
    );
    showDeleteModal({ show: true, project: [project] });
  };

  /**
   * @description - method to delete multlpe project at same time
   */
  deleteAllProjects = async () => {
    const selectedprojects: IList[] = this.filterprojectbyflag(
      this.getSortedArray()
    ).filter((each) => each.selected);
    Analytics.getInstance().eventTracking(
      EVENT.Dashboard,
      ACTION.MultipleDelete,
      `${selectedprojects.length}`
    );
    const { showDeleteModal } = this.props;
    this.unSelectCheckedProjects();
    showDeleteModal({ show: true, project: selectedprojects });
  };

  // onFlagOptionsClickListener = () => {
  //   this.setState((prevState) => ({
  //     isFlagOptionsClicked: !prevState.isFlagOptionsClicked,
  //   }));
  // };

  isFlagOptionsRemoved = (isListRemoved: boolean) => {
    this.setState({
      isFlagOptionsClicked: isListRemoved,
    });
  };

  isSortOptionsRemoved = (isListRemoved: boolean) => {
    log.info('isSortOptionsRemoved');
    this.setState({
      renderSortList: isListRemoved,
    });
  };

  getKeyByValue = (
    object: { [label: string]: string },
    value: string
  ): string => {
    return (
      Object.keys(object).find((key) => object[key] === value) ||
      'THEME_COLOR_0'
    );
  };

  showNotification = () => {
    const { showNotification } = this.props;
    const demo = {
      id: 'demo',
      title: 'hello world',
      message: 'This is demo notification',
      type: 'success', // warning // error
    };
    showNotification(demo);
  };

  hideNotification = () => {
    const { removeNotification } = this.props;
    removeNotification('demo');
  };

  render() {
    const filteredList = this.filterprojectbyflag(this.getSortedArray());
    const selectedList = filteredList.filter((each) => each.selected);
    const {
      menuId,
      sortBy,
      viewType,
      flagFilterList,
      filterBy,
      isFlagOptionsClicked,
      renderSortList,
      selectList,
    } = this.state;
    const { theme, notification } = this.props;

    return (
      <div className={classNames(Style.all_projects_dashboard)}>
        <div className={classNames(Style.all_project_header)}>
          <h1 className={classNames(Style.all_projects_heading)}>
            All Projects
          </h1>
          <div className={classNames(Style.all_project_right_content)}>
            <SelectOptions
              id="sort_select_option"
              customClass={classNames(Style.all_project_filter)}
              parentClass={classNames(
                Style.filter_flag_gap,
                Style.all_project_select_list
              )}
              label="Sort by"
              value={sortBy}
              icon={getIcon('DROPDOWN', theme.theme_mode)}
              selectList={renderSortList ? selectList : []}
              selectedItem={(item) => this.onClickSortItem(item)}
              isOptionsRemoved={(isListRemoved) => {
                this.isSortOptionsRemoved(isListRemoved);
              }}
              selectIcon={getIcon('TICK', theme.theme_mode)}
            />
            <SelectOptions
              id="flag_select_option"
              customClass={classNames(Style.all_project_filter)}
              parentClass={classNames(
                Style.all_project_select_list,
                Style.all_project_select_list_filter_by
              )}
              label="Filter by"
              value={filterBy}
              icon={getIcon('DROPDOWN', theme.theme_mode)}
              selectList={isFlagOptionsClicked ? flagFilterList : []}
              selectedItem={(item) => this.onSelectFlagFilter(item)}
              isOptionsRemoved={(isListRemoved) => {
                this.isFlagOptionsRemoved(isListRemoved);
              }}
              selectIcon={getIcon('TICK', theme.theme_mode)}
              onSelectClickListener={() => this.changeFilterList()}
            />

            <div className={classNames(Style.divider)} />
            <IconBox
              name="Grid"
              radius="4px"
              tooltipPlacement="bottom"
              variant={IconBox.getVariant.OUTLINED}
              size={IconBox.Size.MEDIUM}
              icon={
                viewType === 'grid'
                  ? getIcon('GRID_VIEW', 'dark')
                  : getIcon('GRID_VIEW', theme.theme_mode)
              }
              onClickListener={() => this.onClickToggleView('grid')}
              active={viewType === 'grid'}
              customClass={classNames(Style.icon_all_projects_view)}
            />
            <IconBox
              customClass={classNames(
                Style.icon_gap,
                Style.icon_all_projects_view
              )}
              name="List"
              radius="4px"
              tooltipPlacement="bottom"
              variant={IconBox.getVariant.OUTLINED}
              size={IconBox.Size.MEDIUM}
              icon={
                viewType === 'list'
                  ? getIcon('LIST_VIEW', 'dark')
                  : getIcon('LIST_VIEW', theme.theme_mode)
              }
              onClickListener={() => this.onClickToggleView('list')}
              active={viewType === 'list'}
            />
          </div>
        </div>
        {/* Uncomment the buttons to hide and show the notification */}
        {/* <Button
          text="Show Notification"
          onClickListener={this.showNotification}
        />
        <Button
          text="Hide notification"
          onClickListener={this.hideNotification}
        /> */}
        <div className={classNames(Style.all_project_container)}>
          {filteredList.length > 0 ? (
            <div
              id="grid_div"
              className={classNames(Style.all_project_container_inner)}
            >
              {viewType === 'grid' && (
                <Grid
                  customClass={Style.all_project_grid_view_container}
                  variant={Grid.getVariant.AUTOFILL}
                  spacing={Grid.Spacing.SP_20}
                >
                  {filteredList.map((project) => (
                    <Card
                      id={`project_details_${project.id}`}
                      customClass={classNames(
                        Style.all_project_cards,
                        project.disable ? Style.disable_grid_card : '',
                        project.selected ? Style.selected : ''
                      )}
                      key={`card_key_${project.id}`}
                      onClickListener={(e) => {
                        this.onClickSelectProjectListener(e, project);
                      }}
                      disable={project.disable}
                      selected={project.selected}
                      header={
                        <div
                          className={classNames(Style.all_project_card_header)}
                        >
                          <CheckBox
                            key={`checkbox_${project.id}`}
                            id={`checkbox_${project.id}`}
                            name={_.capitalize(project.title)}
                            radius="50%"
                            icon={Tick}
                            checked={project.selected}
                            onChangeListener={(e) => {
                              // log.info(e.target.checked, 'checkbox testing');
                            }}
                            disable={project.disable}
                          />
                          <div
                            className={classNames(
                              Style.all_project_card_header_right
                            )}
                          >
                            <Tooltip
                              customClass={classNames(Style.icon_gap)}
                              title={project.status}
                              placement={Tooltip.getPlacement.LEFT}
                              disable={project.disable}
                            >
                              <span
                                className={classNames(
                                  Style.all_project_card_tooltip,
                                  Style[`${project.status}`],
                                  project.disable ? Style.disable : ''
                                )}
                              />
                            </Tooltip>

                            {project.flag && (
                              <IconBox
                                customClass={classNames(Style.icon_gap)}
                                name={`${project.flag} Flagged`}
                                icon={this.handleFlagIcons(project)}
                                width="10px"
                                tooltipPlacement="left"
                                disable={project.disable}
                                tooltipDisable={project.disable}
                              />
                            )}
                            <IconBox
                              id={`more_${project.id}`}
                              name="More"
                              icon={
                                project.disable
                                  ? getIcon('MORE_DISABLE', theme.theme_mode)
                                  : getIcon('MORE', theme.theme_mode)
                              }
                              onClickListener={() => {
                                this.toggleDropdownMenu(
                                  project.id,
                                  project.descritption
                                );
                              }}
                              disable={
                                project.disable ||
                                project.projectcurrentState !==
                                  CurrenState.COMPLETE
                              }
                              tooltipVariant="bottom"
                              tooltipDisable={project.disable}
                              tooltipInactive={menuId === project.id}
                              customClass={classNames(
                                Style.all_project_grid_more_icon
                              )}
                            />
                          </div>

                          {menuId === project.id ? (
                            <Menu
                              id={`card_menu_${project.id}`}
                              onRemoveMenu={() => {
                                this.toggleDropdownMenu(project.id);
                              }}
                              onSubmitSelectedItem={(selectedItem) => {
                                this.onClickProjectMenuitems(
                                  selectedItem,
                                  project
                                );
                              }}
                              onClickItemListener={(selectedItem) => {
                                this.onClickProjectMenuitems(
                                  selectedItem,
                                  project
                                );
                              }}
                              customClass={classNames(
                                Style.all_project_card_dropdown
                              )}
                              list={this.menuList}
                            >
                              <div
                                className={classNames(
                                  Style.all_project_card_dropdown_footer
                                )}
                              >
                                <div
                                  className={classNames(
                                    Style.all_project_flag_list
                                  )}
                                >
                                  <h4>Flag:</h4>
                                  <div
                                    className={classNames(
                                      Style.all_project_card_dropdown_flag_set
                                    )}
                                  >
                                    <IconBox
                                      customClass={classNames(
                                        Style.all_project_card_dropdown_clear_flag,
                                        Style.icon_flag_gap
                                      )}
                                      width="6px"
                                      radius="50%"
                                      icon={getIcon('CLEAR', theme.theme_mode)}
                                      variant={IconBox.getVariant.OUTLINED}
                                      name="Clear Flag"
                                      onClickListener={() => {
                                        this.onClickClearFlagListener(project);
                                      }}
                                    />
                                    {this.flagList.map((flag) => (
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
                                    ))}
                                  </div>
                                </div>
                                <div className={classNames(Style.footer_btn)}>
                                  <Button
                                    text={
                                      project.status === SiteState.RUNNING
                                        ? 'Stop Site'
                                        : 'Start Site'
                                    }
                                    onClickListener={() => {
                                      this.handleOnlineStatus(project);
                                    }}
                                    loader={
                                      project.loader
                                        ? getIcon(
                                            'BUTTON_LOADER',
                                            theme.theme_mode
                                          )
                                        : ''
                                    }
                                    icon={
                                      project.status === SiteState.RUNNING
                                        ? getIcon('STOP_SITE', theme.theme_mode)
                                        : getIcon(
                                            'START_SITE',
                                            theme.theme_mode
                                          )
                                    }
                                    alignIcon={Button.getPosition.LEFT}
                                    customClass={classNames(
                                      Style.project_status_btn
                                    )}
                                  />
                                </div>
                              </div>
                            </Menu>
                          ) : null}
                        </div>
                      }
                    >
                      <div
                        id={`project_details_img_holder_${project.id}`}
                        className={classNames(Style.all_project_card_body)}
                      >
                        <div
                          className={classNames(
                            Style.all_project_card_icon_holder
                          )}
                        >
                          <div
                            id={`project_details_img_cont_${project.id}`}
                            className={classNames(
                              Style.all_project_icon_circle
                            )}
                          >
                            <img
                              id={`project_details_img_${project.id}`}
                              src={
                                project.disable
                                  ? getIcon(
                                      `${this.getCMSIconsUsingId(
                                        project
                                      )}_DISABLE`,
                                      theme.theme_mode
                                    )
                                  : getIcon(
                                      this.getCMSIconsUsingId(project),
                                      theme.theme_mode
                                    )
                              }
                              alt=""
                            />
                          </div>
                        </div>
                        <div
                          id={`project_details_content_${project.id}`}
                          className={classNames(
                            Style.all_project_card_content_holder
                          )}
                        >
                          <TextHighlighter
                            customClass={classNames(Style.all_project_title)}
                            text={_.capitalize(project.title)}
                            id={`project_details_${project.id}`}
                            disable={project.disable}
                          />
                          <div
                            id={`project_details_subtitle_${project.id}`}
                            className={classNames(Style.all_project_subtitle)}
                          >
                            {convertFormatedDate(project.timeStamp)}
                          </div>
                          <div
                            id={`project_details_decription_holder_${project.id}`}
                            className={classNames(
                              Style.all_project_decription_holder
                            )}
                          >
                            <p id={`project_details_decription_${project.id}`}>
                              {project.descritption}
                            </p>
                            {project.descritption === '' && (
                              <Button
                                id={`description_${project.id}`}
                                customClass={classNames(
                                  Style.all_project_add_description_btn
                                )}
                                text="Add Description"
                                alignIcon={Button.getPosition.LEFT}
                                icon={getColoredIcon(
                                  'ADD_DESCRIPTION',
                                  theme.theme_color
                                )}
                                variant={Button.getVariant.TEXT}
                                disable={
                                  project.disable &&
                                  project.projectcurrentState ===
                                    CurrenState.INCOMPLETE
                                }
                              />
                            )}
                          </div>
                          {project.projectcurrentState ===
                            CurrenState.INCOMPLETE && (
                            <div
                              className={classNames(
                                Style.infinite_slider
                                // Style.error_slider
                              )}
                            >
                              <div className={Style.line} />
                              <div
                                className={classNames(Style.subline, Style.inc)}
                              />
                              <div
                                className={classNames(Style.subline, Style.dec)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </Grid>
              )}
              {viewType === 'list' &&
                filteredList.map((project, index) => (
                  <Card
                    id={`project_details_list_view${project.id}`}
                    key={`project_details_list_view${project.id}`}
                    onClickListener={(e) => {
                      this.onClickSelectProjectListener(e, project);
                    }}
                    disable={project.disable}
                    selected={project.selected}
                    customClass={classNames(
                      Style.all_project_card_list,
                      project.disable ? Style.disable_grid_card : '',
                      project.selected ? Style.selected : ''
                    )}
                    header={
                      <div
                        id={`project_details_list_header${project.id}`}
                        className={classNames(
                          Style.all_project_card_list_header_container
                        )}
                      >
                        <CheckBox
                          id={`checkbox_${project.id}`}
                          name={_.capitalize(project.title)}
                          radius="50%"
                          icon={Tick}
                          checked={project.selected}
                          disable={project.disable}
                        />
                        <div
                          className={classNames(
                            Style.all_project_card_list_header_status
                          )}
                        >
                          <Tooltip
                            title={
                              project.status === SiteState.RUNNING
                                ? SiteState.RUNNING
                                : SiteState.STOP
                            }
                            placement={
                              index > 0
                                ? Tooltip.getPlacement.TOP
                                : Tooltip.getPlacement.RIGHT
                            }
                            disable={project.disable}
                          >
                            <span
                              className={classNames(
                                Style.all_project_card_tooltip,
                                Style[`${project.status}`],
                                project.disable ? Style.disable : ''
                              )}
                            />
                          </Tooltip>

                          {project.flag && (
                            <IconBox
                              id={`flag_${project.id}`}
                              customClass={classNames(Style.icon_gap)}
                              name={`${project.flag} Flagged`}
                              icon={this.handleFlagIcons(project)}
                              width="8px"
                            />
                          )}
                        </div>
                        <div
                          id={`project_details_img_content_${project.id}`}
                          className={classNames(
                            Style.all_project_list_icon_circle
                          )}
                        >
                          <img
                            id={`project_details_img_${project.id}`}
                            src={
                              project.disable
                                ? getIcon(
                                    `${this.getCMSIconsUsingId(
                                      project
                                    )}_DISABLE`,
                                    theme.theme_mode
                                  )
                                : getIcon(
                                    this.getCMSIconsUsingId(project),
                                    theme.theme_mode
                                  )
                            }
                            alt=""
                          />
                        </div>
                        <div
                          className={classNames(
                            Style.all_project_list_separator
                          )}
                        />
                        <div
                          id={`project_details_list_view_content_${project.id}`}
                          className={classNames(
                            Style.all_project_list_view_content
                          )}
                        >
                          <TextHighlighter
                            id={`project_details_${project.id}`}
                            customClass={classNames(Style.all_project_title)}
                            text={_.capitalize(project.title)}
                            disable={project.disable}
                          />
                          <div
                            id={`project_details_list_subtitle_${project.id}`}
                            className={classNames(Style.all_project_subtitle)}
                          >
                            {convertFormatedDate(project.timeStamp)}
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div
                      id={`project_details_decription_div${project.id}`}
                      className={classNames(Style.all_project_card_list_body)}
                    >
                      {project.descritption !== '' && (
                        <p id={`project_details_p_${project.id}`}>
                          {project.descritption}
                        </p>
                      )}

                      {project.descritption === '' && (
                        <div
                          className={classNames(
                            Style.all_project_list_description_container
                          )}
                        >
                          <Button
                            id={`description_${project.id}`}
                            customClass={classNames(
                              Style.all_project_add_description_btn
                            )}
                            text="Add Description"
                            alignIcon={Button.getPosition.LEFT}
                            icon={getColoredIcon(
                              'ADD_DESCRIPTION',
                              theme.theme_color
                            )}
                            variant={Button.getVariant.TEXT}
                            disable={
                              project.disable &&
                              project.projectcurrentState ===
                                CurrenState.INCOMPLETE
                            }
                          />
                        </div>
                      )}
                      {project.projectcurrentState ===
                        CurrenState.INCOMPLETE && (
                        <div className={classNames(Style.spinning_loader)} />
                      )}
                      <div
                        id={`project_details_content_${project.id}`}
                        className={classNames(
                          Style.all_project_list_more_content
                        )}
                      >
                        <IconBox
                          id={`more_${project.id}`}
                          name="More"
                          icon={
                            project.disable
                              ? getIcon('MORE_DISABLE', theme.theme_mode)
                              : getIcon('MORE', theme.theme_mode)
                          }
                          onClickListener={() => {
                            this.toggleDropdownMenu(
                              project.id,
                              project.descritption
                            );
                          }}
                          disable={project.disable}
                          tooltipPlacement="bottom"
                          tooltipDisable={project.disable}
                          tooltipInactive={menuId === project.id}
                          customClass={classNames(Style.all_project_more_icon)}
                        />
                        {menuId === project.id ? (
                          <Menu
                            id={`listview_card_menu_${project.id}`}
                            onRemoveMenu={() => {
                              this.toggleDropdownMenu(project.id);
                            }}
                            customClass={classNames(
                              Style.all_project_card_dropdown,
                              index > 2 && Style.top
                            )}
                            onClickItemListener={(selectedItem) => {
                              this.onClickProjectMenuitems(
                                selectedItem,
                                project
                              );
                            }}
                            onSubmitSelectedItem={(selectedItem) => {
                              this.onClickProjectMenuitems(
                                selectedItem,
                                project
                              );
                            }}
                            list={this.menuList}
                          >
                            <div
                              className={classNames(
                                Style.all_project_card_dropdown_footer
                              )}
                            >
                              <div
                                className={classNames(
                                  Style.all_project_flag_list
                                )}
                              >
                                <h4>Flag:</h4>
                                <div
                                  className={classNames(
                                    Style.all_project_card_dropdown_flag_set
                                  )}
                                >
                                  <IconBox
                                    customClass={classNames(
                                      Style.all_project_card_dropdown_clear_flag,
                                      Style.icon_flag_gap
                                    )}
                                    width="6px"
                                    radius="50%"
                                    icon={getIcon('CLEAR', theme.theme_mode)}
                                    variant={IconBox.getVariant.OUTLINED}
                                    name="Clear Flag"
                                    onClickListener={() => {
                                      this.onClickClearFlagListener(project);
                                    }}
                                  />
                                  {this.flagList.map((flag) => (
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
                                        this.onClickFlagListener(flag, project);
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className={classNames(Style.footer_btn)}>
                                <Button
                                  text={
                                    project.status === SiteState.RUNNING
                                      ? 'Stop Site'
                                      : 'Start Site'
                                  }
                                  onClickListener={() => {
                                    this.handleOnlineStatus(project);
                                  }}
                                  disable={project.loader}
                                  loader={
                                    project.loader
                                      ? getIcon(
                                          'BUTTON_LOADER',
                                          theme.theme_mode
                                        )
                                      : ''
                                  }
                                  icon={
                                    project.status === SiteState.RUNNING
                                      ? getIcon('STOP_SITE', theme.theme_mode)
                                      : getIcon('START_SITE', theme.theme_mode)
                                  }
                                  alignIcon={Button.getPosition.LEFT}
                                  customClass={classNames(
                                    Style.project_status_btn
                                  )}
                                />
                              </div>
                            </div>
                          </Menu>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <div
              className={classNames(
                Style.all_project_no_project_found_container
              )}
            >
              <IconBox
                tooltip={false}
                customClass={classNames(Style.all_project_not_found_icon)}
                icon={getIcon('NO_PROJECT_FOUND', theme.theme_mode)}
              />
              <h2>No project found</h2>
              <p
                className={classNames(
                  Style.all_project_no_project_found_paragraph
                )}
              >
                Try adjusting your search and filter
                <br />
                to find what you’re looking for.
              </p>
            </div>
          )}
        </div>
        {selectedList.length > 0 && !notification.show && (
          <BottomNotification
            floating
            // eslint-disable-next-line no-underscore-dangle
            // bottom={BottomNotification.bottom._15}
            icon={getIcon('UNSELECTED', theme.theme_mode)}
            placement={BottomNotification.getPlacement.FULL_WIDTH}
            alignContent={BottomNotification.getPlacement.LEFT}
            customClass={classNames(Style.all_project_bottom_notification)}
            onIconClickListener={this.unSelectCheckedProjects}
          >
            <div className={classNames(Style.all_project_notification)}>
              <span
                className={classNames(Style.all_project_notification_heading)}
              >
                {`${selectedList.length} ${
                  selectedList.length === 1 ? 'project' : 'projects'
                } selected`}
              </span>
              <div
                className={classNames(Style.all_project_notification_content)}
              >
                <IconBox
                  width="15px"
                  name="Delete"
                  icon={getIcon('DELETE', theme.theme_mode)}
                  variant={IconBox.getVariant.OUTLINED}
                  size={IconBox.Size.MEDIUM}
                  radius="4px"
                  onClickListener={this.deleteAllProjects}
                />
                <div
                  className={classNames(
                    Style.all_project_notification_more_options
                  )}
                >
                  <IconBox
                    customClass={classNames(Style.icon_mr)}
                    name="More"
                    icon={getIcon('MORE', theme.theme_mode)}
                    radius="4px"
                    onClickListener={() => {
                      this.toggleDropdownMenu(MenuId.MENU_BOTTOM_NOTIFICATION);
                    }}
                    tooltipInactive={menuId === MenuId.MENU_BOTTOM_NOTIFICATION}
                  />
                  {menuId === MenuId.MENU_BOTTOM_NOTIFICATION ? (
                    <Menu
                      onRemoveMenu={() => {
                        this.toggleDropdownMenu(
                          MenuId.MENU_BOTTOM_NOTIFICATION
                        );
                      }}
                      id="menu_notification"
                      customClass={classNames(
                        Style.all_project_bottom_notification_dropdown
                      )}
                      header={
                        <div
                          className={classNames(
                            Style.all_project_bottom_notification_dropdown_flag_list
                          )}
                        >
                          <h4>Select Flag:</h4>
                          <div
                            className={classNames(
                              Style.all_project_bottom_notification_dropdown_flag_set
                            )}
                          >
                            <IconBox
                              customClass={classNames(
                                Style.all_project_dropdown_clear_flag,
                                Style.icon_flag_gap
                              )}
                              width="6px"
                              radius="50%"
                              icon={getIcon('CLEAR', theme.theme_mode)}
                              variant={IconBox.getVariant.OUTLINED}
                              name="Clear Flag"
                              onClickListener={
                                this.clearFlagsForSelectedProjects
                              }
                            />
                            {this.flagList.map((flag) => (
                              <IconBox
                                customClass={classNames(Style.icon_flag_gap)}
                                tooltip
                                name={flag.name}
                                key={`ico_${flag.id}`}
                                width="10px"
                                icon={flag.icon}
                                onClickListener={() => {
                                  this.handleFlagsForSelectedProjects(flag);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      }
                      footer={
                        <div
                          className={classNames(
                            Style.all_project_bottom_notification_dropdown_footer
                          )}
                        >
                          <Button
                            customClass={classNames(
                              Style.site_start_stop_selected_button
                            )}
                            disable={this.validateMultipleStopSite()}
                            // text="Stop Seelected Site/Sites"
                            text={`Stop Selected ${
                              selectedList.length === 1 ? 'Site' : 'Sites'
                            }`}
                            loader={
                              selectedList.filter((each) => each.loader).length
                                ? getIcon('BUTTON_LOADER', theme.theme_mode)
                                : ''
                            }
                            icon={
                              this.validateMultipleStopSite()
                                ? getIcon('STOP_SITE_DISABLE', theme.theme_mode)
                                : getIcon('STOP_SITE', theme.theme_mode)
                              // If site is stopped add disable icon @kartik
                            }
                            alignIcon={Button.getPosition.LEFT}
                            onClickListener={() => {
                              this.handleMultipleOnlineStatus();
                            }}
                          />
                        </div>
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </BottomNotification>
        )}
        {/* <div className={loader ? classNames(Style.overlay) : ''} /> */}
        <div className={classNames(Style.all_project_fade_bottom)} />
        {/* Enable this notification when you want to filter flag */}
        {/* <BottomNotification
          floating
          // autoRemove
          // closeIcon={getIcon('INFORMATION', theme.theme_mode)}
          // autoRemove - enable for auto remove notifocation
          id="all_project_change_flag_notification"
          customClass={Style.all_project_flag_bottom_notification}
        >
          <div
            className={classNames(
              Style.all_project_flag_bottom_notification_content
            )}
          >
            <IconBox
              tooltip={false}
              icon={getIcon('INFORMATION', theme.theme_mode)}
            />
            <div
              className={classNames(
                Style.all_project_flag_bottom_notification_title
              )}
            >
              Please wait! we&apos;re changing flag status.
            </div>
          </div>
        </BottomNotification> */}
        {/* // Side notification demo to view uncomment the code */}
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    modalData: state.modal_attributes,
    projectsData: state.project_attributes,
    notification: state.notification_attributes,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(
    {
      ...ModalActions,
      ...ProjectActions,
      ...LocationActions,
      ...NotificationActions,
    },
    dispatch
  );
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AllProjects)
);
