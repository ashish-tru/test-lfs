/* eslint-disable no-underscore-dangle */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-did-update-set-state */
/* eslint-disable @typescript-eslint/naming-convention */
import React, { createRef, RefObject } from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import Analytics, {
  EVENT,
  ACTION,
  LABEL,
} from '@stackabl/core/render/analytics';
import _, { isArray } from 'lodash';
import {
  IconBox,
  Grid,
  Col,
  Button,
  Tab,
  TabPanel,
  Modal,
  Input,
  Tooltip,
  TextHighlighter,
  BottomNotification,
  SelectOptions,
  ButtonDropdown,
  ProgressBar,
  CheckBox,
  Switch,
} from '@stackabl/ui';
import { connect } from 'react-redux';
import { ipcRenderer, clipboard, remote, shell } from 'electron';
import fsExtra from 'fs-extra';
import electronlog from '@stackabl/core/shared/logger';
import request from '@stackabl/core/render/api';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import {
  syncChannel,
  removeSyncChannel,
} from '@stackabl/core/render/api/syncChannel';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import { nanoid } from 'nanoid';
import {
  HelperDependencies,
  HelperRole,
  HelpherName,
  SiteState,
} from '@stackabl/core/shared/dependencies';
import {
  SyncFile,
  ProcessStatus,
  SyncEmitObj,
  SYNC_CHANNEL_FINISH,
  SYNC_CHANNEL_RUNNING,
  SyncActionStatus,
  SYNC_CHANNEL_PUSH_PULL,
  PushPullStatus,
} from '@stackabl/website-push-pull/shared/constants';

import functionlist from '@stackabl/core/shared/constants/functionlist';
import db from '@stackabl/core/render/Database';
import {
  ActionType,
  ProjectsSchema,
  SyncActionFiles,
  WebSyncAction,
  WebsyncFile,
  WebSyncProject,
} from '@stackabl/core/render/Database/schema';
import {
  CurrenState,
  ProjectEnumType,
  runningSites,
  startStopsite,
} from '@stackabl/core/render/common';
import { utilities } from '@stackabl/core/shared/constants';
import utility from '@stackabl/core/shared/constants/utilities';
import Platform, {
  currentPlatform,
} from '@stackabl/core/shared/dependencies/platform';
import { Dispatcher } from '@stackabl/git';
import { Branch } from '@stackabl/git/src/models/branch';

import { AsyncLocalStorage } from 'async_hooks';
import Style from './index.scss';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import { InitialModalState } from '../../../reducers/modal';
import ModalActions, {
  DeleteProjectType,
  EditProjectDataType,
  SearchReplace,
  ImportDataType,
  WebsiteCloneDataType,
  AddSSHDataType,
  ModalDataType,
} from '../../../actions/modal';
import ProjectActions from '../../../actions/projects';
import { InitialProjectState, initialState } from '../../../reducers/projects';
import { IList } from '../../../utils/ListSchema';
import routes from '../../../constants/routes.json';
import { CMS, SearchFilter, THEME_COLOR } from '../../../constants/index';
import Tick from '../../../resources/Icons/Common/check.svg';
import { contentAdaptar } from '../../../utils/common';
import { getColoredIcon, getIcon } from '../../../utils/themes/icons';
import GitProcessManagement from '../../../utils/git/git-process-management';
import WebSync from '../../../utils/websync/webSync-process';
import {
  NotificationContentType,
  NotificationKeys,
} from '../../../actions/notification';
import displayNotification from '../../../utils/common/notification';

import TreeViewUI from './TreeView';

const variables = require('../../../global.scss');

const log = electronlog.scope('project-setting');

const { dialog } = remote;

const TabId = {
  WEBSITE_SETTINGS: 0,
  DATABASE: 1,
  UTILITIES: 2,
  CLONE_SETTING: 3,
};
enum Helpher {
  Version = 'version',
  name = 'name',
  role = 'role',
  port = 'port',
}

enum SyncFilesType {
  ModifiedFiles = 'modifiedFiles',
  IgnoredFiles = 'ignoredFiles',
}

enum WebsyncAction {
  SyncFilesPush = 'syncFilesPush',
  SyncFilesPull = 'syncFilesPull',
}

interface TabList {
  id: number;
  name: string;
  disable: boolean;
  icon: string;
  type: string;
  tag: string;
}

interface IselectBranch {
  id: number;
  name: string;
  type: string;
  protected: boolean;
  tag: string;
  selected: boolean;
}
interface StateProps {
  projectsData: InitialProjectState;
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface ListType {
  id: number;
  name: string;
  icon: string;
  selected: boolean;
}

interface DispatchProps {
  currentProject: (payload: IList) => void;
  getAllProjects: (payload: IList[]) => void;
  updateProject: (payload: IList) => void;
  addDescriptionModal: (payload: EditProjectDataType) => void;
  showSearchAndReplaceModal: (payload: SearchReplace) => void;
  showDeleteModal: (payload: DeleteProjectType) => void;
  showImportDatabaseModal: (payload: ImportDataType) => void;
  showWebsiteCloneModal: (payload: WebsiteCloneDataType) => void;
  showSSHKeys: (payload: AddSSHDataType) => void;
  showAttachExistingProjectModal: (payload: ModalDataType) => void;
}

interface LocationState {
  location: {
    state: ProjectsSchema;
  };
}
interface State {
  activeTabId: string;
  tabId: number;
  publicLinkShoModal: boolean;
  livelink: string;
  utilitylist: string[];
  syncshowModal: boolean;
  showBottomNotification: boolean;
  findText: string;
  currentProject: IList;
  replaceText: string;
  pasteToken: string;
  project: ProjectsSchema;
  rows: Array<Ilist>;
  incrementForId: number;
  numberOfInputs: number;
  inputValue: { [k: string]: string };
  is_disabled: Disable;
  Start: boolean;
  adminUrl: string;
  selectedmysqlVersion: string;
  phpVersionList: ListType[];
  mysqlversionList: ListType[];
  sslFlag: boolean;
  hotReload: boolean;
  selectedPhp: string;
  domainUrl: string;
  showDropdown: boolean;
  isSiteDomainCopied: boolean;
  isSitePathCopied: boolean;
  isRepositoryCopied: boolean;
  isDataBasePathCopied: boolean;
  isHostCopied: boolean;
  isPublicLinkCopied: boolean;
  viewWebsiteValue: string;
  renderViewWebsiteList: boolean;
  renderPhpVersionList: boolean;
  renderTerminalList: boolean;
  gitAccounts: string;
  allGit: string[];
  currentAccount: string;
  gitUsers: string;
  gitUserNames: string[];
  currentGitUser: string;
  downloadFilesTest: boolean;
  displaySyncActionPage: boolean;
  phpVersionsValue: string;
  isInstantReloadEnabled: boolean;
  isToggleSyncPushPull: boolean;
  isDatabaseChecked: boolean;
  isBackupChecked: boolean;
  isCheckedAllFiles: boolean;
  isExpanded: boolean;
  renderAttachProjectDropdownList: boolean;
  gitBranches: Branch[];
  currentBranch: string;
}

interface Ilist {
  id: number;
}
enum Disable {
  START_STOP = 'startStop',
  PUBLIC_LINK = 'PublicLink',
  CERT_ENABLE_DISABLE = 'certEnableDisable',
  IMPORT = 'import',
  EXPORT = 'export',
  DEFAUTL = '',
  CHECK_CONFIGURATION = 'configuration',
  CODE_SERVER = 'codeServer',
  SWITCH_PHP = 'switchphp',
  WEBCLONE = 'Websync',
  HOTRELOAD = 'hotreload',
}

type Props = StateProps & RouteComponentProps & DispatchProps & LocationState;

class ProjectSettings extends React.Component<Props, State> {
  dispatcher: Dispatcher = Dispatcher.getInstance();

  db!: db;

  gitPercentRef: RefObject<HTMLParagraphElement> = createRef();

  terminalList: ListType[] = [
    { id: 0, name: 'cmd', icon: '', selected: false },
    { id: 1, name: 'bash', icon: '', selected: false },
  ];

  ViewWebsiteList: ListType[] = [
    { id: 0, name: 'User', icon: '', selected: false },
    { id: 1, name: 'Admin ', icon: '', selected: false },
  ];

  phpVersionsList: ListType[] = [
    { id: 0, name: '7.2', icon: '', selected: false },
    { id: 2, name: '7.3', icon: '', selected: false },
    { id: 3, name: '7.4', icon: '', selected: false },
  ];

  attachProjectList: ListType[] = [
    { id: 0, name: 'Create new project', icon: '', selected: false },
    { id: 1, name: 'Select from existing', icon: '', selected: false },
  ];

  tabList: TabList[] = [
    {
      id: 0,
      name: 'Website Settings',
      disable: false,
      icon: '',
      type: '',
      tag: '',
    },
    {
      id: 1,
      name: 'Database',
      disable: false,
      icon: '',
      type: '',
      tag: '',
    },
    {
      id: 2,
      name: 'Utilities',
      disable: false,
      icon: '',
      type: '',
      tag: '',
    },
    {
      id: 3,
      name: 'Sync',
      disable: false,
      icon: '',
      type: '',
      tag: 'BETA',
    },
  ];

  defaultWebCloneData = ['Fetching updates...'];

  syncAction: WebSyncAction = {
    webCloneChannelData: this.defaultWebCloneData,
    webSyncFilesCount: '',
    isSyncActionPull: true,
    pushFilesBackup: false,
    pullFilesBackup: false,
    pushDatabase: false,
    pullDatabase: false,
    displayNoFileScreen: false,
    pushFiles: {
      modifiedFiles: [],
      ignoredFiles: [],
      isAllModifiedSelected: false,
      isAllIgnoredSelected: false,
    },
    pullFiles: {
      modifiedFiles: [],
      ignoredFiles: [],
      isAllModifiedSelected: false,
      isAllIgnoredSelected: false,
    },
  };

  constructor(props: Props) {
    super(props);
    const {
      location: { state },
      projectsData: { currentProject },
    } = props;

    /**
     * Need To discuss how to send the value
     * @resolved
     *
     * */
    const project: ProjectsSchema = { ...state };
    const localAccounts = localStorage.getItem('gitUsers');
    this.state = {
      tabId: TabId.WEBSITE_SETTINGS,
      activeTabId: '',
      currentProject, // redux props
      project, // state push from setting up site
      livelink: '',
      utilitylist: [],
      publicLinkShoModal: false,
      adminUrl: '',
      syncshowModal: false,
      findText: '',
      replaceText: '',
      pasteToken: '',
      showBottomNotification: false,
      rows: [{ id: 1 }],
      incrementForId: 1,
      numberOfInputs: 2,
      selectedPhp: '',
      selectedmysqlVersion: '',
      phpVersionList: [],
      mysqlversionList: [],
      viewWebsiteValue: 'User ',
      inputValue: {},
      is_disabled: Disable.DEFAUTL,
      Start: false, // project state
      sslFlag: false, // check ssl is disable or enabled
      hotReload: false, // check whether hot reloaded status-started/stopped
      domainUrl: '',
      showDropdown: false,
      isSiteDomainCopied: false,
      isSitePathCopied: false,
      isRepositoryCopied: false,
      isDataBasePathCopied: false,
      isHostCopied: false,
      isPublicLinkCopied: false,
      renderTerminalList: false,
      renderPhpVersionList: false,
      phpVersionsValue: '7.2',
      isInstantReloadEnabled: false,
      renderViewWebsiteList: false,
      gitAccounts: localStorage.getItem('gitUsers') || '',
      allGit: [],
      currentAccount: '',
      gitUsers: localStorage.getItem('gitUsers') || '',
      gitUserNames: [],
      currentGitUser: localStorage.getItem('currentUser') || '',
      downloadFilesTest: false,
      displaySyncActionPage: false,
      isToggleSyncPushPull: false,
      isDatabaseChecked: false,
      isBackupChecked: false,
      isCheckedAllFiles: false,
      isExpanded: false,
      renderAttachProjectDropdownList: false,
      gitBranches: [],
      currentBranch: '',
    };
    this.handleChange = this.handleChange.bind(this);
    const {
      gitAccounts,
      project: { git_login },
    } = this.state;

    this.setState({ currentAccount: git_login });
    if (gitAccounts.length) {
      const rawAccounts = JSON.parse(gitAccounts);
      this.setState({ allGit: rawAccounts });
    }
  }

  componentDidMount() {
    Analytics.getInstance().screenView('Project Settings');
    this.setState({ is_disabled: Disable.CHECK_CONFIGURATION });

    const {
      currentProject: { title, subTitle },
    } = this.state; // reading from store
    const WebSyncInstance = WebSync.getInstance();
    const gitInstance = GitProcessManagement.getInstance();
    gitInstance.subscribe({
      id: subTitle,
      name: title,
      ref: this.gitPercentRef,
    });
    WebSyncInstance.subscribe({
      id: subTitle,
      name: title,
      ref: this.gitPercentRef,
    });
    this.init();
  }

  componentDidUpdate() {
    // log.info('-----------componentDidUpdate--------');
    const {
      showBottomNotification,
      is_disabled,
      project,
      currentProject: stateCurrentProject, // current redux props stored in the state
    } = this.state;

    const {
      projectsData: { currentProject }, // redux props
      projectsData: {
        currentProject: { showImportDbModal },
      },
      currentProject: currProject,
      showImportDatabaseModal,
      history,
    } = this.props;

    if (
      project.projectType === ProjectEnumType.CLONEWEBSITE &&
      project.webSync?.pushPullStatus === PushPullStatus.RUNNING
    ) {
      history.push({
        pathname: routes.DASHBOARD + routes.REDIRECT,
        state: { ...project, meta: [...project.meta] },
      });
    }
    if (showImportDbModal) {
      showImportDatabaseModal({
        show: true,
        yes: false,
        no: false,
        project: currentProject,
      });
      currProject({
        ...currentProject,
        showImportDbModal: false,
      });
      // this.updateDbForImportDbModal();
    }

    //  checking for any change
    if (!_.isEqual(stateCurrentProject, currentProject)) {
      // change in current project
      this.setState({ currentProject }, () => {
        if (currentProject.subTitle !== stateCurrentProject.subTitle) {
          log.info('subtitile componentdidupdate');
          this.setState({
            is_disabled: Disable.CHECK_CONFIGURATION,
            viewWebsiteValue: 'Admin',
          });
          this.init();
        }
        if (currentProject.subTitle === stateCurrentProject.subTitle) {
          if (currentProject.status !== stateCurrentProject.status) {
            if (currentProject.status === SiteState.RUNNING) {
              this.setState({ is_disabled: Disable.CHECK_CONFIGURATION });
              log.info('subtitile componentdidupdate');
              this.init();
            } else {
              this.setState({ Start: false });
            }
          } else if (
            currentProject.projectcurrentState !==
            stateCurrentProject.projectcurrentState
          ) {
            this.handletab();
          }
        }
      });

      // log.info('Changing project because current project changed');
    } // else {
    //   // log.info('Skip the componentDidUpdate check');
    // }

    // handling loader when site started or stopped from hoc sidebar
    if (
      stateCurrentProject.subTitle === currentProject.subTitle &&
      stateCurrentProject.loader !== currentProject.loader
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        is_disabled: currentProject.loader
          ? Disable.START_STOP
          : Disable.DEFAUTL,
      });
    }
    // if no bottom notification is shown then showBottomNotification is false so that next time bottom notification is shown only  clicking overlay
    if (showBottomNotification && is_disabled === Disable.DEFAUTL) {
      this.setState({ showBottomNotification: false });
    }
  }

  componentWillUnmount() {
    const gitInstance = GitProcessManagement.getInstance();
    gitInstance.unsubscribe();
    WebSync.getInstance().unsubscribe();
  }

  /**
   * method to return phpmyadmin url
   */

  getPhpMyAdmin = () => {
    return `${this.getMachineIp('viewOnly')}/phpmyadmin/`;
  };

  // eslint-disable-next-line react/sort-comp
  fetchRepo = async () => {
    const {
      project: { git_clone_url, git_branch },
      currentGitUser,
    } = this.state;
    log.info('Git  git_clone_url ', git_clone_url, git_branch);
    await this.dispatcher.fetchRepo(
      git_clone_url,
      this.getFileManagerPath(),
      git_branch,
      currentGitUser,
      (progressData: { value: number }) => {
        console.log('Progress data from fetch is ', progressData);
      },
      (err: Error) => {
        log.error('Error in cloning');
        log.error(err);
        ipcRenderer.send('notification', {
          title: 'Error',
          body: err.message,
        });
        //  throw err;
        // let gitError = new Error('Git authentication failed.')
        // this.props.currentProject({...initialState.currentProject});
        //   history.push({
        //     pathname: `${routes.LANDING}${routes.ERROR}`,
        //     state: {
        //       error: gitError,
        //       origin: routes.SETTING_UP_SITE,
        //       parent: routes.DASHBOARD,
        //     },
        //   });
        //   return;
        // log.error(err);
      }
    );
  };

  discard = async () => {
    try {
      await this.dispatcher.discardChanges(this.getFileManagerPath());
    } catch (e) {
      log.info('Error in discard ', e);
    }
  };

  publishRepo = async () => {
    try {
      const {
        currentProject: { title, descritption },
        currentGitUser,
        project,
      } = this.state;
      const res = await this.dispatcher.publishRepo(
        this.getFileManagerPath(),
        title,
        descritption,
        currentGitUser
      );
      if (res) {
        this.updateDatabase({ ...project, git_login: currentGitUser });
        ipcRenderer.send('notification', {
          title: 'Repo created',
          body: 'github repository created',
        });
      }
    } catch (e) {
      log.info('Error in discard ', e);
    }
  };

  showChanges = async () => {
    try {
      const changes = await this.dispatcher.showChanges(
        this.getFileManagerPath()
      );
      console.log('Changes files ', changes);
    } catch (e) {
      log.info('Error in discard ', e);
    }
  };

  pullRepo = async () => {
    const {
      project: { git_clone_url },
      currentGitUser,
    } = this.state;
    try {
      await this.dispatcher.pullRepo(
        git_clone_url,
        this.getFileManagerPath(),
        currentGitUser
      );
    } catch (e) {
      log.info('Error in pull', e.message);
      ipcRenderer.send('notification', {
        title: 'Error',
        body: e.message,
      });
    }
  };

  commit = async () => {
    const message = 'This is commit message';
    const result = await this.dispatcher.commit(
      this.getFileManagerPath(),
      message
    );

    log.info('result in prject settings ', result);
  };

  push = async () => {
    const {
      project: { git_clone_url, git_branch },
      currentGitUser,
    } = this.state;

    const result = await this.dispatcher.pushRepo(
      git_clone_url,
      this.getFileManagerPath(),
      git_branch,
      currentGitUser
    );
  };

  checkout = async () => {
    try {
      debugger;
      const a = await this.dispatcher.checkout(
        this.getFileManagerPath(),
        'drual-b'
      );
      log.info(a);
    } catch (e) {
      console.log('Error in chekcout ', e);
    }
  };

  createBranch = async () => {
    try {
      await this.dispatcher.createBranch(
        this.getFileManagerPath(),
        'drual-b',
        'master'
      );
    } catch (e) {
      console.log('Error in chekcout ', e);
    }
  };

  /**
   * @description Get the data from lokijs
   * @param container_name {string}
   * @param title {string}
   */

  /**
   * @description Get the data from lokijs
   * @param container_name {string}
   * @param title {string}
   */
  getProjectFromDB = async (container_name: string, title: string) => {
    const metaDb = await db.getInstance();
    if (!this.db) {
      log.info('log is db in condition');
      this.db = metaDb;
    }
    const project = metaDb.getProjectByParam({
      name: title,
      container_name,
    });
    return project;
  };

  /**
   * @method for  return utilites list for current site
   */

  getUtilitiesList = async () => {
    try {
      const {
        currentProject: { type },
      } = this.state;
      const result: string[] = await request(EndPoint.SERVICE_FUNCTION, type, [
        functionlist.UTILITIES_LIST,
      ]);
      this.setState({ utilitylist: [...result] });
    } catch (Err) {
      log.error('error in getting utilities list');
    }
  };

  /**
   * @description fetch available versions of php and mysql
   * @param cms -wordpress ,joomla
   */
  getHelpherVersions = async (selectedCms: RegisterPackages) => {
    const helphers: HelperDependencies[] = await request(
      EndPoint.SERVICE_FUNCTION,
      selectedCms,
      [functionlist.HeLPHER_LIST]
    );
    const HelpersArray = helphers;

    const mysqlList = HelpersArray.filter(
      (each: HelperDependencies) => each.role === HelperRole.DATABASE
    ).map((each: HelperDependencies, index: number) => ({
      name: each.version,
      id: index,
      icon: '',
      selected:
        each.version ===
        this.getCurrentVersion(HelperRole.DATABASE, Helpher.Version),
    }));

    const phpVersions = HelpersArray.filter(
      (each: HelperDependencies) => each.role === HelperRole.SCRIPT
    ).map((each: HelperDependencies, index: number) => ({
      name: each.version,
      id: index,
      icon: '',
      selected:
        this.getCurrentVersion(HelperRole.SCRIPT, Helpher.Version) ===
        each.version,
    }));
    this.setState({
      selectedPhp:
        this.getCurrentVersion(HelperRole.SCRIPT, Helpher.Version) || '',
      selectedmysqlVersion:
        this.getCurrentVersion(HelperRole.DATABASE, Helpher.Version) || '',
      phpVersionList: phpVersions,
      mysqlversionList: mysqlList,
    });
    return true;
  };

  /**
   * @description Get the data from ProjectManagement Instance
   * @return  obj
   * {
      state: SiteState;
      domainUrl: string;
      ssl: number;
      http: number;
      }
   */
  getProjectSettings = async () => {
    const {
      currentProject: { title, subTitle },
      project: { webSync },
    } = this.state;
    log.info('webSync', webSync);
    const project = await this.getProjectFromDB(subTitle, title);
    const obj: {
      state: SiteState;
      domainUrl: string;
      ssl: number;
      http: number;
      adminUrl: string;
    } = await request(EndPoint.SERVICE_FUNCTION, project.type, [
      functionlist.GET_STATUS,
      [subTitle, title],
    ]);
    log.info('getProjectSettings', obj);
    return obj;
  };

  /**
   *  @description get cms version from main process
   */
  getVersion = async () => {
    const {
      currentProject: { title, subTitle },
      project,
    } = this.state;
    try {
      const result: string = await request(
        EndPoint.SERVICE_FUNCTION,
        RegisterPackages.skip,
        [functionlist.GETVERSION, [subTitle, title]]
      );
      log.info(result.toString(), 'getVersion');
      this.updateDatabase({ ...project, cms_version: result });
    } catch (Err) {
      log.warn('getVersion error', Err);
    }
  };

  /**
   * @description method to open site database
   */

  handleManageDatabase = () => {
    const { Start } = this.state;
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      ACTION.Database,
      LABEL.Utility
    );
    if (Start) {
      shell.openExternal(this.getPhpMyAdmin());
    } else {
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to view admin.`,
      // });
      const payload: NotificationContentType = {
        id: 'ADMIN',
        message: `Please start the site to view admin.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  /**
   * @description open exported database directory
   */
  getExportedDatabasePath = () => {
    if (this.checkPath(this.getDatabasePath())) {
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please export database to open file.`,
      // });
      const payload: NotificationContentType = {
        id: 'DATABASE',
        message: `Please export database to open file.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    } else {
      shell.openItem(this.getDatabasePath());
    }
  };

  switchGitAccount = (event) => {
    const { project } = this.state;
    // event.persist();
    const newUser = event.target.value;
    localStorage.setItem('currentUser', newUser);
    this.updateDatabase({ ...project, git_login: newUser });
    this.setState({ currentGitUser: newUser });
  };

  /**
   * @description method to show current helpher version
   * @param role
   * @param key
   */
  getCurrentVersion(role: HelperRole, key: Helpher) {
    const { project } = this.state;

    const helper = project.meta.find((each) => each.role === role);
    return helper ? helper[key]?.toString() : '';
  }

  phpPortJsx = () => {
    const {
      Start,
      project: { meta },
    } = this.state;

    if (Start) {
      return (
        <>
          {meta.map((each) => (
            <Grid
              key={each.name}
              variant={Grid.getVariant.FLEX}
              placement={Grid.Placement.MIDDLE}
              customClass={classNames(Style.project_setting_list)}
            >
              <Col
                xs={3}
                md={3}
                lg={3}
                customClass={Style.project_settings_col}
              >
                <strong> {each.name} port: </strong>
              </Col>
              <Col>{this.getCurrentVersion(each.role!, Helpher.port)}</Col>
            </Grid>
          ))}
        </>
      );
    }

    return null;
  };

  /**
   * @description method to check path exists
   * @param path
   */

  checkPath = (path: string) => {
    try {
      log.info(!fsExtra.pathExistsSync(path));
      return !fsExtra.pathExistsSync(path);
    } catch (err) {
      return false;
    }
  };

  openShell = (path: string) => {
    shell.openExternal(path);
  };

  /**
   * @description Check Ngrok is running or not
   * first check the instance of ngrok exist in package, if exist then
   * get the public link throught GET_LIVELINK
   * the function also handle(s) that any case of any error return empty string.
   * @returns string
   */
  ngrokStatus = async () => {
    const {
      currentProject: { title, subTitle },
    } = this.state;

    try {
      const ngrokInstance = await request(
        EndPoint.UTILITY_FUNCTION,
        RegisterPackages.NGROK,
        [functionlist.GET_STATUS, [subTitle, title]]
      );

      let ngrokLink = '';
      if (ngrokInstance) {
        ngrokLink = await request(
          EndPoint.UTILITY_FUNCTION,
          RegisterPackages.NGROK,
          [functionlist.GET_LIVELINK, [subTitle, title]]
        );
      }
      log.error('NgrokLink ', ngrokLink);
      return ngrokLink;
    } catch (e) {
      log.error('Ngrok Handles Error(Ignore this error) ', e.message);
      return '';
    }
  };

  checkBash = async () => {
    try {
      const result: boolean = await request(
        EndPoint.UTILITY_FUNCTION,
        RegisterPackages.skip,
        [functionlist.CHECK_BASH, ['sd', 'sd']]
      );
      if (!result) {
        this.terminalList = this.terminalList.filter(
          (each) => each.name !== 'bash'
        );
      }
    } catch (err) {
      log.info(err, 'checkbash');
    }
  };

  /**
   * @description common function used in calling any utility method
   * @param utilityname
   */

  commonFunction = async (utilityname: utility) => {
    switch (utilityname) {
      case utility.NGROK:
        await this.ngrokStatus();
        break;
      case utility.CODE_SERVER:
        await this.handleCodeServer();
        break;
      case utilities.FINDREPLACE:
        this.showSearchAndReplaceModal();
        break;
      case utilities.EXPORTDATABASE:
        await this.handleExportDatabase();
        break;
      case utilities.IMPORTDATABASE:
        await this.handleImportDatabase();
        break;
      default:
        log.error('Invalid choice in commonFunction');
    }
  };

  sshDBActions = async () => {
    const metaDB = await db.getInstance();
    const allKeys = await metaDB.getAllKeysName();
    log.info('allKeys', allKeys);
    const pubKey = await metaDB.getSSHKey('sshA', true);
    log.info('pubKey', pubKey);
  };

  /**
   *@description method to open WebsiteCloneStepsModal
   */
  showWebsiteCloneStepsModal = () => {
    const { showWebsiteCloneModal, modalData } = this.props;
    const { project } = this.state;
    showWebsiteCloneModal({
      ...modalData.website_clone_data,
      show: true,
      project: JSON.parse(JSON.stringify(project)),
    });
  };

  /**
   *@description method to open dropdown to show attach project options
   */
  openDropdownToAttachProject = (item: ListType) => {
    const sortList: ListType[] = this.attachProjectList.map(
      (attachProject: ListType) => {
        let el = attachProject;
        el = { ...attachProject, selected: attachProject.name === item.name };
        return el;
      }
    );

    this.attachProjectList = sortList;
    this.showModalForSelectedOption(item.name);
  };

  showModalForSelectedOption = (name: string) => {
    const { showAttachExistingProjectModal, modalData } = this.props;

    switch (name) {
      case 'Create new project':
        this.showWebsiteCloneStepsModal();
        break;
      case 'Select from existing':
        showAttachExistingProjectModal({
          ...modalData.attach_existing_project,
          show: !modalData.attach_existing_project.show,
        });
        break;

      default:
        break;
    }
  };

  isAttachProjectOptionRemoved = (islistRemoved: boolean) => {
    this.setState({
      renderAttachProjectDropdownList: islistRemoved,
    });
  };

  /**
   *@description method to open search replace modal
   */
  showSearchAndReplaceModal = () => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      ACTION.Find,
      LABEL.Utility
    );
    const {
      showSearchAndReplaceModal,
      projectsData: { currentProject },
      modalData,
    } = this.props;
    const { Start } = this.state;
    if (Start) {
      showSearchAndReplaceModal({
        ...modalData.logOut_data,
        yes: false,
        no: false,
        project: currentProject,
        show: !modalData.logOut_data.show,
        cancel_btn_text: 'Cancel',
      });
    } else {
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to find and replace text in database.`,
      // });
      const payload: NotificationContentType = {
        id: 'DATABASE',
        message: `Please start the site to find and replace text in database.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  showSSHModal = () => {
    const { showSSHKeys, modalData } = this.props;
    const { Start } = this.state;
    // if (Start) {
    showSSHKeys({
      ...modalData.ssh_key_data,
      yes: false,
      no: false,
      removeSSHOption: '',
      show: !modalData.ssh_key_data.show,
    });
    // }
  };
  /**
   * @description - Copies link to clipboard based on param(the type of link user click
   *                 on to copy )
   * @param {} -
   * @return { string } - Copies desired link to clipboard
   */

  copyLink = (param: string): void => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      `${param} ${ACTION.Copy}`,
      LABEL.Unique
    );
    const {
      livelink,
      project: { git_clone_url },
    } = this.state;
    if (param === 'publicLink') {
      if (livelink) {
        this.setState({ isPublicLinkCopied: true });
        clipboard.writeText(livelink);
      }
    } else if (param === 'siteDomain') {
      this.setState({ isSiteDomainCopied: true });
      clipboard.writeText(this.getMachineIp('viewOnly'));
    } else if (param === 'host') {
      this.setState({ isHostCopied: true });
      clipboard.writeText(this.getPhpMyAdmin());
    } else if (param === 'sitePath') {
      log.info('Site path copied');
      this.setState({ isSitePathCopied: true });
      clipboard.writeText(this.getFileManagerPath());
    } else if (param === 'databasePath') {
      this.setState({ isDataBasePathCopied: true });
      clipboard.writeText(this.getDatabasePath());
    } else if (param === 'repository') {
      this.setState({ isRepositoryCopied: true });
      clipboard.writeText(git_clone_url);
    }
  };

  /**
   * @description method to show description modal
   * @param i
   */

  showAddDescriptionModal = (i: IList) => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      ACTION.Description,
      LABEL.Ui
    );
    const { addDescriptionModal } = this.props;
    addDescriptionModal({ show: true, project: i });
  };

  /**
   * method to change php current version
   * @param name
   */
  // async startMicroService() {
  //   const {
  //     currentProject: { title },
  //     currentProject: currentproject,
  //     project: { container_name, type, meta, credential, $loki, description }, // reads the project obj from database
  //     sslFlag, // ssl flag value already initialised in init function
  //   } = this.state;
  //   const { updateProject } = this.props;
  //   updateProject({ ...currentproject, loader: true }); // setting loader in button
  //   this.setState({ is_disabled: Disable.START_STOP });
  //   const args: ProjectsSchema = await request(EndPoint.SERVICE_START, type, [
  //     {
  //       projectName: title,
  //       projectEmail: credential.email,
  //       projectPass: credential.password,
  //       projectUsername: credential.username,
  //       versionValue: meta.find((each) => each.role === HelperRole.SCRIPT)!
  //         .version,
  //       databaseValue: meta.find((each) => each.role === HelperRole.DATABASE)!
  //         .version,
  //       description,
  //       ssl: sslFlag,
  //       id: container_name,
  //     },
  //   ]);

  //   let obj = await this.getProjectSettings();

  //   this.setState(
  //     (prevState) => ({
  //       Start: !prevState.Start,
  //       project: args,
  //       is_disabled: Disable.DEFAUTL,
  //       domainUrl: obj.domainUrl,
  //     }),
  //     () => {
  //       updateProject({
  //         ...currentproject,
  //         loader: false,
  //         status: SiteState.RUNNING,
  //       });
  //       this.updateDatabase({
  //         ...this.state.project,
  //         ...args,
  //         $loki,
  //       });
  //     }
  //   );
  // }

  changePhpVersion = async (name: string) => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      ACTION.Php,
      `PHP:- ${name}`
    );
    const {
      phpVersionList,
      currentProject: { type, title, subTitle },
      project,
    } = this.state;
    const list = phpVersionList.map((each) => {
      return { ...each, selected: each.name === name };
    });

    const dependency: HelperDependencies = {
      role: HelperRole.SCRIPT,
      name: HelpherName.PHP,
      version: name,
    };
    this.setState(
      {
        selectedPhp: name,
        is_disabled: Disable.SWITCH_PHP,
        phpVersionList: list,
      },
      async () => {
        try {
          const args = await request(EndPoint.SWITCH_PHP, type, [
            functionlist.SWITCH_PHP,
            [subTitle, title],
            [dependency],
          ]);
          log.info(args, 'changephpversion');

          this.setState({ livelink: '' });
          this.updateDatabase({ ...project, meta: args });
          // ipcRenderer.send('notification', {
          //   title: 'Success',
          //   body: `PHP version swapped.`,
          // });
          const payload: NotificationContentType = {
            id: 'PHP',
            message: `PHP version swapped.`,
            type: NotificationKeys.ADD_NOTIFICATION,
            title: 'Success',
          };
          displayNotification(payload);
        } catch (err) {
          // ipcRenderer.send('notification', {
          //   title: 'Failed',
          //   body: `Failed to Swap PHP version.`,
          // });
          const payload: NotificationContentType = {
            id: 'PHP',
            message: `Failed to Swap PHP version.`,
            type: NotificationKeys.ADD_NOTIFICATION,
            title: 'Failed',
          };
          log.info(err);
        }
        this.setState({ is_disabled: Disable.DEFAUTL });
      }
    );
  };

  /**
   *@description method to start stop site
   */
  onClickStartStopSite = async () => {
    const {
      Start,
      currentProject: { title },
      project: {
        container_name,
        type,
        meta,
        credential,
        projectType,
        projectcurrentState,
        $loki,
        location,
        description,
      }, // reads the project obj from database
      sslFlag, // ssl flag value already initialised in init function
      isInstantReloadEnabled,
    } = this.state;
    const {
      history,
      updateProject,
      projectsData: { currentProject },
      currentProject: currentProjectDispatch,
    } = this.props;
    updateProject({
      ...currentProject,
      loader: true,
    });
    try {
      const inputObj = {
        projectName: title,
        projectEmail: credential.email,
        projectPass: credential.password,
        projectType,
        projectcurrentState,
        projectUsername: credential.username,
        versionValue: meta.find((each) => each.role === HelperRole.SCRIPT)!
          .version,
        databaseValue: meta.find((each) => each.role === HelperRole.DATABASE)!
          .version,
        type,
        location,
        addDescription: description,
        ssl: sslFlag,
        id: container_name,
        isInstantReloadEnabled,
      };
      this.setState({ is_disabled: Disable.START_STOP });
      const args = await startStopsite(inputObj);
      if (args.status === SiteState.RUNNING) {
        Analytics.getInstance().eventTracking(
          EVENT.Project,
          ACTION.Start,
          LABEL.Unique
        );
        const obj1: {
          state: SiteState;
          domainUrl: string;
          ssl: number;
          http: number;
          adminUrl: string;
        } = await this.getProjectSettings();
        this.setState(
          (prevState) => ({
            Start: !prevState.Start,
            is_disabled: Disable.DEFAUTL,
            domainUrl: obj1.domainUrl,
            adminUrl: obj1.adminUrl,
          }),
          () => {
            updateProject({
              ...currentProject,
              loader: false,
              status: SiteState.RUNNING,
            });
            currentProjectDispatch({
              ...currentProject,
              loader: false,
              status: SiteState.RUNNING,
            });
            const { project } = this.state;
            this.updateDatabase({
              ...project,
              $loki,
            });
          }
        );
        // ipcRenderer.send('notification', {
        //   title: 'All Done',
        //   body: `Your site is ready!`,
        // });
        const payload: NotificationContentType = {
          id: 'WEBSITE',
          message: `Your site is ready!`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'All Done',
        };
        displayNotification(payload);
      } else {
        Analytics.getInstance().eventTracking(
          EVENT.Project,
          ACTION.Stop,
          LABEL.Unique
        );
        this.setState({ Start: false, livelink: '', sslFlag });
        currentProjectDispatch({
          ...currentProject,
          loader: false,
          status: SiteState.STOP,
        });
        updateProject({
          ...currentProject,
          loader: false,
          status: SiteState.STOP,
        });
        // ipcRenderer.send('notification', {
        //   title: 'All Done',
        //   body: `The site has stopped.`,
        // });
        const payload: NotificationContentType = {
          id: 'WEBSITE',
          message: `The site has stoped!`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'All Done',
        };
        displayNotification(payload);
      }

      this.setState({ is_disabled: Disable.DEFAUTL });
    } catch (ERR) {
      this.setState({ is_disabled: Disable.DEFAUTL });

      updateProject({
        ...currentProject,
        loader: false,
        status: SiteState.STOP,
      });

      // ipcRenderer.send('notification', {
      //   title: 'Failed',
      //   body: `Failed to ${Start ? 'stop' : 'start'}.`,
      // });
      const payload: NotificationContentType = {
        id: 'WEBSITE',
        message: `Failed to ${Start ? 'stop' : 'start'}.`,
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

  /**
   * @description Enable disable the ngrok link
   * if project is not running then show notification to start the project
   * if livelink is empty then start the ngrok
   * else stop the ngrok instance
   * throw the error
   */
  enableDisableLiveLink = async () => {
    const {
      currentProject: { title, subTitle },
      Start,
      livelink,
    } = this.state;
    const { history } = this.props;
    this.setState({ is_disabled: Disable.PUBLIC_LINK });
    if (Start) {
      try {
        if (!livelink) {
          Analytics.getInstance().eventTracking(
            EVENT.Project,
            ACTION.Link,
            LABEL.Enable
          );
          await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.NGROK, [
            functionlist.PROVISION,
            [subTitle, title],
          ]);
          await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.NGROK, [
            functionlist.POST_PROVISON,
            [subTitle, title],
          ]);
          const liveLink = await request(
            EndPoint.UTILITY_FUNCTION,
            RegisterPackages.NGROK,
            [functionlist.GET_LIVELINK, [subTitle, title]]
          );
          this.setState({ livelink: liveLink, is_disabled: Disable.DEFAUTL });

          log.info('Live link: ', liveLink);
        } else {
          Analytics.getInstance().eventTracking(
            EVENT.Project,
            ACTION.Link,
            LABEL.Disable
          );
          await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.NGROK, [
            functionlist.STOP_PROVISION,
            [subTitle, title],
          ]);
          this.setState({ is_disabled: Disable.DEFAUTL, livelink: '' });
        }
      } catch (ERR) {
        this.setState({ is_disabled: Disable.DEFAUTL });
        history.push({
          pathname: `${routes.LANDING}${routes.ERROR}`,
          state: {
            error: ERR,
            origin: routes.PROJECT_SETTINGS,
            parent: routes.DASHBOARD,
          },
        });
      }
    } else {
      this.setState({ is_disabled: Disable.DEFAUTL });
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to enable public link.`,
      // });
      const payload: NotificationContentType = {
        id: 'PUBLIC LINK',
        message: `Please start the site to enable public link.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  /**
   * @description method for returnig site domain
   * @param param
   */
  getMachineIp = (param = ''): string => {
    const { domainUrl } = this.state;
    const site = domainUrl;
    if (!param) {
      return `${site}?purge_cache=${Math.floor(Math.random() * 100)}`;
    }

    return site;
  };

  /**
   * @description open website on click view website as user
   */
  openWebsite = async () => {
    const { Start } = this.state;
    if (Start) {
      await request(EndPoint.OPEN_BROWSER, RegisterPackages.skip, [
        this.getMachineIp(),
      ]);
    } else {
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to view website.`,
      // });
      const payload: NotificationContentType = {
        id: 'WEBSITE',
        message: `Please start the site to view website.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  /**
   * @description toggle hot reload
   * @param ssl {boolean} start/stop hot reload
   */

  toggleHotReload = () => {
    this.setState((prevState) => ({ hotReload: !prevState.hotReload }));
  };

  /**
   * @description toggle ssl
   * @param ssl {boolean} enable or disable ssl
   */
  toggleSSL = async (ssl: boolean) => {
    const { project, Start, isInstantReloadEnabled } = this.state;
    this.setState({ is_disabled: Disable.CERT_ENABLE_DISABLE });
    try {
      if (Start) {
        const { name, domain } = project;
        const id = project.container_name;
        Analytics.getInstance().eventTracking(
          EVENT.Project,
          ssl ? ACTION.SSL : ACTION.SSLDisable,
          LABEL.Unique
        );

        await request(EndPoint.SSL, RegisterPackages.SSL, [
          {
            id,
            name,
            domain,
            ssl,
            isInstantReloadEnabled,
          },
        ]);

        const obj = await this.getProjectSettings();

        this.setState(
          (prevState) => ({
            sslFlag: !prevState.sslFlag,
            domainUrl: obj.domainUrl,
            adminUrl: obj.adminUrl,
          }),
          () => {
            const { sslFlag } = this.state;
            this.updateDatabase({ ...project, sslFlag });
          }
        );
        // ipcRenderer.send('notification', {
        //   title: 'Info',
        //   body: `SSL ${ssl ? 'Enabled' : 'Disabled'}.`,
        // });
        const payload: NotificationContentType = {
          id: 'SSL',
          message: `SSL ${ssl ? 'Enabled' : 'Disabled'}.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Info',
        };
        displayNotification(payload);
      } else {
        log.info('cert start project');
        // ipcRenderer.send('notification', {
        //   title: 'Info',
        //   body: `Please start the site to enable SSL.`,
        // });
        const payload: NotificationContentType = {
          id: 'SSL',
          message: `Please start the site to enable SSL.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Info',
        };
        displayNotification(payload);
      }
      this.setState({ is_disabled: Disable.DEFAUTL });
    } catch (ERR) {
      /**
       * @todo throw the error
       */
      this.setState({ is_disabled: Disable.DEFAUTL });
      // ipcRenderer.send('notification', {
      //   title: 'Error',
      //   body: `Unable to install the SSL.`,
      // });
      const payload: NotificationContentType = {
        id: 'SSL',
        message: `Unable to install the SSL.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Error',
      };
      displayNotification(payload);
      log.error('CERT Error', ERR);
    }
  };

  /**
   * @description immporting existing sql file
   */
  handleImportDatabase = async () => {
    try {
      const {
        project: { name, container_name, type },
        Start,
      } = this.state;
      Analytics.getInstance().eventTracking(
        EVENT.Project,
        `Import-${type}`,
        LABEL.Utility
      );
      if (Start) {
        const sqlFilePath = dialog.showOpenDialogSync({
          title: 'Please select SQL file to import',
          filters: [{ name: 'sqlfiles', extensions: ['sql'] }],
          properties: ['openFile'],
        });

        if (sqlFilePath !== undefined) {
          this.setState({ is_disabled: Disable.IMPORT });
          await request(EndPoint.SERVICE_FUNCTION, RegisterPackages.WORDPRESS, [
            functionlist.IMPORT_DATABASE,
            [container_name, name],
            [sqlFilePath[0]],
          ]);

          // ipcRenderer.send('notification', {
          //   title: 'Success',
          //   body: 'Database has been imported.',
          // });
          const payload: NotificationContentType = {
            id: 'DATABASE',
            message: `Database has been imported.`,
            type: NotificationKeys.ADD_NOTIFICATION,
            title: 'Success',
          };
          displayNotification(payload);
        }
      } else {
        // ipcRenderer.send('notification', {
        //   title: 'Info',
        //   body: `Please start the site to import database.`,
        // });
        const payload: NotificationContentType = {
          id: 'DATABSE',
          message: `Please start the site to import database.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Info',
        };
        displayNotification(payload);
      }
      this.setState({ is_disabled: Disable.DEFAUTL });
    } catch (err) {
      this.setState({ is_disabled: Disable.DEFAUTL });
      log.error('[project-settings/index.ts]  importExportLink catch error');
      log.error(err);
      // ipcRenderer.send('notification', {
      //   title: 'Error',
      //   body: 'Something went wrong while importing the database.',
      // });
      const payload: NotificationContentType = {
        id: 'DATABASE',
        message: `Something went wrong while importing the database.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Error',
      };
      displayNotification(payload);
    }
  };

  /**
   * @description common function for updating project in database
   * @param payload - updated payload for updating any project in database
   */
  updateDatabase = async (payload: ProjectsSchema) => {
    const metaDB = await db.getInstance();
    log.info('updateDatabase', payload);
    metaDB.updateProject({ ...payload });
    const project = metaDB.getProjectByParam({ $loki: payload.$loki });
    this.setState((prevState) => ({
      project: {
        ...prevState.project,
        ...project,
      },
    }));
    // this.updateAllprojectRedux();
  };

  // Sync Functions
  setFileStatus = (
    isChecked: boolean,
    fileIndex: number,
    filesType: SyncFilesType
  ) => {
    const syncAction = this.getSyncActionObject();
    let filesObj;
    let filesList;
    let actionType;
    if (syncAction && Object.keys(syncAction).length !== 0) {
      const { pullFiles, pushFiles, isSyncActionPull } = syncAction;
      if (isSyncActionPull) {
        filesObj = pullFiles;
        actionType = WebsyncAction.SyncFilesPull;
      } else {
        filesObj = pushFiles;
        actionType = WebsyncAction.SyncFilesPush;
      }

      log.info('filesType123', filesType);
      if (filesType === SyncFilesType.ModifiedFiles) {
        filesList = filesObj.modifiedFiles;
      } else {
        filesList = filesObj.ignoredFiles;
      }
      filesList[fileIndex].isSelected = isChecked;

      // log.info('setSingleFile', {
      //   [actionType]: {
      //     ...filesObj,
      //     [filesType]: filesList,
      //   },
      // });

      log.info('setSingleFile', {
        filesType,
        filesList,
      });

      this.setSyncActionState({
        [actionType]: {
          ...filesObj,
          [filesType]: filesList,
        },
      });
    }
  };

  getDBName = () => {
    const {
      project: { webSync },
    } = this.state;
    if (webSync) {
      const { databaseFields } = webSync.syncObj;
      if (databaseFields) {
        return (
          databaseFields.find((field) => field.key === 'DB_NAME')?.value || ''
        );
      }
    }
    return '';
  };

  getSyncData = () => {
    syncChannel(this.getchanelName(SYNC_CHANNEL_RUNNING), (result) => {
      this.setSyncFilesCount(result);
    });
  };

  setSyncFilesCount = (projectInfo: any) => {
    const {
      project: { name, container_name, webSync },
    } = this.state;
    if (projectInfo) {
      // const projectInfo = result.find(
      //   (o) => o.id === container_name && o.name === name
      // );
      if (projectInfo && webSync) {
        const { filesStats } = projectInfo;
        if (
          filesStats.data &&
          filesStats.data[0] &&
          filesStats.status === ProcessStatus.RUNNING
        ) {
          log.info('valuesData', filesStats.data);
          this.setSyncActionState({
            webSyncFilesCount: `${filesStats.data[0]}/${webSync.syncObj.filesCount} `,
          });
        }
      }
    }
  };

  setSyncStatus = async (isDownloading: boolean) => {
    const { project } = this.state;
    if (project?.webSync) {
      const updatedProject = {
        webSync: {
          ...project.webSync,
          isDownloading,
        },
        ...project,
      };
      this.setState({ project: updatedProject });
    }
  };

  /**
   *
   * @param isModified if true then all modified files are checked/unchecked else ignored files checked/unchecked
   * @param isChecked make are files checked if true and all unchecked otherwise
   */
  setAllFilesStatus = (isModified: boolean, isChecked: boolean) => {
    try {
      const webSyncAction = this.getSyncActionObject();
      log.info('setAllFilesStatus', webSyncAction);
      if (webSyncAction) {
        const { isSyncActionPull, pullFiles, pushFiles } = webSyncAction;
        let filesType;
        let allModifiedSelected;
        if (isModified) {
          filesType = SyncFilesType.ModifiedFiles;
          allModifiedSelected = 'isAllModifiedSelected';
        } else {
          filesType = SyncFilesType.IgnoredFiles;
          allModifiedSelected = 'isAllIgnoredSelected';
        }
        let filesList: WebsyncFile[];
        let actionType;
        let websyncFileObj;
        if (isSyncActionPull) {
          // filesType would be ignored/modified files field
          websyncFileObj = { ...pullFiles };
          const { [filesType]: allfiles } = websyncFileObj;
          filesList = allfiles;
          actionType = 'pullFiles';
        } else {
          // set push action files list
          websyncFileObj = { ...pushFiles };
          const { [filesType]: allfiles } = websyncFileObj;
          filesList = allfiles;
          actionType = 'pushFiles';
        }
        if (filesList.length) {
          filesList.forEach((o, idx) => {
            if (!o.isDisabled) {
              filesList[idx].isSelected = isChecked;
            }
          });

          log.info('filesList', filesList);
          this.setSyncActionState({
            [actionType]: {
              ...websyncFileObj,
              [filesType]: filesList,
              [allModifiedSelected]: isChecked,
            },
          });
        } else {
          this.setSyncActionState({
            [actionType]: {
              ...websyncFileObj,
              [allModifiedSelected]: isChecked,
            },
          });
        }
      }
    } catch (e) {
      log.info('error', e);
    }
  };

  getSyncActionObject = (): WebSyncAction | undefined => {
    const {
      project: { webSync },
    } = this.state;
    return webSync && webSync.syncAction ? webSync.syncAction : undefined;
  };

  /**
   * sets syncAction object (of websync under project) fields in the state
   * @param webSyncParam  object fields to be updated
   */
  setSyncActionState = async (webSyncParam: {
    [key: string]:
      | string
      | SyncActionFiles
      | boolean
      | string[]
      | SyncActionStatus;
  }) => {
    log.info('incomingActionState', webSyncParam);
    const {
      project: { webSync },
    } = this.state;
    if (webSync && webSync.syncAction) {
      const { project: prevProj } = this.state;
      const syncAction = {
        ...webSync.syncAction,
        ...webSyncParam,
      };
      log.info('syncActionUpdate', syncAction);
      return new Promise<void>((resolve) => {
        this.setState(
          {
            project: {
              ...prevProj,
              webSync: {
                ...webSync,
                syncAction,
              },
            },
          },
          () => {
            const {
              project: { webSync: updatedWebsync },
            } = this.state;
            log.info('setSyncActionState', updatedWebsync);
            resolve();
          }
        );
      });
    }
    return 0;
  };

  /**
   *
   * @param isModified if true then all modified files are checked/unchecked else ignored files checked/unchecked
   */
  onClickAddFileListener = (isModified: boolean) => {
    const {
      project: {
        location: { code },
      },
    } = this.state;
    const codeFilePath = dialog.showOpenDialogSync({
      defaultPath: code,
      title: 'Please select file from project folder',
      filters: [],
      properties: ['openFile'],
    });
    log.info('codeFilePath', codeFilePath);
    if (isArray(codeFilePath) && codeFilePath[0].includes(code)) {
      const relativeFilePath = codeFilePath[0].replace(`${code}`, '');
      log.info('relativeFilePath', relativeFilePath.substring(1));
      this.addNonExistingFile(isModified, relativeFilePath.substring(1));
    } else {
      log.info('file selected from different location');
      const payload: NotificationContentType = {
        id: 'FILESELECT',
        message: 'Select file from current project only',
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Unable to select file',
      };
      displayNotification(payload);
    }
  };

  addNonExistingFile = (isModified: boolean, filePath: string) => {
    const webSyncAction = this.getSyncActionObject();
    if (webSyncAction) {
      const { isSyncActionPull, pullFiles, pushFiles } = webSyncAction;
      let filesType;
      let filesList: WebsyncFile[];
      let actionType;
      let websyncFileObj;
      if (isModified) {
        filesType = SyncFilesType.ModifiedFiles;
      } else {
        filesType = SyncFilesType.IgnoredFiles;
      }

      if (isSyncActionPull) {
        // filesType would be ignored/modified files field
        websyncFileObj = { ...pullFiles };
        const { [filesType]: allfiles } = websyncFileObj;
        filesList = allfiles;
        actionType = 'pullFiles';
      } else {
        // set push action files list
        websyncFileObj = { ...pushFiles };
        const { [filesType]: allfiles } = websyncFileObj;
        filesList = allfiles;
        actionType = 'pushFiles';
      }
      const nanoId = nanoid(10);
      if (isArray(filesList) && filesList.length) {
        const idx = filesList.findIndex((o) => o.filePath === filePath);
        if (idx < 0) {
          filesList.unshift({
            filePath,
            isSelected: true,
            isDisabled: false,
            id: nanoId,
          });
        }
      } else {
        filesList.push({
          filePath,
          isSelected: true,
          isDisabled: false,
          id: nanoId,
        });
      }
      log.info('prevList', filesList);
      log.info('finalFileAdded', {
        [actionType]: {
          ...websyncFileObj,
          [filesType]: filesList,
        },
      });
      this.setSyncActionState({
        [actionType]: {
          ...websyncFileObj,
          [filesType]: filesList,
        },
        displayNoFileScreen: false,
      });
    }
  };

  noNewFileHandler = () => {
    // clear push or pull files
    const webSyncAction = this.getSyncActionObject();
    if (webSyncAction) {
      let actionType;
      let websyncFileObj;
      const { isSyncActionPull, pullFiles, pushFiles } = webSyncAction;
      if (isSyncActionPull) {
        actionType = 'pullFiles';
        websyncFileObj = { ...pullFiles };
      } else {
        actionType = 'pushFiles';
        websyncFileObj = { ...pushFiles };
      }
      this.setSyncActionState({
        [actionType]: {
          ...websyncFileObj,
          modifiedFiles: [],
        },
      });
      this.onClickAddFileListener(true);
    }
  };

  syncNowHandler = async () => {
    const {
      Start,
      project: { webSync },
      project,
    } = this.state;
    if (Start) {
      try {
        const args = await this.getArgs();
        if (webSync && webSync.syncAction && Object.keys(args).length) {
          const {
            syncObj: { serverFields, databaseFields, serviceProvider },
            firstRunAfterAttach,
            syncAction: {
              isSyncActionPull,
              pushFiles,
              pullFiles,
              pushFilesBackup,
              pullFilesBackup,
              pullDatabase,
              pushDatabase,
            },
          } = webSync;
          // this.db.updateProject({
          //   ...project,
          //   ...webSync,
          // });
          log.info('setSyncProcessingStatus', webSync);
          this.setSyncProcessingStatus(SyncActionStatus.PROCESSING);
          if (isSyncActionPull) {
            request(
              EndPoint.WEBSITE_PUSH_PULL,
              RegisterPackages.WEBSITE_PUSH_PULL,
              [
                functionlist.IMPORT_PULL_FILES,
                {
                  serviceProvider,
                  args,
                  serverfields: serverFields,
                  databasefields: databaseFields,
                  filesList: pullFiles.modifiedFiles,
                  ignoredList: pullFiles.ignoredFiles,
                  createBackup: pullFilesBackup,
                  pullDatabase,
                  firstRunAfterAttach,
                },
              ]
            );
          } else {
            request(
              EndPoint.WEBSITE_PUSH_PULL,
              RegisterPackages.WEBSITE_PUSH_PULL,
              [
                functionlist.EXPORT_PROJECT,
                {
                  serviceProvider,
                  args,
                  serverfields: serverFields,
                  databasefields: databaseFields,
                  filesList: pushFiles.modifiedFiles,
                  ignoredList: pushFiles.ignoredFiles,
                  createBackup: pushFilesBackup,
                  pushDatabase,
                },
              ]
            );
          }
        } else {
          throw new Error('Invalid SSH key');
        }
      } catch (err) {
        // TODO: handle err thrown
        log.info('[syncNowHandler]', err);
        const payload: NotificationContentType = {
          id: 'SYNCNOW',
          message: err.message,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Sync process failed',
        };
        displayNotification(payload);

        this.setSyncProcessingStatus(SyncActionStatus.FAILED);
      }
    } else {
      const payload: NotificationContentType = {
        id: 'WEBSYNC',
        message: `Please start the site.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  /**
   * perform websync (Push/Pull) dry run & set state with resulting files
   */
  startSyncDryRun = async (isActionPull: boolean) => {
    try {
      // log.info('dryRun', this.state.project);
      const {
        project: { webSync },
      } = this.state;
      const args = await this.getArgs();
      if (webSync && webSync.syncAction && Object.keys(args).length) {
        log.info('startSyncDryRun', isActionPull);
        const {
          syncAction: { pushFiles, pullFiles },
        } = webSync;
        let listType;
        let modifiedFilesObj;
        if (isActionPull) {
          listType = 'pullFiles';
          modifiedFilesObj = pullFiles;
        } else {
          listType = 'pushFiles';
          modifiedFilesObj = pushFiles;
        }
        this.setSyncActionState({
          [listType]: {
            ...modifiedFilesObj,
            modifiedFiles: [],
            ignoredFiles: [],
            isAllModifiedSelected: false,
          },
          displayNoFileScreen: false,
        });
        const { project } = this.state;
        this.setState({
          project: {
            ...project,
            webSync: {
              ...webSync,
              syncProcessStatus: SyncActionStatus.PROCESSING,
            },
          },
        });
        this.disableAllTabs(true, 3);
        const {
          syncObj: { serverFields, serviceProvider },
          firstRunAfterAttach,
        } = webSync;
        log.info('incomingFields', {
          serviceProvider,
          args,
          serverfields: serverFields,
          isActionPull,
          firstRunAfterAttach,
        });
        const { ignoredFiles, modifiedFiles, error } = await request(
          EndPoint.WEBSITE_PUSH_PULL,
          RegisterPackages.WEBSITE_PUSH_PULL,
          [
            functionlist.IMPORT_PROJECT_FILES_LIST,
            {
              serviceProvider,
              args,
              serverfields: serverFields,
              isActionPull,
              firstRunAfterAttach,
            },
          ]
        );
        log.info('resposne', { ignoredFiles, modifiedFiles, error });
        log.info('changedFiles', {
          [listType]: {
            ...modifiedFilesObj,
            modifiedFiles,
            ignoredFiles,
            isAllModifiedSelected: true,
            isAllIgnoredSelected: true,
          },
        });
        this.disableAllTabs(false, 3);
        this.setSyncProcessingStatus(SyncActionStatus.COMPLETE);
        this.setSyncActionState({
          [listType]: {
            ...modifiedFilesObj,
            modifiedFiles,
            ignoredFiles,
            isAllModifiedSelected: true,
            isAllIgnoredSelected: true,
          },
          displayNoFileScreen: !(
            isArray(modifiedFiles) && modifiedFiles.length
          ),
        });

        if (error) {
          // ToDo: display notification
          log.error('DryRunError', error);
          // push pull buttons
          throw new Error(error);
        }
      } else {
        // display error message
        throw new Error('Invalid SSH key');
      }
    } catch (err) {
      log.error('[startSyncDryRun]', err);
      this.disableAllTabs(false, 3);
      this.setSyncProcessingStatus(SyncActionStatus.COMPLETE);
      this.setSyncActionState({
        displaySyncActionPage: true,
      });
      const payload: NotificationContentType = {
        id: 'Push-pull',
        message: err.message,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Sync',
      };
      displayNotification(payload);
    }
  };

  setSyncProcessingStatus = (syncProcessStatus: SyncActionStatus) => {
    const { project } = this.state;
    const { webSync } = project;
    if (webSync) {
      this.setState({
        project: {
          ...project,
          webSync: {
            ...webSync,
            syncProcessStatus,
          },
        },
      });
    }
  };

  /**
   * prepares argument object for push-pull (location, key etc) and checks if key exists
   */
  getArgs = async () => {
    const {
      project: { webSync },
    } = this.state;
    if (webSync && webSync.sshKeyId) {
      const metadb = await db.getInstance();
      const keyObj = await metadb.getKeyById(webSync.sshKeyId);
      const { keyName } = keyObj;
      log.info('sshKeyName', keyName);
      // tests if pub and private key file exists
      const response = await Promise.all([
        fsExtra.pathExists(keyName),
        fsExtra.pathExists(`${keyName}.pub`),
      ]);
      if (response[0] && response[1]) {
        const {
          project: {
            location: {
              database,
              code,
              logs,
              webRoot,
              confTemplate,
              config,
              runPath,
              user,
              run,
              package: pack,
            },
            name,
            container_name,
            type,
          },
        } = this.state;
        const locObj = {
          database,
          logs,
          webRoot,
          confTemplate,
          config,
          runPath,
          user,
          run,
          code,
          _code: code,
          _database: database,
          _webRoot: webRoot,
          _confTemplate: confTemplate,
          _logs: logs,
          _config: config,
          _runPath: run,
          package: pack,
        };
        return {
          id: container_name,
          name,
          sshKeyName: keyName,
          cms: type,
          location: locObj,
        };
      }
    }
    return {};
  };

  /**
   *  complement prev sync action and start dry run (default sync action is pull)
   */
  selectSyncOperation = async () => {
    /** ********** Sync switch  push pull toggle ************* */
    this.setState((prevState) => ({
      isToggleSyncPushPull: !prevState.isToggleSyncPushPull,
    }));
    /** ********** Sync switch  push pull toggle ************* */

    const webSyncAction = this.getSyncActionObject();
    if (webSyncAction) {
      log.info('selectSyncOperation');
      const { isSyncActionPull: prevSyncAction } = webSyncAction;
      log.info('prevSyncAction', prevSyncAction);
      await this.setSyncActionState({
        isSyncActionPull: !prevSyncAction,
      });
      this.startSyncDryRun(!prevSyncAction);
    }
  };

  handleSyncAction = (isSyncActionPull: boolean) => {
    log.info('handleSyncAction', isSyncActionPull);
    const { project, Start } = this.state;
    const modifiedProject = {
      ...project,
    };

    if (Start) {
      if (modifiedProject?.webSync && !modifiedProject.webSync?.syncAction) {
        log.info('proJEct', project?.webSync);
        modifiedProject.webSync.syncAction = {
          ...this.syncAction,
          isSyncActionPull,
        };
      } else if (
        modifiedProject.webSync &&
        modifiedProject.webSync.syncAction
      ) {
        modifiedProject.webSync.syncAction = {
          ...modifiedProject.webSync.syncAction,
          isSyncActionPull,
        };
      }
      this.setState(
        {
          project: modifiedProject,
          displaySyncActionPage: false,
        },
        () => {
          const {
            project: { webSync },
          } = this.state;
          log.info('value1234', webSync?.syncAction);
          this.startSyncDryRun(isSyncActionPull);
        }
      );
    } else {
      const payload: NotificationContentType = {
        id: 'WEBSYNC',
        message: `Please start the site.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  websyncRefreshHandler = () => {
    const syncAction = this.getSyncActionObject();
    if (syncAction) {
      this.startSyncDryRun(syncAction.isSyncActionPull);
    }
  };

  /** Expand js code */
  onClickExpandListener = () => {
    const item = document.getElementById('expand_grid');
    if (item) {
      item.classList.toggle(`${Style.expand_grid}`);
    }
    log.info('[onClickExpandListener]', item);
  };

  getPushPullFiles = (): SyncActionFiles => {
    const syncAction = this.getSyncActionObject();
    if (syncAction) {
      if (syncAction.isSyncActionPull) {
        return syncAction.pullFiles;
      }
      return syncAction.pushFiles;
    }
    return {
      modifiedFiles: [],
      ignoredFiles: [],
      isAllModifiedSelected: false,
      isAllIgnoredSelected: false,
    };
  };

  onTabClickListener = (item: TabList) => {
    this.setState({
      tabId: item.id,
      activeTabId: `${item.id}`,
    });

    if (item.id === TabId.CLONE_SETTING) {
      this.setState({
        displaySyncActionPage: true,
      });
      this.setSyncActionState({
        displayNoFileScreen: false,
      });
    }
  };

  onSyncNowClickListener = () => {
    console.log('sync now is clicked');
  };

  onfetchClickListener = () => {
    console.log('Fetch data is clicked');
  };

  /**
   * @description starting code server
   */
  handleCodeServer = async () => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      ACTION.IDE,
      LABEL.Utility
    );
    const { history } = this.props;
    const {
      project: {
        location: { code },
      },
      currentProject: { title, subTitle },
    } = this.state;
    try {
      this.setState({ is_disabled: Disable.CODE_SERVER });
      const codeServerExist = await request(
        EndPoint.UTILITY_FUNCTION,
        RegisterPackages.CODE_SERVER,
        [functionlist.GET_STATUS, [subTitle, title]]
      );
      log.info('codeServerExist ', codeServerExist);
      if (!codeServerExist) {
        await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.CODE_SERVER, [
          functionlist.PROVISION,
          [subTitle, title],
        ]);
        await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.CODE_SERVER, [
          functionlist.POST_PROVISON,
          [subTitle, title],
        ]);
        log.info('codeServerExist START');
      }

      const linkToOpen = await request(
        EndPoint.UTILITY_FUNCTION,
        RegisterPackages.CODE_SERVER,
        [functionlist.LIVE_LINK, [subTitle, title], [code]]
      );

      log.info('LINK TO OPEN', linkToOpen);

      await request(EndPoint.OPEN_BROWSER, RegisterPackages.skip, [linkToOpen]);
      this.setState({ is_disabled: Disable.DEFAUTL });
    } catch (err) {
      history.push({
        pathname: `${routes.LANDING}${routes.ERROR}`,
        state: {
          error: err,
          origin: routes.PROJECT_SETTINGS,
          parent: routes.DASHBOARD,
        },
      });
    }
  };

  /**
   * @description open code location path
   */
  handleFileManager = () => {
    shell.openItem(this.getFileManagerPath());
  };

  handleGitRepoClick = () => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      ACTION.Repo,
      LABEL.Unique
    );
    const {
      project: { git_clone_url },
    } = this.state;
    shell.openExternal(git_clone_url);
  };

  /**
   * @description get the location of code folder
   */
  getFileManagerPath = () => {
    const {
      project: { location },
    } = this.state;

    return location.code;
  };

  /**
   * @description get database path
   */
  getDatabasePath = () => {
    const {
      project: { location },
    } = this.state;

    return location.database;
  };

  /**
   *  @description exporting working project database file to code directory
   *
   */
  handleExportDatabase = async () => {
    const {
      Start,
      project: { location, name, container_name, type },
    } = this.state;
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      `Export-${type}`,
      LABEL.Utility
    );
    this.setState({ is_disabled: Disable.EXPORT });
    try {
      if (Start) {
        await request(EndPoint.SERVICE_FUNCTION, RegisterPackages.WORDPRESS, [
          functionlist.EXPORT_DATABASE,
          [container_name, name],
        ]);
        shell.openItem(location.database);
      } else {
        // ipcRenderer.send('notification', {
        //   title: 'Info',
        //   body: `Please start the site to export database.`,
        // });
        const payload: NotificationContentType = {
          id: 'DATABASE',
          message: `Please start the site to export database.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Info',
        };
        displayNotification(payload);
      }
      this.setState({ is_disabled: Disable.DEFAUTL });
    } catch (ERR) {
      this.setState({ is_disabled: Disable.DEFAUTL });
      log.info('Something went wrong while exporting the database');
      log.error(ERR);
      // ipcRenderer.send('notification', {
      //   title: 'Error',
      //   body: 'Something went wrong while exporting the database.',
      // });
      const payload: NotificationContentType = {
        id: 'DATABASE',
        message: `Something went wrong while importing the database.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Error',
      };
      displayNotification(payload);
    }
  };

  /**
   *@description  method runs before open public link
   */
  onClickshowpublicLink = () => {
    const { publicLinkShoModal, Start } = this.state;
    if (!publicLinkShoModal && !Start) {
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to enable public link.`,
      // });
      const payload: NotificationContentType = {
        id: 'PUBLIC LINK',
        message: `Please start the site to enable public link.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
      return;
    }
    this.setState((prevState) => ({
      publicLinkShoModal: !prevState.publicLinkShoModal,
    }));
  };

  onClicksyncshowModal = () => {
    this.setState((prevState) => ({
      syncshowModal: !prevState.syncshowModal,
    }));
  };

  hotReload = async (action: string) => {
    const {
      Start,
      currentProject: { title, subTitle },
      project,
    } = this.state;
    try {
      if (Start) {
        this.setState({ is_disabled: Disable.HOTRELOAD });
        await request(EndPoint.INSTANT_RELOAD, RegisterPackages.TERMINAL, [
          {
            id: subTitle,
            name: title,
            action,
          },
        ]);
        this.setState(
          (prevState) => ({
            isInstantReloadEnabled: !prevState.isInstantReloadEnabled,
            is_disabled: Disable.DEFAUTL,
          }),

          () => {
            const { isInstantReloadEnabled } = this.state;
            this.updateDatabase({ ...project, isInstantReloadEnabled });
          }
        );
      } else {
        // ipcRenderer.send('notification', {
        //   title: 'Info',
        //   body: `Please start the site to enable Hot Reload.`,
        // });
        const payload: NotificationContentType = {
          id: 'HOT-RELOAD',
          message: `Please start the site to enable Hot Reload.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Info',
        };
        displayNotification(payload);
      }
    } catch (err) {
      this.setState({ is_disabled: Disable.DEFAUTL });
    }
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();

    this.setState((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  };

  /**
   * @description method to open delete model on click delete button
   */
  showDeleteProjectModal = () => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      ACTION.Delete,
      LABEL.Utility
    );
    const { showDeleteModal } = this.props;
    const { currentProject } = this.state;
    showDeleteModal({ show: true, project: [currentProject] });
  };

  onClearTokenInput = () => {
    this.setState({ pasteToken: '' });
  };

  getNotificationMessage = () => {
    const { is_disabled, livelink, Start, sslFlag } = this.state;
    switch (is_disabled) {
      case Disable.SWITCH_PHP:
        return 'Just a moment, while we swap between PHP versions';
      case Disable.START_STOP:
        return `Hang on! We’re ${
          !Start ? 'starting' : 'stopping'
        }  your website.`;
      case Disable.PUBLIC_LINK:
        return `Just a moment! We’re ${
          livelink ? 'disabling' : 'generating'
        }  public link for you.`;
      case Disable.CERT_ENABLE_DISABLE:
        return `Just a moment! We’re   ${
          sslFlag ? 'disabling' : 'generating'
        } SSL for you.`;
      case Disable.CODE_SERVER:
        return 'Just a moment! We’re deploying the code editor for you.';
      case Disable.CHECK_CONFIGURATION:
        return 'Just a moment! We’re checking project configuration.';
      case Disable.IMPORT:
        return 'Just a moment! The database is being prepared for you.';
      case Disable.EXPORT:
        return 'Just a moment! The database is being prepared for you.';
      default:
        return '';
    }
  };

  /**
   * @description 'send request to main process to open terminal'
   * @param type bash cms sh for darwin
   */
  openTerminal = async (type = 'sh') => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      `Terminal-${type}`,
      LABEL.Unique
    );
    try {
      const { project, Start } = this.state;
      const id = project.container_name;
      const { runPath } = project.location;
      if (Start) {
        await request(EndPoint.TERMINAL, RegisterPackages.TERMINAL, [
          {
            id,
            runPath,
            type,
          },
        ]);
      } else {
        // ipcRenderer.send('notification', {
        //   title: 'Info',
        //   body: `Please start the site to open terminal.`,
        // });
        const payload: NotificationContentType = {
          id: 'TERMINAL',
          message: `Please start the site to open terminal.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Info',
        };
        displayNotification(payload);
      }
    } catch (err) {
      log.error('openTerminal');
      log.error(err);
      // ipcRenderer.send('notification', {
      //   title: 'Error',
      //   body: `${err.message}.`,
      // });
      const payload: NotificationContentType = {
        id: 'Terminal',
        message: `${err.message}.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Error',
      };
      displayNotification(payload);
    }
  };

  /**
   * @description method executes before open and close dropdown
   */
  onSelectOpenTerminalOption = () => {
    log.info('isterminalremoved12');
    const { Start } = this.state;
    if (!Start) {
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to open terminal.`,
      // });
      const payload: NotificationContentType = {
        id: 'TERMINAL',
        message: `Please start the site to open terminal.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  /**
   * @description method decides open and close of view website dropdown
   * @param islistRemoved
   */
  isViewWebsiteOptionRemoved = (islistRemoved: boolean) => {
    this.setState({
      renderViewWebsiteList: islistRemoved,
    });
  };

  /**
   * @description method decides open and close of view website dropdown
   * @param islistRemoved
   */
  isPhpOptionRemoved = (islistRemoved: boolean) => {
    this.setState({
      renderViewPhpList: islistRemoved,
    });
  };

  /**
   *@description  to enable disable  terminal option
   * @param islistRemoved
   */
  isTerminalOptionRemoved = (islistRemoved: boolean) => {
    log.info('isterminalremoved');
    this.setState({
      renderTerminalList: islistRemoved,
    });
  };

  /**
   * method for open admin url
   */
  onOpenAdmin = () => {
    const { adminUrl } = this.state;
    shell.openExternal(adminUrl);
  };

  /**
   * method executes on select teminal from  list
   * @param terminalOption bash or cmd
   */
  onOpenTerminalList = (terminalOption: ListType) => {
    Analytics.getInstance().eventTracking(
      EVENT.Project,
      `open Terminal`,
      `${terminalOption.name}`
    );
    this.setState({ showDropdown: false });
    this.openTerminal(terminalOption.name);
  };

  /**
   * @description function execute before open view website dropdown & display notification in case site stopped
   */
  checkopenWebsiteDropdown = () => {
    const { Start, viewWebsiteValue } = this.state;
    log.info('button click testing', viewWebsiteValue, Start);
    if (!Start) {
      // this.setState({ renderViewWebsiteList: false });
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to view website.`,
      // });
      const payload: NotificationContentType = {
        id: 'WEBSITE',
        message: `Please start the site to view website.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    } else {
      const currentOption = this.ViewWebsiteList.find(
        (each) =>
          each.name.trim().toLowerCase() ===
          viewWebsiteValue.trim().toLowerCase()
      );
      if (currentOption) {
        this.onViewWebsiteList(currentOption);
      }
    }
  };

  onViewWebsiteButtonClick = () => {
    log.info('on button click in button dropdown');
  };

  /**
   * @description function execute before open view php dropdown & display notification in case site stopped
   */

  checkphpList = () => {
    const { Start } = this.state;
    if (!Start) {
      this.setState({ renderPhpVersionList: false });
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to switch PHP version.`,
      // });
      const payload: NotificationContentType = {
        id: 'PHP',
        message: `Please start the site to switch PHP version.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  /**
   * @description common function for open site or view site admin
   * @param viewWebsiteOption
   */
  onViewWebsiteList = (viewWebsiteOption: ListType) => {
    console.log(viewWebsiteOption);
    const { Start, viewWebsiteValue } = this.state;
    if (viewWebsiteOption.name !== viewWebsiteValue) {
      localStorage.setItem('websiteOption', viewWebsiteOption.name);
    }
    if (Start) {
      switch (viewWebsiteOption.id) {
        case 0:
          Analytics.getInstance().eventTracking(
            EVENT.Project,
            ACTION.Open,
            LABEL.User
          );

          this.openWebsite();
          break;
        case 1:
          Analytics.getInstance().eventTracking(
            EVENT.Project,
            ACTION.Open,
            LABEL.Admin
          );
          this.onOpenAdmin();
          break;
        default:
          log.info('Invalid view website option Selected');
      }
      this.setState({ viewWebsiteValue: viewWebsiteOption.name });
    } else {
      // ipcRenderer.send('notification', {
      //   title: 'Info',
      //   body: `Please start the site to view website.`,
      // });
      const payload: NotificationContentType = {
        id: 'WEBSITE',
        message: `Please start the site to view website.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Info',
      };
      displayNotification(payload);
    }
  };

  /**
   *@description show notification on click overlay
   */
  enableBottomNotification = () => {
    this.setState({ showBottomNotification: true });
  };

  onSelectPhpVersionsList = (item: ListType) => {
    this.setState({
      phpVersionsValue: item.name,
    });
    const sortList: ListType[] = this.phpVersionsList.map(
      (versions: ListType) => {
        let el = versions;
        el = { ...versions, selected: versions.name === item.name };
        return el;
      }
    );
    this.phpVersionsList = sortList;
  };

  isPHPSelectOptionsRemoved = (islistRemoved: boolean) => {
    this.setState({
      renderPhpVersionList: islistRemoved,
    });
  };

  /**
   *  toggles files backup switch, if true then will create files backup at locally
   * @param
   */
  toggleFilesbackupCheck = (
    e: React.ChangeEvent<HTMLInputElement>,
    isFilesBackup: boolean
  ) => {
    // this.setState({ createFilesBackup: e.target.checked });
    const webSyncAction = this.getSyncActionObject();
    if (webSyncAction) {
      const { checked } = e.target;
      // toggle files backup switch if true, database otherwise
      if (webSyncAction.isSyncActionPull) {
        if (isFilesBackup) {
          this.setSyncActionState({
            pullFilesBackup: checked,
          });
        } else {
          this.setSyncActionState({
            pullDatabase: checked,
          });
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (isFilesBackup) {
          this.setSyncActionState({
            pushFilesBackup: checked,
          });
        } else {
          this.setSyncActionState({
            pushDatabase: checked,
          });
        }
      }
    }
  };

  /**
   * changes status selected/unselected of file/folder's files of modified or ignoredFiles list in (project-settings) component
   * @param itemPath  gives path of file or folder
   * @param isSelected  status of file/folder path, true if selected and false otherwise
   * @param isModified if true then list to be updated is modified files else ignored files to be updated
   */
  updateTreeList = (
    itemPath: string,
    isSelected: boolean,
    filesType: SyncFilesType
  ) => {
    log.info('updateTreeList', itemPath, isSelected, filesType);
    const webSyncAction = this.getSyncActionObject();
    if (webSyncAction) {
      const { isSyncActionPull, pullFiles, pushFiles } = webSyncAction;
      let filesList: WebsyncFile[];
      let actionType;
      let websyncFileObj;

      if (isSyncActionPull) {
        // filesType would be ignored/modified files field
        websyncFileObj = { ...pullFiles };
        const { [filesType]: allfiles } = websyncFileObj;
        filesList = allfiles;
        actionType = 'pullFiles';
      } else {
        // set push action files list
        websyncFileObj = { ...pushFiles };
        const { [filesType]: allfiles } = websyncFileObj;
        filesList = allfiles;
        actionType = 'pushFiles';
      }

      this.setSyncActionState({
        [actionType]: {
          ...websyncFileObj,
          [filesType]: filesList.map((file) => {
            if (file.filePath.includes(itemPath)) {
              file.isSelected = isSelected;
            }
            return file;
          }),
        },
      });
    }
  };

  updateAllprojectRedux = async (id: number) => {
    const {
      getAllProjects,
      projectsData: { allProjects },
    } = this.props;
    try {
      this.db.deleteProject({
        $loki: id,
      });
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
    } catch (err) {
      log.info(err);
    }
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

  getchanelName = (channel: string) => {
    const {
      currentProject: { subTitle },
    } = this.state;
    return `${channel}-${subTitle}`;
  };

  getErrorMsg = (syncProj: SyncEmitObj) => {
    if (syncProj.dbStats.status === ProcessStatus.ERROR) {
      return syncProj.dbStats.error;
    }
    if (syncProj.filesStats.status === ProcessStatus.ERROR) {
      return syncProj.filesStats.error;
    }
    return 'Error while fetching server files and database';
  };

  handletab = () => {
    const {
      currentProject: { projectcurrentState },
      project: { projectType, webSync },
    } = this.state;
    // websync in or condition for handle linking blank and git projects
    if (projectType === ProjectEnumType.CLONEWEBSITE || webSync) {
      if (
        webSync?.syncProcessStatus === SyncActionStatus.PROCESSING ||
        webSync?.pushPullStatus === PushPullStatus.RUNNING
      ) {
        this.tabList = this.tabList.map((tab, idx) => ({
          ...tab,
          disable: true,
        }));
        if (webSync?.pushPullStatus === PushPullStatus.RUNNING) {
          const currentTab = this.tabList.find(
            (each) => each.id === TabId.CLONE_SETTING
          );
          if (currentTab) {
            this.onTabClickListener(currentTab);
          }
        }
      } else if (projectcurrentState === CurrenState.INCOMPLETE) {
        this.tabList = this.tabList.map((tab, idx) => ({
          ...tab,
          disable:
            tab.id !== TabId.WEBSITE_SETTINGS &&
            projectType === ProjectEnumType.CLONEWEBSITE,
        }));
      } else {
        this.tabList = this.tabList.map((tab, idx) => ({
          ...tab,
          disable: false,
        }));
      }
    } else if (!webSync) {
      log.info('cloneWebsite');
      this.tabList = this.tabList.filter(
        (tab) => tab.id !== TabId.CLONE_SETTING
      );
    }
  };

  // disable all tabs while fetching files list from server
  disableAllTabs = (disableTabs: boolean, tabId: number) => {
    // tabId
    this.tabList = this.tabList.map((tab, _idx) => ({
      ...tab,
      disable: disableTabs,
    }));
    this.setState({
      tabId,
      activeTabId: `${tabId}`,
    });
  };

  /**
   * @description method to initilise and getting project configration
   */
  async init() {
    const res = await this.dispatcher.getAllBranches(this.getFileManagerPath());
    log.info(res);
    debugger;
    // log.info('Init');
    let branchList: Array<Branch> = [];
    const currentUser = localStorage.getItem('currentUser');
    const {
      gitUsers,
      project: { git_login, git_clone_url },
      currentGitUser,
      gitBranches,
    } = this.state;
    if (gitUsers?.length) {
      const gitJson: [] = JSON.parse(gitUsers);
      const gitUserName: string[] = gitJson.map((user: any) => {
        return user.login;
      });
      this.setState({ gitUserNames: gitUserName });
      if (currentUser) {
        this.setState({ currentGitUser: currentUser });
      } else {
        this.setState({ currentGitUser: gitUserName[0] });
      }
      if (git_login.length) {
        const repository = await this.dispatcher.validateAccountandRepository(
          git_clone_url,
          currentGitUser,
          (e) => {
            if (e) {
              if (e !== 'OK') {
                this.setState({ repoCallbackError: true });
                log.info('[git-setting.ts] repositoryhandler() Error:', e);
                this.showErrormessages(e, true);
              }
            }
          }
        );
        debugger;
        if (repository) {
          const gitAllBranches = await this.dispatcher.getAllBranches(
            this.getFileManagerPath()
          );
          if (gitAllBranches) {
            debugger;
            branchList = gitAllBranches.map((item, index: number) => {
              const branch: Branch = {
                name: item.name,
                upstream: item.upstream,
                type: item.type,
                tip: item.tip,
                remote: item.remote,
                nameWithoutRemote: item.nameWithoutRemote,
                upstreamWithoutRemote: item.upstreamWithoutRemote,
              };
              return branch;
            });
          }
          debugger;
          this.setState({ gitBranches: branchList });
        }
      }
    }
    const {
      is_disabled,
      currentProject: { title, subTitle, type, downloading },
    } = this.state; // reading from store
    log.info(title, subTitle, 'jdsaj');
    const project = await this.getProjectFromDB(subTitle, title);
    log.info('Project Stored in Database ', {
      ...project,
      credential: { ...project.credential, password: undefined },
    });
    this.setState({ project, displaySyncActionPage: true });

    const {
      project: { projectType, webSync },
    } = this.state;

    log.info(webSync, 'websync ---- init ');

    /**
     * @info show delete modal in case incomplete project
     */
    if (project.projectcurrentState === CurrenState.ERRORED) {
      this.showDeleteProjectModal();
    }
    // for handling switch tabs
    this.handletab();
    // overwriting the location.state with the project stored in the database
    // if site running set cms version otherwise use last version in db
    await Promise.allSettled([
      async () => {
        if (project.isInstantReloadEnabled === undefined) {
          this.updateDatabase({ ...project, isInstantReloadEnabled: false });
        } else {
          this.setState({
            isInstantReloadEnabled: project.isInstantReloadEnabled,
          });
        }
      },
      this.getUtilitiesList(),
      this.getHelpherVersions(type),
      this.checkBash(),
      this.getVersion(),
    ]);

    try {
      const obj: {
        state: SiteState;
        domainUrl: string;
        ssl: number;
        http: number;
        adminUrl: string;
      } = await this.getProjectSettings(); // getting the data from ProjectManagement instance.
      log.info('ProjectManagement Instance ', obj);

      const ngrokLink = await this.ngrokStatus(); // check ngrok is working or not
      if (project.webSync?.isDownloading) {
        log.info('isDownloading', project.webSync?.isDownloading);
        this.setState({
          is_disabled: Disable.START_STOP,
          Start: false,
        });
      }

      if (type === RegisterPackages.CUSTOM) {
        this.ViewWebsiteList.length = 1;
      }
      if (obj.state === SiteState.RUNNING) {
        this.setState({
          Start: true,
          is_disabled: Disable.DEFAUTL,
          domainUrl: obj.domainUrl,
          adminUrl: obj.adminUrl,
          sslFlag: project.sslFlag,
          livelink: ngrokLink,
        });
      } else {
        this.setState({
          Start: false,
          is_disabled: Disable.DEFAUTL,
          domainUrl: obj.domainUrl,
          sslFlag: project.sslFlag,
          livelink: ngrokLink,
        });
      }
    } catch (err) {
      log.info('Init Error: ', err.message);
      if (is_disabled !== Disable.DEFAUTL) {
        this.setState({ is_disabled: Disable.DEFAUTL });
      }
      /**
       * @todo throow the error to error_page
       */
    }
  }

  render() {
    const {
      theme,
      projectsData: { currentProject },
    } = this.props;
    const notificationMessage = this.getNotificationMessage();

    const {
      tabId,
      activeTabId,
      utilitylist,
      publicLinkShoModal,
      syncshowModal,
      pasteToken,
      Start,
      livelink,
      is_disabled,
      sslFlag,
      hotReload,
      showBottomNotification,
      project,
      project: {
        cms_version,
        git_clone_url,
        webSync,
        projectcurrentState,
        git_login,
        git_branch,
      },
      currentProject: { title, type, descritption },
      currentProject: currentproject,
      isInstantReloadEnabled,
      showDropdown,
      isSiteDomainCopied,
      isSitePathCopied,
      isRepositoryCopied,
      isDataBasePathCopied,
      isHostCopied,
      isPublicLinkCopied,
      viewWebsiteValue,
      renderViewWebsiteList,
      renderTerminalList,
      renderPhpVersionList,
      selectedPhp,
      phpVersionList,
      allGit,
      gitAccounts,
      gitUserNames,
      currentGitUser,
      gitUsers,
      displaySyncActionPage,
      isToggleSyncPushPull,
      isDatabaseChecked,
      isBackupChecked,
      isCheckedAllFiles,
      isExpanded,
      gitBranches,
      renderAttachProjectDropdownList,
    } = this.state;

    const {
      isSyncActionPull,
      webSyncFilesCount,
      pushFilesBackup,
      pullFilesBackup,
      pullDatabase,
      pushDatabase,
      pullFiles,
      pushFiles,
      displayNoFileScreen,
    } = webSync?.syncAction || {};
    const { isAllIgnoredSelected, isAllModifiedSelected } =
      this.getPushPullFiles();
    const filesCount = pullFiles?.modifiedFiles.length || '';
    const { syncProcessStatus, pushPullStatus } = webSync || {};

    const modifiedFilesList = isSyncActionPull
      ? pullFiles?.modifiedFiles
      : pushFiles?.modifiedFiles;

    const ignoredFilesList = isSyncActionPull
      ? pullFiles?.ignoredFiles
      : pushFiles?.ignoredFiles;
    let modifiedFiles: WebsyncFile[];
    let ignoredFiles: WebsyncFile[];
    // log.info('incoming', modifiedFilesList, ignoredFilesList);
    if (Array.isArray(modifiedFilesList) && Array.isArray(ignoredFilesList)) {
      modifiedFiles = modifiedFilesList;
      ignoredFiles = ignoredFilesList;
    } else {
      modifiedFiles = [];
      ignoredFiles = [];
    }

    // log.info('syncProcessStatus', syncProcessStatus, webSync);
    log.info('isSyncActionPull', isSyncActionPull, modifiedFiles, ignoredFiles);
    return (
      <div className={classNames(Style.project_setting_dashboard)}>
        <div className={classNames(Style.project_setting_container)}>
          <h1 className={classNames(Style.project_setting_heading)}>
            {_.capitalize(title)}
          </h1>
          <div
            className={classNames(
              Style.project_setting_info_description_action_main,
              // (Uncoment - Add class for overlay  when downloading file process start)
              `${
                syncProcessStatus === SyncActionStatus.PROCESSING ||
                currentProject.projectcurrentState === CurrenState.INCOMPLETE
                  ? Style.project_setting_info_description_action_main_overlay
                  : ''
              }`
            )}
          >
            {descritption !== '' && (
              <TextHighlighter
                customClass={Style.project_setting_info_top_description}
                text={descritption}
                placement={TextHighlighter.getPlacement.BOTTOM}
              />
              // <div
              //   className={classNames(
              //     Style.project_setting_info_top_description
              //   )}
              // >
              //   {descritption}
              // </div>
            )}

            <div className={classNames(Style.project_setting_info_outer)}>
              <IconBox
                icon={getIcon('CLICK_HERE', theme.theme_mode)}
                customClass={classNames(Style.project_setting_click_here)}
                name="Desc"
                tooltip={false}
              />

              {descritption === '' ? (
                <div className={Style.project_setting_info}>
                  <span
                    className={Style.project_setting_add_decription_link}
                    role="presentation"
                    onClick={() => {
                      this.showAddDescriptionModal(currentproject);
                    }}
                  >
                    Click here
                  </span>
                  {' to describe this project and turn it into a space.'}
                </div>
              ) : (
                <div className={Style.project_setting_info}>
                  <span
                    className={Style.project_setting_add_decription_link}
                    role="presentation"
                    onClick={() => {
                      this.showAddDescriptionModal(currentproject);
                    }}
                  >
                    Click here to edit description
                  </span>
                </div>
              )}
            </div>
            <div className={classNames(Style.project_setting_actions)}>
              <Grid
                variant={Grid.getVariant.FLEX}
                placement={Grid.Placement.MIDDLE}
                spacing={Grid.Spacing.BETWEEN}
              >
                <Col
                  customClass={classNames(Style.project_setting_actions_col)}
                >
                  <Button
                    id="project_settings_start_stop_button"
                    text={!Start ? 'Start Site' : 'Stop Site'}
                    size={Button.Size.MEDIUM}
                    onClickListener={() => this.onClickStartStopSite()}
                    disable={is_disabled === Disable.START_STOP}
                    loader={
                      is_disabled === Disable.START_STOP
                        ? getIcon('BUTTON_LOADER', theme.theme_mode)
                        : ''
                    }
                    icon={
                      !Start
                        ? getIcon('START_SITE', theme.theme_mode)
                        : getIcon('STOP_SITE', theme.theme_mode)
                    }
                    // uncomment loader for loading effect on button
                    // for default use below and for colred button import from Icon/common folder
                    // loader={getIcon('BUTTON_LOADER', theme.theme_mode)}
                    // icon={getIcon('START_SITE', theme.theme_mode)}
                    alignIcon={Button.getPosition.LEFT}
                    customClass={classNames(
                      Style.project_setting_actions_icons,
                      Style.project_setting_actions_start_icon
                    )}
                  />
                  {/* {enable when view website button is required}  */}
                  {/* <Button
                  id="project_settings_view_website_button"
                  text="View Website"
                  size={Button.Size.MEDIUM}
                  icon={
                    !Start
                      ? getIcon('VIEW_SITE_DISABLE', theme.theme_mode)
                      : getIcon('VIEW_SITE', theme.theme_mode)
                  }
                  alignIcon={Button.getPosition.LEFT}
                  customClass={classNames(
                    Style.project_setting_actions_icons,
                    Style.project_setting_action_view_site,
                    !Start
                      ? Style.project_setting_action_view_site_disable
                      : Style.project_setting_action_view_site_enable
                  )}
                  disable={!Start}
                  onClickListener={() => this.openWebsite()}
                /> */}
                  {/* {Enable this SelectOption when you need dropdown for view website options } */}
                  <ButtonDropdown
                    customClass={Style.button_dropdown_view_website}
                    id="view_website_select_option"
                    title={viewWebsiteValue}
                    icon={getIcon('VIEW_SITE', theme.theme_mode)}
                    onButtonClickListener={() => {
                      this.checkopenWebsiteDropdown();
                    }}
                    isOptionsRemoved={(isListRemoved) => {
                      this.isViewWebsiteOptionRemoved(isListRemoved);
                    }}
                    iconDropdown={getIcon('DROPDOWN', theme.theme_mode)}
                    selectIcon={getIcon('TICK', theme.theme_mode)}
                    variant={ButtonDropdown.Size.MEDIUM}
                    selectedItem={(item) => {
                      this.onViewWebsiteList(item);
                    }}
                    dropdownList={
                      renderViewWebsiteList ? this.ViewWebsiteList : []
                    }
                  />
                  {/* <Button
                    id="project_settings_public_link_button"
                    text="start hot reload"
                    size={Button.Size.MEDIUM}
                    icon={getIcon('PUBLIC_LINK', theme.theme_mode)}
                    alignIcon={Button.getPosition.LEFT}
                    customClass={classNames(
                      Style.project_setting_actions_icons,
                      Style.project_setting_action_public_link
                    )}
                    onClickListener={() => this.hotReload('enable')}
                  />
                  <Button
                    id="project_settings_public_link_button"
                    text="Stop hot reload"
                    size={Button.Size.MEDIUM}
                    icon={getIcon('PUBLIC_LINK', theme.theme_mode)}
                    alignIcon={Button.getPosition.LEFT}
                    customClass={classNames(
                      Style.project_setting_actions_icons,
                      Style.project_setting_action_public_link
                    )}
                    onClickListener={() => this.hotReload('disable')}
                  /> */}
                  {/* <SelectOptions
                    id="view_website_select_option"
                    clickable={Start}
                    customClass={classNames(
                      Style.project_settings_select_view_website_options
                      // !Start ? Style.project_settings_view_disable : ''
                    )}
                    listOuterClass={
                      Style.project_settings_select_view_website_options_dropdown
                    }
                    parentClass={Style.select_view_website_outer}
                    value={viewWebsiteValue}
                    width="100%"
                    selectBoxIcon={
                      // !Start
                      //   ? getIcon('VIEW_SITE_DISABLE', theme.theme_mode)
                      getIcon('VIEW_SITE', theme.theme_mode)
                    }
                    icon={
                      // !Start
                      //   ? getIcon('DROPDOWN_DISABLE', theme.theme_mode)
                      getIcon('DROPDOWN', theme.theme_mode)
                    }
                    selectedItem={(item) => this.onViewWebsiteList(item)}
                    selectList={
                      renderViewWebsiteList ? this.ViewWebsiteList : []
                    }
                    selectIcon={getIcon('TICK', theme.theme_mode)}
                    onSelectClickListener={() => {
                      this.checkopenWebsiteDropdown();
                    }}
                    isOptionsRemoved={(isListRemoved) => {
                      this.isViewWebsiteOptionRemoved(isListRemoved);
                    }}
                  /> */}

                  <Button
                    id="project_settings_public_link_button"
                    text="Public Link"
                    size={Button.Size.MEDIUM}
                    icon={getIcon('PUBLIC_LINK', theme.theme_mode)}
                    alignIcon={Button.getPosition.LEFT}
                    customClass={classNames(
                      Style.project_setting_actions_icons,
                      Style.project_setting_action_public_link
                    )}
                    onClickListener={() => this.onClickshowpublicLink()}
                  />
                </Col>
                <Col
                  customClass={classNames(
                    Style.project_setting_actions_col,
                    Style.project_setting_actions_col_right
                  )}
                >
                  {/** Open Terminal New design for window system, for use unccoment */}
                  {(Platform.Win32 === currentPlatform ||
                    Platform.Win32x64 === currentPlatform) && (
                    <IconBox
                      clickable={Start}
                      radius="4px"
                      tooltip
                      name="Open Terminal"
                      variant={IconBox.getVariant.OUTLINED}
                      icon={getIcon('TERMINAL', theme.theme_mode)}
                      selectedItem={(item) => this.onOpenTerminalList(item)}
                      dropdownList={renderTerminalList ? this.terminalList : []}
                      dropdownIcon={getIcon('DROPDOWN', theme.theme_mode)}
                      customClass={classNames(
                        Style.project_settings_open_terminal_dropdown_icon
                      )}
                      listOuterClass={classNames(
                        Style.project_settings_open_terminal_list_outer
                      )}
                      onClickListener={() => this.onSelectOpenTerminalOption()}
                      isOptionsRemoved={(isListRemoved) => {
                        this.isTerminalOptionRemoved(isListRemoved);
                      }}
                    />
                  )}
                  {/* Enable only For mac */}
                  {Platform.Darwin === currentPlatform && (
                    <Tooltip
                      title="Open Terminal"
                      placement={Tooltip.getPlacement.BOTTOM}
                      customClass={classNames(
                        Style.project_setting_actions_copy_link_tooltip,
                        Style.project_setting_icon_gap
                      )}
                    >
                      <Button
                        id="project_settings_terminal_button"
                        icon={getIcon('TERMINAL', theme.theme_mode)}
                        alignIcon={Button.getPosition.LEFT}
                        onClickListener={() => {
                          this.openTerminal('sh');
                        }}
                        customClass={classNames(
                          Style.project_setting_actions_terminal
                        )}
                      />
                    </Tooltip>
                  )}

                  <Tooltip
                    title={!sslFlag ? 'SSL Disabled' : 'SSL Enabled'}
                    placement={Tooltip.getPlacement.BOTTOM}
                    customClass={classNames(
                      Style.project_setting_actions_copy_link_tooltip,
                      Style.project_setting_icon_gap
                    )}
                  >
                    <Button
                      id="project_settings_cert_button"
                      icon={
                        sslFlag && Start
                          ? getIcon('DISABLE_CERTIFICATE', theme.theme_mode)
                          : getIcon('CERTIFICATE', theme.theme_mode)
                      }
                      disable={is_disabled === Disable.CERT_ENABLE_DISABLE}
                      loader={
                        is_disabled === Disable.CERT_ENABLE_DISABLE
                          ? getIcon('BUTTON_LOADER', theme.theme_mode)
                          : ''
                      }
                      alignIcon={Button.getPosition.LEFT}
                      onClickListener={() => {
                        if (sslFlag) {
                          this.toggleSSL(false);
                        } else {
                          this.toggleSSL(true);
                        }
                      }}
                      customClass={classNames(
                        Style.project_setting_actions_cert
                      )}
                    />
                  </Tooltip>

                  <Tooltip
                    title="Hot Reload"
                    placement={Tooltip.getPlacement.BOTTOM}
                    customClass={classNames(
                      Style.project_setting_actions_copy_link_tooltip,
                      Style.project_setting_icon_gap
                    )}
                  >
                    <Button
                      id="project_settings_hot_reload_button"
                      icon={
                        !isInstantReloadEnabled
                          ? getIcon('START_HOT_RELOAD', theme.theme_mode)
                          : getIcon('STOP_HOT_RELOAD', theme.theme_mode)
                      }
                      disable={is_disabled === Disable.HOTRELOAD}
                      loader={
                        is_disabled === Disable.HOTRELOAD
                          ? getIcon('BUTTON_LOADER', theme.theme_mode)
                          : ''
                      }
                      alignIcon={Button.getPosition.LEFT}
                      onClickListener={() =>
                        this.hotReload(
                          isInstantReloadEnabled ? 'disable' : 'enable'
                        )
                      }
                      customClass={classNames(
                        Style.project_setting_actions_cert
                      )}
                    />
                  </Tooltip>

                  <Tooltip
                    title="Delete"
                    placement={Tooltip.getPlacement.BOTTOM}
                    customClass={classNames(
                      Style.project_setting_actions_copy_link_tooltip
                    )}
                  >
                    <Button
                      id="project_settings_delete_button"
                      icon={getIcon('DELETE', theme.theme_mode)}
                      alignIcon={Button.getPosition.LEFT}
                      alignButton="center"
                      onClickListener={this.showDeleteProjectModal}
                      customClass={classNames(
                        Style.project_setting_actions_delete
                      )}
                    />
                  </Tooltip>
                </Col>
              </Grid>
            </div>
          </div>
        </div>
        <div className={classNames(Style.project_setting_inner_container)}>
          {/* Uncomment the class "project_setting_terminal_open" when ternimal is enable */}
          <Tab
            activeTabId={activeTabId}
            radius="4px 4px 0 0"
            tabList={this.tabList}
            onTabClickListener={(item) => this.onTabClickListener(item)}
            customClass={classNames(Style.project_setting_tabs)}
            customTabContent={classNames(
              Style.project_setting_tabs_content,

              // Uncomment - to show overlay when sync process enabled
              // Style.project_setting_info_description_action_main_overlay,
              `${
                syncProcessStatus === SyncActionStatus.PROCESSING
                  ? Style.project_setting_info_description_action_main_overlay
                  : ''
              }`,
              // Remove when add and modified files tab enabled
              tabId === TabId.CLONE_SETTING &&
                !displaySyncActionPage &&
                Style.project_settings_overflow
              // Style.project_setting_terminal_open
            )}
          >
            {/* Uncomment - to show overlay when sync process enabled */}
            {tabId === TabId.CLONE_SETTING &&
              syncProcessStatus === SyncActionStatus.PROCESSING && (
                <div className={Style.project_settings_tab_sync_download}>
                  <img
                    src={getIcon('DOWNLOAD_UPDATE', theme.theme_mode)}
                    alt="Download Sync"
                  />
                  <p ref={this.gitPercentRef}>Processing..</p>
                </div>
              )}
            {tabId === TabId.WEBSITE_SETTINGS ? (
              <div className={classNames(Style.website_setting_outer)}>
                {currentProject.projectcurrentState === CurrenState.COMPLETE ? (
                  <TabPanel
                    id={TabId.WEBSITE_SETTINGS}
                    customClass={classNames(
                      Style.project_setting_tabs_content_website_settings,
                      Style.project_setting_tabs_content_main
                    )}
                  >
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        <strong> MySQL Version: </strong>
                      </Col>
                      <Col>
                        {this.getCurrentVersion(
                          HelperRole.DATABASE,
                          Helpher.Version
                        )}
                      </Col>
                    </Grid>
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        <strong> PHP Version: </strong>
                      </Col>
                      <Col
                        customClass={classNames(
                          Style.project_settings_col_php_version
                        )}
                      >
                        {/* {this.getCurrentVersion(HelperRole.SCRIPT, Helpher.Version)} */}
                        <SelectOptions
                          id="php_versions_select_option"
                          clickable={Start}
                          customClass={classNames(
                            Style.project_settings_select_php_versions_options
                            // !Start ? Style.project_settings_view_disable : ''
                          )}
                          listOuterClass={
                            Style.project_settings_select_php_versions_options_list
                          }
                          parentClass={Style.select_view_website_outer}
                          value={selectedPhp}
                          width="100%"
                          icon={
                            // !Start
                            //   ? getIcon('DROPDOWN_DISABLE', theme.theme_mode)
                            getIcon('DROPDOWN', theme.theme_mode)
                          }
                          selectedItem={(item) =>
                            this.changePhpVersion(item.name)
                          }
                          selectList={
                            renderPhpVersionList ? phpVersionList : []
                          }
                          selectIcon={getIcon('TICK', theme.theme_mode)}
                          onSelectClickListener={() => {
                            this.checkphpList();
                          }}
                          isOptionsRemoved={(isListRemoved) => {
                            this.isPHPSelectOptionsRemoved(isListRemoved);
                          }}
                        />
                      </Col>
                      <Col customClass={Style.project_settings_list_beta_col}>
                        <span className={Style.project_settings_list_beta}>
                          BETA
                        </span>
                      </Col>
                      {/* Uncomment the loader code and use when the PHP Version change in process */}
                      {is_disabled === Disable.SWITCH_PHP && (
                        <Col customClass={Style.select_version_loader_col}>
                          <img
                            className={Style.select_version_loader}
                            src={getIcon('BUTTON_LOADER', theme.theme_mode)}
                            alt="loader"
                          />
                        </Col>
                      )}
                    </Grid>
                    {git_login.length === 0 ? null : (
                      <>
                        <Grid
                          variant={Grid.getVariant.FLEX}
                          placement={Grid.Placement.MIDDLE}
                          customClass={classNames(Style.project_setting_list)}
                        >
                          <Col
                            xs={3}
                            md={3}
                            lg={3}
                            customClass={Style.project_settings_col}
                          >
                            <strong> Git Account</strong>
                          </Col>
                          <Col>
                            <strong>Current Account</strong>
                          </Col>
                          <Col>
                            {' '}
                            <select
                              value={currentGitUser}
                              onChange={this.switchGitAccount}
                            >
                              {gitUserNames?.map((user) => {
                                return (
                                  <option key={user} value={user}>
                                    {user}
                                  </option>
                                );
                              })}
                            </select>
                          </Col>
                        </Grid>
                        <Grid
                          variant={Grid.getVariant.FLEX}
                          placement={Grid.Placement.MIDDLE}
                          customClass={classNames(Style.project_setting_list)}
                        >
                          <Col
                            xs={3}
                            md={3}
                            lg={3}
                            customClass={Style.project_settings_col}
                          >
                            <strong> Current Branch</strong>
                          </Col>
                          <Col>{git_branch}</Col>
                        </Grid>
                      </>
                    )}
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        <strong> Web Sever: </strong>
                      </Col>
                      <Col>
                        {this.getCurrentVersion(HelperRole.HTTP, Helpher.name)}
                      </Col>
                    </Grid>
                    {this.phpPortJsx()}
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        {type === RegisterPackages.CUSTOM ? (
                          <strong> Custom Version: </strong>
                        ) : (
                          <strong> {`${type} Version:`} </strong>
                        )}
                      </Col>
                      <Col> {cms_version} </Col>
                    </Grid>
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        <strong> Site Name: </strong>
                      </Col>
                      <Col xs={8} md={8} lg={8}>
                        <TextHighlighter
                          text={title}
                          id="project_details_project_name"
                          placement={TextHighlighter.getPlacement.TOP}
                          customClass={classNames(
                            Style.project_setting_col_detail
                          )}
                        />
                      </Col>
                    </Grid>
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        <strong> Site Domain: </strong>
                      </Col>
                      <Col xs={8} md={8} lg={8}>
                        <TextHighlighter
                          text={
                            Start
                              ? this.getMachineIp('viewOnly')
                              : 'Please start the site.'
                          }
                          id="project_details_site_domain"
                          placement={TextHighlighter.getPlacement.TOP}
                          // uncomment disable prop and for disable css add ->  Style.project_settings_disable_link
                          disable={!Start}
                          customClass={classNames(
                            Style.project_setting_link,
                            !Start && Style.project_settings_disable_link
                          )}
                          // for link to some point use onClickListener
                          onClickListener={() => {
                            Analytics.getInstance().eventTracking(
                              EVENT.Project,
                              `${ACTION.Open}- ${ACTION.Domain}`,
                              LABEL.Unique
                            );
                            this.openWebsite();
                          }}
                        />
                      </Col>
                      {Start && (
                        <Tooltip
                          title={isSiteDomainCopied ? 'Copied' : 'Copy'}
                          placement={Tooltip.getPlacement.TOP}
                          customClass={classNames(
                            Style.project_setting_actions_copy_link_tooltip
                          )}
                        >
                          <Button
                            icon={getIcon('SITE_DOMAIN', theme.theme_mode)}
                            alignIcon={Button.getPosition.LEFT}
                            customClass={classNames(
                              Style.project_setting_actions_copy_link
                            )}
                            onClickListener={() => this.copyLink('siteDomain')}
                            onMouseLeave={() => {
                              this.setState({ isSiteDomainCopied: false });
                            }}
                          />
                        </Tooltip>
                      )}
                    </Grid>
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        sm={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        <strong> Site Path: </strong>
                      </Col>
                      <Col xs={8} md={8} lg={8}>
                        <TextHighlighter
                          // eslint-disable-next-line no-underscore-dangle
                          text={this.getFileManagerPath()}
                          id="project_details_site_path"
                          placement={TextHighlighter.getPlacement.TOP}
                          customClass={classNames(Style.project_setting_link)} // please check Poonam
                          // customClass={classNames(Style.project_setting_col_detail)} // please check Poonam
                          onClickListener={() => {
                            Analytics.getInstance().eventTracking(
                              EVENT.Project,
                              ACTION.SitePath,
                              LABEL.Utility
                            );
                            this.handleFileManager();
                          }}
                        />
                      </Col>
                      <Tooltip
                        title={isSitePathCopied ? 'Copied' : 'Copy'}
                        placement={Tooltip.getPlacement.TOP}
                        customClass={classNames(
                          Style.project_setting_actions_copy_link_tooltip
                        )}
                      >
                        <Button
                          icon={getIcon('SITE_DOMAIN', theme.theme_mode)}
                          alignIcon={Button.getPosition.LEFT}
                          customClass={classNames(
                            Style.project_setting_actions_copy_link
                          )}
                          onClickListener={() => this.copyLink('sitePath')}
                          onMouseLeave={() => {
                            this.setState({ isSitePathCopied: false });
                          }}
                        />
                      </Tooltip>
                    </Grid>
                    {git_login.length === 0 ? null : (
                      <>
                        <Grid
                          variant={Grid.getVariant.FLEX}
                          placement={Grid.Placement.MIDDLE}
                          customClass={classNames(Style.project_setting_list)}
                        >
                          <Col
                            xs={3}
                            md={3}
                            lg={3}
                            customClass={Style.project_settings_col}
                          >
                            <strong> Git Account</strong>
                          </Col>
                          <Col>
                            <strong>Branches</strong>
                          </Col>
                          <Col>
                            {' '}
                            <select value={git_branch}>
                              {gitBranches?.map((branch) => {
                                return (
                                  <option key={branch.id} value={branch.name}>
                                    {branch.name}
                                  </option>
                                );
                              })}
                            </select>
                            <Button onClickListener={() => this.checkout()}>
                              Checkout
                            </Button>
                          </Col>
                        </Grid>
                        <Grid
                          variant={Grid.getVariant.FLEX}
                          placement={Grid.Placement.MIDDLE}
                          customClass={classNames(Style.project_setting_list)}
                        >
                          <Col
                            xs={3}
                            md={3}
                            lg={3}
                            customClass={Style.project_settings_col}
                          >
                            <strong> Current Branch</strong>
                          </Col>
                          <Col>{git_branch}</Col>
                        </Grid>
                      </>
                    )}
                    {git_clone_url && git_clone_url !== '' && (
                      <Grid
                        variant={Grid.getVariant.FLEX}
                        placement={Grid.Placement.MIDDLE}
                        customClass={classNames(Style.project_setting_list)}
                      >
                        <Col
                          xs={3}
                          md={3}
                          lg={3}
                          customClass={Style.project_settings_col}
                        >
                          <strong> Repository: </strong>
                        </Col>
                        <Col xs={8} md={8} lg={8}>
                          <TextHighlighter
                            text={git_clone_url}
                            id="project_details_repository_path"
                            placement={TextHighlighter.getPlacement.TOP}
                            customClass={classNames(Style.project_setting_link)}
                            onClickListener={this.handleGitRepoClick}
                          />
                        </Col>
                        <Tooltip
                          title={isRepositoryCopied ? 'Copied' : 'Copy'}
                          placement={Tooltip.getPlacement.TOP}
                          customClass={classNames(
                            Style.project_setting_actions_copy_link_tooltip
                          )}
                        >
                          <Button
                            icon={getIcon('SITE_DOMAIN', theme.theme_mode)}
                            alignIcon={Button.getPosition.LEFT}
                            customClass={classNames(
                              Style.project_setting_actions_copy_link
                            )}
                            onClickListener={() => {
                              this.copyLink('repository');
                            }}
                            onMouseLeave={() => {
                              this.setState({ isRepositoryCopied: false });
                            }}
                          />
                        </Tooltip>
                      </Grid>
                    )}
                  </TabPanel>
                ) : (
                  <TabPanel
                    id={TabId.WEBSITE_SETTINGS}
                    customClass={classNames(
                      Style.project_setting_tabs_download_files,
                      Style.project_setting_tabs_content_main
                    )}
                  >
                    <IconBox
                      icon={getIcon('DOWNLOAD_UPDATE', theme.theme_mode)}
                      customClass={classNames(
                        Style.project_setting_tabs_download_files_icon
                      )}
                      tooltip={false}
                    />
                    <p
                      className={classNames(
                        Style.project_setting_tabs_download_files_title
                      )}
                    >
                      Downloading files...
                    </p>

                    {/* <ProgressBar
                      showSteps={false}
                      status="Completed"
                      secondaryColor={`${
                        variables[
                          this.getKeyByValue(THEME_COLOR, theme.theme_color)
                        ]
                      }`}
                      primaryColor={
                        theme.theme_mode === 'dark' ? `#373737` : `#cecece`
                      }
                      segments={['100%']}
                      customClass={classNames(Style.startup_progress_bar)}
                      parentClass={classNames(Style.startup_progress_bar_inner)}
                    /> */}
                    <p
                      className={classNames(
                        Style.project_setting_tabs_download_files_info
                      )}
                      ref={this.gitPercentRef}
                    >
                      {currentProject.projectcurrentState ===
                      CurrenState.ERRORED
                        ? `Something went wrong`
                        : webSyncFilesCount || `Processing`}
                      {/* 36.82 MB / 84.41 MB */}
                      {/* {webSyncFilesCount || `Processing`} */}
                      {/* {filesSize && `Total size: ${filesSize}`} */}
                    </p>
                  </TabPanel>
                )}
              </div>
            ) : null}

            {tabId === TabId.DATABASE ? (
              <TabPanel
                id={TabId.DATABASE}
                customClass={classNames(
                  Style.project_setting_tabs_content_main,
                  Style.project_setting_tabs_content_website_settings
                )}
              >
                <Grid
                  variant={Grid.getVariant.FLEX}
                  placement={Grid.Placement.MIDDLE}
                  customClass={classNames(Style.project_setting_list)}
                >
                  <Col
                    xs={3}
                    md={3}
                    lg={3}
                    customClass={Style.project_settings_col}
                  >
                    <strong>Host: </strong>
                  </Col>
                  <Col xs={8} md={8} lg={8}>
                    <TextHighlighter
                      text={
                        Start ? this.getPhpMyAdmin() : 'Please start the site.'
                      }
                      id="project_details_host_path"
                      placement={TextHighlighter.getPlacement.BOTTOM}
                      // for disable css add -  Style.project_settings_disable_link
                      disable={!Start}
                      customClass={classNames(
                        Style.project_setting_link,
                        !Start && Style.project_settings_disable_link
                      )}
                      onClickListener={this.handleManageDatabase}
                    />
                  </Col>
                  {Start && (
                    <Tooltip
                      title={isHostCopied ? 'Copied' : 'Copy'}
                      placement={Tooltip.getPlacement.BOTTOM}
                      customClass={classNames(
                        Style.project_setting_actions_copy_link_tooltip
                      )}
                    >
                      <Button
                        icon={getIcon('SITE_DOMAIN', theme.theme_mode)}
                        alignIcon={Button.getPosition.LEFT}
                        customClass={classNames(
                          Style.project_setting_actions_copy_link
                        )}
                        onClickListener={() => this.copyLink('host')}
                        onMouseLeave={() => {
                          this.setState({ isHostCopied: false });
                        }}
                      />
                    </Tooltip>
                  )}
                </Grid>
                <Grid
                  variant={Grid.getVariant.FLEX}
                  placement={Grid.Placement.MIDDLE}
                  customClass={classNames(Style.project_setting_list)}
                >
                  <Col
                    xs={3}
                    md={3}
                    lg={3}
                    customClass={Style.project_settings_col}
                  >
                    <strong> Export Directory Path: </strong>
                  </Col>
                  <Col xs={8} md={8} lg={8}>
                    <TextHighlighter
                      // eslint-disable-next-line no-underscore-dangle
                      text={this.getDatabasePath()}
                      id="project_details_sites_path"
                      placement={TextHighlighter.getPlacement.TOP}
                      customClass={classNames(Style.project_setting_link)} // please check Poonam
                      // customClass={classNames(Style.project_setting_col_detail)} // please check Poonam
                      onClickListener={() => this.getExportedDatabasePath()}
                    />
                  </Col>
                  <Tooltip
                    title={isDataBasePathCopied ? 'Copied' : 'Copy'}
                    placement={Tooltip.getPlacement.TOP}
                    customClass={classNames(
                      Style.project_setting_actions_copy_link_tooltip
                    )}
                  >
                    <Button
                      icon={getIcon('SITE_DOMAIN', theme.theme_mode)}
                      alignIcon={Button.getPosition.LEFT}
                      customClass={classNames(
                        Style.project_setting_actions_copy_link
                      )}
                      onClickListener={() => this.copyLink('databasePath')}
                      onMouseLeave={() => {
                        this.setState({ isDataBasePathCopied: false });
                      }}
                    />
                  </Tooltip>
                </Grid>
              </TabPanel>
            ) : null}

            {tabId === TabId.UTILITIES ? (
              <TabPanel
                id={TabId.UTILITIES}
                customClass={classNames(
                  Style.project_setting_utilities_tab,
                  Style.project_setting_tabs_content_main
                )}
              >
                <h4
                  className={classNames(
                    Style.project_settings_utilities_heading
                  )}
                >
                  Website Utility
                </h4>
                <Grid
                  variant={Grid.getVariant.FLEX}
                  customClass={classNames(
                    Style.project_setting_utilities_tab_grid
                  )}
                >
                  <Col
                    lg={3}
                    xs={4}
                    md={3}
                    customClass={classNames(
                      Style.project_setting_utilities_tab_col_main,
                      Style.project_setting_utilities_tab_col_main_left
                    )}
                  >
                    <div
                      className={classNames(
                        Style.project_setting_utilities_tab_col
                      )}
                    >
                      <Button
                        id="project_settings_file_manager_button"
                        icon={getIcon('FILE_MANAGER', theme.theme_mode)}
                        text="File Manager"
                        alignIcon={Button.getPosition.RIGHT}
                        customClass={classNames(
                          Style.project_setting_utility_button
                        )}
                        onClickListener={() => {
                          Analytics.getInstance().eventTracking(
                            EVENT.Project,
                            ACTION.File,
                            LABEL.Utility
                          );
                          this.handleFileManager();
                        }}
                      />
                    </div>
                  </Col>
                  {utilitylist.includes(utilities.CODE_SERVER) && (
                    <Col
                      lg={3}
                      xs={4}
                      md={3}
                      customClass={classNames(
                        Style.project_setting_utilities_tab_col_main
                      )}
                    >
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          id="project_settings_code_editor_button"
                          icon={getIcon('CODE_EDITOR', theme.theme_mode)}
                          text="Code Editor"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.CODE_SERVER
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() =>
                            this.commonFunction(utility.CODE_SERVER)
                          }
                        />
                      </div>
                    </Col>
                  )}
                </Grid>
                <h4
                  className={classNames(
                    Style.project_settings_utilities_heading
                  )}
                >
                  Database Utility
                </h4>
                <Grid
                  variant={Grid.getVariant.FLEX}
                  customClass={classNames(
                    Style.project_setting_utilities_tab_grid
                  )}
                >
                  <Col
                    lg={3}
                    xs={4}
                    md={3}
                    customClass={classNames(
                      Style.project_setting_utilities_tab_col_main,
                      Style.project_setting_utilities_tab_col_main_left
                    )}
                  >
                    <div
                      className={classNames(
                        Style.project_setting_utilities_tab_col
                      )}
                    >
                      <Button
                        id="project_settings_database_manage_button"
                        icon={getIcon('DATABASE_MANAGE', theme.theme_mode)}
                        text="Manage Database"
                        alignIcon={Button.getPosition.RIGHT}
                        customClass={classNames(
                          Style.project_setting_utility_button
                        )}
                        onClickListener={() => this.handleManageDatabase()}
                      />
                    </div>
                  </Col>
                  {utilitylist.includes(utility.IMPORTDATABASE) && (
                    <Col
                      lg={3}
                      xs={4}
                      md={3}
                      customClass={classNames(
                        Style.project_setting_utilities_tab_col_main
                      )}
                    >
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('IMPORT', theme.theme_mode)}
                          text="Import Database"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.IMPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() =>
                            this.commonFunction(utility.IMPORTDATABASE)
                          }
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('IMPORT', theme.theme_mode)}
                          text="Fetch Origin"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.IMPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => this.fetchRepo()}
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('IMPORT', theme.theme_mode)}
                          text="Show Changes"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.IMPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => this.showChanges()}
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('IMPORT', theme.theme_mode)}
                          text="Discard Chnages"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.IMPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => this.discard()}
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('IMPORT', theme.theme_mode)}
                          text="Publish repository"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.IMPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => this.publishRepo()}
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('IMPORT', theme.theme_mode)}
                          text="Checkout"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.IMPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => this.checkout()}
                        />
                      </div>
                    </Col>
                  )}
                  {utilitylist.includes(utility.EXPORTDATABASE) && (
                    <Col
                      lg={3}
                      xs={4}
                      md={3}
                      customClass={classNames(
                        Style.project_setting_utilities_tab_col_main
                      )}
                    >
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('EXPORT', theme.theme_mode)}
                          text="Export Database"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.EXPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() =>
                            this.commonFunction(utility.EXPORTDATABASE)
                          }
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('EXPORT', theme.theme_mode)}
                          text="Pull Origin"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.EXPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => {
                            this.pullRepo();
                          }}
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('EXPORT', theme.theme_mode)}
                          text="Commit"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.EXPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => {
                            this.commit();
                          }}
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('EXPORT', theme.theme_mode)}
                          text="Push Origin"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.EXPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => {
                            this.push();
                          }}
                        />
                      </div>
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          icon={getIcon('EXPORT', theme.theme_mode)}
                          text="Create branch"
                          alignIcon={Button.getPosition.RIGHT}
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                          loader={
                            is_disabled === Disable.EXPORT
                              ? getIcon('BUTTON_LOADER', theme.theme_mode)
                              : ''
                          }
                          onClickListener={() => {
                            this.createBranch();
                          }}
                        />
                      </div>
                    </Col>
                  )}
                  {utilitylist.includes(utility.FINDREPLACE) && (
                    <Col
                      lg={3}
                      xs={4}
                      md={3}
                      customClass={classNames(
                        Style.project_setting_utilities_tab_col_main,
                        Style.project_setting_utilities_tab_col_main_right
                      )}
                    >
                      <div
                        className={classNames(
                          Style.project_setting_utilities_tab_col
                        )}
                      >
                        <Button
                          id="project_settings_search_replace_button"
                          icon={getIcon('FIND_REPLACE', theme.theme_mode)}
                          text="Find &amp; Replace"
                          alignIcon={Button.getPosition.RIGHT}
                          onClickListener={() =>
                            this.commonFunction(utilities.FINDREPLACE)
                          }
                          customClass={classNames(
                            Style.project_setting_utility_button
                          )}
                        />
                      </div>
                    </Col>
                  )}
                  <Col
                    lg={3}
                    xs={4}
                    md={3}
                    customClass={classNames(
                      Style.project_setting_utilities_tab_col_main,
                      Style.project_setting_utilities_tab_col_main_right
                    )}
                  >
                    <div
                      className={classNames(
                        Style.project_setting_utilities_tab_col
                      )}
                    >
                      <Button
                        id="project_settings_search_replace_button"
                        icon={getIcon('FIND_REPLACE', theme.theme_mode)}
                        text="Key Actions"
                        alignIcon={Button.getPosition.RIGHT}
                        onClickListener={this.sshDBActions}
                        customClass={classNames(
                          Style.project_setting_utility_button
                        )}
                      />
                    </div>
                  </Col>
                </Grid>
                {/* Comment for the go to extention notification use in future */}
                {/* <Card
                  customClass={classNames(
                    Style.project_setting_go_to_extention
                  )}
                >
                  <Col>
                    <p>
                      Looking for more extension? Get the most out of Stackabl
                      with Add-ons
                    </p>
                  </Col>
                  <Button
                    text="Go to Extension"
                    variant={Button.getVariant.TEXT}
                    customClass={classNames(
                      Style.project_setting_extention_button
                    )}
                  />
                </Card> */}
              </TabPanel>
            ) : null}
            {/* -------------- WEBSITE CLONE Section start here --------------- */}
            {tabId === TabId.CLONE_SETTING && displayNoFileScreen && (
              // <! =========  No file and Add File screen start here =======!>
              <TabPanel
                id={TabId.WEBSITE_SETTINGS}
                customClass={classNames(
                  Style.project_setting_tabs_download_files,
                  Style.project_setting_tabs_content_main,
                  Style.project_section_tabs_content_file_button
                )}
              >
                <IconBox
                  icon={getIcon('NO_FILES', theme.theme_mode)}
                  tooltip={false}
                  width="50px"
                />

                <h2 className={Style.project_setting_no_file_title}>
                  No files to push/pull
                </h2>
                <Button
                  customClass={Style.project_setting_no_file_button}
                  text="Add Files"
                  size={Button.Size.MEDIUM}
                  icon={getIcon('ADD', theme.theme_mode)}
                  alignIcon={Button.getPosition.LEFT}
                  onClickListener={this.noNewFileHandler}
                />
              </TabPanel>
              // <! =========  No file and Add File screen end here =======!>
            )}

            {tabId === TabId.CLONE_SETTING &&
              syncProcessStatus !== SyncActionStatus.PROCESSING &&
              displaySyncActionPage && (
                // <! =========  Push and Pull  screen start here =======!>
                <TabPanel
                  id={TabId.WEBSITE_SETTINGS}
                  customClass={classNames(
                    Style.project_setting_tabs_download_files,
                    Style.project_setting_tabs_content_main,
                    Style.project_section_tabs_content_file_button
                  )}
                >
                  <h2 className={Style.project_setting_file_tab_title}>
                    Sync files to server
                  </h2>
                  <div className={Style.project_setting_file_btn_wrapper}>
                    <Button
                      text="PUSH"
                      size={Button.Size.MEDIUM}
                      icon={getIcon('PUSH', theme.theme_mode)}
                      alignIcon={Button.getPosition.LEFT}
                      onClickListener={() => this.handleSyncAction(false)}
                    />
                    <div className={Style.project_setting_file_or_text}>OR</div>
                    <Button
                      text="PULL"
                      size={Button.Size.MEDIUM}
                      icon={getIcon('PULL', theme.theme_mode)}
                      alignIcon={Button.getPosition.LEFT}
                      onClickListener={() => this.handleSyncAction(true)}
                    />
                  </div>

                  {/* <p className={Style.project_setting_file_tab_description}>
                  Last successful sync date and time: Monday, 29 March 2021,
                  11.18 PM
                </p> */}
                </TabPanel>
                // <! =========  Push and Pull  screen end here =======!>
              )}
            {tabId === TabId.CLONE_SETTING &&
              !displaySyncActionPage &&
              !displayNoFileScreen && (
                <div
                  className={Style.project_setting_tabs_content_clone_settings}
                >
                  <TabPanel
                    id={TabId.CLONE_SETTING}
                    customClass={classNames(
                      Style.project_setting_tabs_content_main,
                      Style.project_setting_tabs_content_clone_settings
                    )}
                  >
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      spacing={Grid.Spacing.BETWEEN}
                      customClass={classNames(Style.project_setting_sync_file)}
                    >
                      <Col>
                        <Grid
                          variant={Grid.getVariant.FLEX}
                          placement={Grid.Placement.MIDDLE}
                        >
                          <Col customClass={Style.sync_text}>
                            {`Total Files:${filesCount}`}
                          </Col>
                          <Col customClass={Style.border_left}>
                            <CheckBox
                              customClass={Style.sync_backup_checkbox}
                              key="checkbox_backup_selected"
                              id="checkbox_backup_selected"
                              name="checkbox"
                              rightLabel="Backup"
                              radius="3px"
                              icon={Tick}
                              checked={
                                isSyncActionPull
                                  ? pullFilesBackup
                                  : pushFilesBackup
                              }
                              onChangeListener={(e) => {
                                this.toggleFilesbackupCheck(e, true);
                              }}
                            />
                          </Col>
                          <Col customClass={Style.border_left}>
                            <CheckBox
                              customClass={Style.sync_backup_checkbox}
                              key="checkbox_Database_selected"
                              id="checkbox_Database_selected"
                              name="checkbox"
                              rightLabel="Database"
                              radius="3px"
                              icon={Tick}
                              checked={
                                isSyncActionPull ? pullDatabase : pushDatabase
                              }
                              onChangeListener={(e) => {
                                this.toggleFilesbackupCheck(e, false);
                              }}
                            />
                          </Col>
                        </Grid>
                      </Col>
                      <Col customClass={Style.push_pull_col}>
                        <Switch
                          leftTitle="Push"
                          rightTitle="Pull"
                          checked={isSyncActionPull}
                          size={Switch.Size.SMALL}
                          customClass={Style.switch_push_pull}
                          onClickListener={this.selectSyncOperation}
                        />
                      </Col>

                      <Button
                        text="Fetch"
                        customClass={Style.sync_button_right}
                        onClickListener={this.websyncRefreshHandler}
                      />
                    </Grid>
                    <Grid
                      id="expand_grid"
                      variant={Grid.getVariant.FLEX}
                      customClass={Style.sync_checklist_checkbox_file}
                    >
                      <Col xs={6} sm={6} md={6} lg={6}>
                        <h4
                          className={classNames(
                            Style.project_settings_sync_heading
                          )}
                        >
                          Modified Files
                          <Tooltip
                            title={isExpanded ? 'Minimize' : 'Expand'}
                            placement={Tooltip.getPlacement.LEFT}
                            customClass={Style.expand_right}
                          >
                            <Button
                              icon={getIcon('TERMINAL', theme.theme_mode)}
                              alignIcon={Button.getPosition.LEFT}
                              customClass={classNames(
                                Style.sync_button_left,
                                Style.button_icon
                              )}
                              onClickListener={this.onClickExpandListener}
                            />
                          </Tooltip>
                        </h4>
                        <Grid
                          variant={Grid.getVariant.FLEX}
                          placement={Grid.Placement.MIDDLE}
                          customClass={Style.checkbox_add_file_wrapper}
                        >
                          <Col>
                            <CheckBox
                              key="checkbox_ignored_file_name"
                              id="checkbox_ignored_file_name"
                              name="checkbox_ignored_file_name"
                              rightLabel="File name"
                              radius="3px"
                              customClass={Style.checkbox_label}
                              icon={Tick}
                              checked={isAllModifiedSelected}
                              onChangeListener={(e) => {
                                // log.info(e.target.checked, 'checkbox testing');
                                this.setAllFilesStatus(true, e.target.checked);
                              }}
                            />
                          </Col>
                          <Col customClass={Style.padding_disable}>
                            <Button
                              size="sm"
                              text="Add Files"
                              onClickListener={() =>
                                this.onClickAddFileListener(false)
                              }
                            />
                          </Col>
                          {/* <Col customClass={Style.padding_disable}>
                            <IconBox
                              icon={getColoredIcon(
                                'ADD_DESCRIPTION',
                                theme.theme_color
                              )}
                              width="8px"
                              name="Add File"
                              onClickListener={() =>
                                this.onClickAddFileListener(true)
                              }
                            />
                          </Col> */}
                        </Grid>
                        <div className={Style.Sync_checklist_outer}>
                          <Col xs={6} customClass={Style.padding_disable}>
                            <TreeViewUI
                              filesList={modifiedFiles || []}
                              updateTreeListHandler={(
                                selectedPath: string,
                                isSelected: boolean
                              ) =>
                                this.updateTreeList(
                                  selectedPath,
                                  isSelected,
                                  SyncFilesType.ModifiedFiles
                                )
                              }
                              deleteIcon={getIcon('DELETE', theme.theme_mode)}
                            />
                            {/* {this.getModifiedFiles()} */}
                          </Col>
                        </div>
                      </Col>
                      {/* <Col xs={6} sm={6} md={6} lg={6}>
                        <h4
                          className={classNames(
                            Style.project_settings_sync_heading
                          )}
                        >
                          Ignored Files
                          <Tooltip
                            title={isExpanded ? 'Minimize' : 'Expand'}
                            placement={Tooltip.getPlacement.LEFT}
                            customClass={Style.expand_right}
                          >
                            <Button
                              icon={getIcon('TERMINAL', theme.theme_mode)}
                              alignIcon={Button.getPosition.LEFT}
                              customClass={classNames(
                                Style.sync_button_left,
                                Style.button_icon
                              )}
                              onClickListener={this.onClickExpandListener}
                            />
                          </Tooltip>
                        </h4>
                        <Grid
                          variant={Grid.getVariant.FLEX}
                          placement={Grid.Placement.MIDDLE}
                          customClass={Style.checkbox_add_file_wrapper}
                        >
                          <Col>
                            <CheckBox
                              key="checkbox_modified_file_name"
                              id="checkbox_modified_file_name"
                              name="checkbox_modified_file_name"
                              rightLabel="File name"
                              radius="3px"
                              customClass={Style.checkbox_label}
                              icon={Tick}
                              checked={isAllIgnoredSelected}
                              onChangeListener={(e) => {
                                // log.info(e.target.checked, 'checkbox testing');
                                this.setAllFilesStatus(false, e.target.checked);
                              }}
                              // checked={isCheckedAllFiles}
                              // onChangeListener={() =>
                              //   this.setState((prevState) => ({
                              //     isCheckedAllFiles: !prevState.isCheckedAllFiles,
                              //   }))
                              // }
                            />
                          </Col>
                          <Col customClass={Style.padding_disable}>
                            <Button
                              size="sm"
                              text="Add Files"
                              onClickListener={() =>
                                this.onClickAddFileListener(false)
                              }
                            />
                          </Col>
                        </Grid>
                        <div
                          className={classNames(
                            Style.Sync_checklist_outer,
                            isExpanded ? Style.full_overlay_screen : ''
                          )}
                        > */}
                      {/* <Col xs={12} customClass={Style.padding_disable}> */}
                      {/* {this.getModifiedFiles()} */}
                      {/* <div className={Style.sync_checklist_checkbox}> */}
                      {/* <TreeViewUI
                                filesPathList={ignoredFiles || []}
                                deleteIcon={getIcon('DELETE', theme.theme_mode)}
                              /> */}
                      {/* </div>
                          </Col>
                        </div>
                      </Col> */}
                    </Grid>
                  </TabPanel>
                </div>
              )}
          </Tab>

          {publicLinkShoModal && (
            <Modal
              id={2}
              customClass={classNames(Style.project_setting_public_modal)}
              cancelText={livelink.trim().length ? 'Done' : 'Cancel'}
              onCancelClickListener={this.onClickshowpublicLink}
              customFooterClass={classNames(
                Style.project_setting_public_modal_buttons
              )}
              loader={
                is_disabled === Disable.PUBLIC_LINK
                  ? getIcon('LOADER', theme.theme_mode)
                  : ''
              }
              size={Modal.Size.XTRA_LARGE}
            >
              <div className={classNames(Style.project_setting_container)}>
                <h1 className={classNames(Style.project_setting_heading)}>
                  Public Link
                </h1>
                <div
                  className={classNames(Style.project_setting_modal_content)}
                >
                  <div
                    className={classNames(
                      Style.project_setting_public_modal_link_main
                    )}
                  >
                    <IconBox
                      icon={getIcon('PUBLIC_LINK', theme.theme_mode)}
                      customClass={classNames(
                        Style.project_setting_public_modal_link_icon
                      )}
                      tooltip={false}
                    />
                    {/* add path when generate publick  and add disable button */}
                    <span
                      className={classNames(
                        Style.project_setting_public_modal_text
                      )}
                    >
                      {!livelink ? 'No link generated yet' : livelink}
                    </span>
                    {/* for copy enable button of copy */}
                    {livelink && (
                      <Button
                        text={isPublicLinkCopied ? 'Copied' : 'Copy Link'}
                        onClickListener={
                          isPublicLinkCopied
                            ? undefined
                            : () => {
                                this.copyLink('publicLink');
                              }
                        }
                        variant={Button.getVariant.TEXT}
                        customClass={classNames(
                          Style.project_setting_public_modal_copy_link,
                          isPublicLinkCopied &&
                            Style.project_setting_public_modal_copy_link_copied
                        )}
                        onMouseLeave={() => {
                          this.setState({ isPublicLinkCopied: false });
                        }}
                      />
                    )}
                  </div>
                  <div>
                    {/* for disable remove variant and add disable prop, text should be 'Disable Link' */}
                    <Button
                      id="project_settings_generate_link_button"
                      text={livelink ? 'Disable Link' : 'Generate Link'}
                      variant={!livelink ? Button.getVariant.CONTAINED : ''}
                      customClass={classNames(
                        Style.project_setting_public_modal_create_link
                      )}
                      disable={is_disabled === Disable.PUBLIC_LINK}
                      loader={
                        is_disabled === Disable.PUBLIC_LINK
                          ? getIcon('BUTTON_LOADER', theme.theme_mode)
                          : ''
                      }
                      onClickListener={() => this.enableDisableLiveLink()}
                      size={Button.Size.MEDIUM}
                    />
                  </div>
                </div>
                <div
                  className={classNames(
                    Style.project_setting_divider,
                    Style.project_setting_divider_space
                  )}
                />
              </div>
            </Modal>
          )}

          {syncshowModal && (
            <Modal
              id={1}
              ConfirmationText="Continue"
              cancelVariant="text"
              cancelText="Cancel"
              onCancelClickListener={this.onClicksyncshowModal}
              customClass={classNames(Style.project_setting_sync_modal)}
              customFooterClass={classNames(
                Style.project_setting_sync_modal_buttons
              )}
              yesButtonVariant="contained"
              size={Modal.Size.XTRA_LARGE}
            >
              <div className={classNames(Style.project_setting_container)}>
                <h1 className={classNames(Style.project_setting_heading)}>
                  Sync
                </h1>
                <p className={classNames(Style.project_setting_modal_content)}>
                  Sorry! Your token has expired, please enter a new token
                </p>
                <Grid
                  variant={Grid.getVariant.FLEX}
                  customClass={classNames(
                    Style.project_setting_modal_content_input_row
                  )}
                >
                  <Col lg={12}>
                    <Input
                      id="1"
                      type="text"
                      value={pasteToken}
                      name="pasteToken"
                      customClass={classNames(Style.project_setting_input)}
                      labelText="Paste Token"
                      onChangeListener={this.handleChange}
                      labelCustomClass={classNames(
                        Style.project_setting_input_label
                      )}
                      cancelIcon={getIcon('CLEAR', theme.theme_mode)}
                      onClearTextListener={this.onClearTokenInput}
                    />
                  </Col>
                </Grid>
              </div>
            </Modal>
          )}
        </div>

        <div
          onClick={() => this.enableBottomNotification()}
          className={
            is_disabled !== Disable.DEFAUTL ? classNames(Style.overlay) : ''
          }
          role="presentation"
        />

        {/* start stop bottom notification is  handle in hoc here start stop used for loader only */}
        {is_disabled !== Disable.DEFAUTL &&
          is_disabled !== Disable.START_STOP &&
          showBottomNotification && (
            <BottomNotification
              floating
              // eslint-disable-next-line no-underscore-dangle
              bottom={BottomNotification.bottom._15}
              // autoRemove - enable for auto remove notifocation
              id="start_stop"
              customClass={Style.project_setting_bottom_notification}
            >
              <div
                className={classNames(
                  Style.project_setting_bottom_notification_content
                )}
              >
                <IconBox
                  tooltip={false}
                  icon={getIcon('INFORMATION', theme.theme_mode)}
                />
                <div
                  className={classNames(
                    Style.project_setting_bottom_notification_title
                  )}
                >
                  {`${notificationMessage}`}.
                </div>
              </div>
            </BottomNotification>
          )}
        {/* <! =========  Sync Screen bottom bar start here =======!> */}
        {/* <! =========  Note: Enable when sync screen is true =======!> */}
        {tabId === TabId.WEBSITE_SETTINGS && !webSync && (
          <BottomNotification customClass={Style.project_settings_sync_bar}>
            <div className={Style.project_settings_tab_sync_content}>
              <SelectOptions
                id="ssh_key_attach_select_option"
                customClass={classNames(
                  Style.project_settings_dropdown_attach_options
                )}
                customDropdownClass={
                  Style.project_settings_dropdown_attach_options_dropdown
                }
                listOuterClass={
                  Style.project_settings_attach_options_dropdown_list
                }
                parentClass={
                  Style.project_settings_dropdown_attach_options_outer
                }
                value="Attach Project"
                icon={getIcon('DROPDOWN', theme.theme_mode)}
                selectedItem={(item) => {
                  this.openDropdownToAttachProject(item);
                }}
                selectList={
                  renderAttachProjectDropdownList ? this.attachProjectList : []
                }
                isOptionsRemoved={(isListRemoved) => {
                  this.isAttachProjectOptionRemoved(isListRemoved);
                }}
              />
            </div>
          </BottomNotification>
        )}
        {tabId === TabId.CLONE_SETTING &&
          !displaySyncActionPage &&
          !displayNoFileScreen &&
          syncProcessStatus !== SyncActionStatus.PROCESSING && (
            <BottomNotification customClass={Style.project_settings_sync_bar}>
              <div className={Style.project_settings_tab_sync_content}>
                {/* <span className={Style.project_settings_tab_sync_text}>
        {((tabId === TabId.WEBSITE_SETTINGS &&
          !(webSync && Object.keys(webSync).length)) ||
          (tabId === TabId.CLONE_SETTING &&
            !displaySyncActionPage &&
            !displayNoFileScreen &&
            syncProcessStatus !== SyncActionStatus.PROCESSING)) && (
          <BottomNotification customClass={Style.project_settings_sync_bar}>
            <div className={Style.project_settings_tab_sync_content}>
              <span className={Style.project_settings_tab_sync_text}>
                dev.stackabl.io
              </span> */}
                <Button
                  text="SSH Keys"
                  customClass={Style.project_settings_text_button}
                  onClickListener={this.showSSHModal}
                  variant={Button.getVariant.TEXT}
                  size={Button.Size.SMALL}
                />
                <SelectOptions
                  id="ssh_key_attach_select_option"
                  customClass={classNames(
                    Style.project_settings_dropdown_attach_options
                  )}
                  customDropdownClass={
                    Style.project_settings_dropdown_attach_options_dropdown
                  }
                  listOuterClass={
                    Style.project_settings_attach_options_dropdown_list
                  }
                  parentClass={
                    Style.project_settings_dropdown_attach_options_outer
                  }
                  value="Attach Project"
                  icon={getIcon('DROPDOWN', theme.theme_mode)}
                  selectedItem={(item) => {
                    this.openDropdownToAttachProject(item);
                  }}
                  selectList={
                    renderAttachProjectDropdownList
                      ? this.attachProjectList
                      : []
                  }
                  isOptionsRemoved={(isListRemoved) => {
                    this.isAttachProjectOptionRemoved(isListRemoved);
                  }}
                />
                {/* <ButtonDropdown
                customClass={Style.project_settings_dropdown_attach_options}
                customDropdownClass={
                  Style.project_settings_dropdown_attach_options_dropdown
                }
                id="view_website_select_option"
                title="Attach project"
                // icon={getIcon('VIEW_SITE', theme.theme_mode)}
                // onButtonClickListener={() => {
                //   this.checkopenWebsiteDropdown();
                // }}
                isOptionsRemoved={(isListRemoved) => {
                  this.isAttachProjectOptionRemoved(isListRemoved);
                }}
                iconDropdown={getIcon('DROPDOWN', theme.theme_mode)}
                selectIcon={getIcon('TICK', theme.theme_mode)}
                variant={ButtonDropdown.Size.MEDIUM}
                selectedItem={(item) => {
                  this.openDropdownToAttachProject(item);
                }}
                dropdownList={
                  renderAttachProjectDropdownList ? this.attachProjectList : []
                }
              /> */}
                {/* <Button
                text="Attach project"
                // onClickListener={this.openDropdownToAttachProject}
                variant={Button.getVariant.TEXT}
                size={Button.Size.SMALL}
              />
              <IconBox
                width="8px"
                icon={getIcon('CLICK_HERE', theme.theme_mode)}
                name="Edit"
                onClickListener={this.showWebsiteCloneStepsModal}
              /> */}
              </div>
              <Button
                text="Sync Now"
                customClass={Style.project_settings_tab_sync_button}
                onClickListener={this.syncNowHandler}
              />
            </BottomNotification>
          )}

        {/* <! =========  Sync Screen bottom bar end here =======!> */}
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    modalData: state.modal_attributes,
    projectsData: state.project_attributes,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ModalActions, ...ProjectActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ProjectSettings)
);
