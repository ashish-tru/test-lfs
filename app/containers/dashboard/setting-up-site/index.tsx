/* eslint-disable react/destructuring-assignment */
import React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { IconBox, ProgressBar, ToastNotification } from '@stackabl/ui';

import logger from '@stackabl/core/shared/logger';
import Database from '@stackabl/core/render/Database';
import {
  ProjectsSchema,
  WebsiteClone,
} from '@stackabl/core/render/Database/schema';
import request from '@stackabl/core/render/api';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import communicationChannel, {
  removeCommunicationChannel,
} from '@stackabl/core/render/api/communicationEvent';
import Constants from '@stackabl/core/shared/constants/index';
import {
  startStopsite,
  ProjectEnumType,
  projectTypeString,
  CurrenState,
} from '@stackabl/core/render/common';

import { Dispatcher } from '@stackabl/git';
// import { Account } from '@stackabl/git/src/models/account';

import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import {
  SiteState,
  location as locationTypeFromCore,
} from '@stackabl/core/shared/dependencies';
import Analytics, { EVENT, ACTION } from '@stackabl/core/render/analytics';

import _ from 'lodash';
import FuntionList from '@stackabl/core/shared/constants/functionlist';
import { ipcRenderer } from 'electron';

import Style from './index.scss';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import routes from '../../../constants/routes.json';
import { getIcon } from '../../../utils/themes/icons';
import { THEME_COLOR, FLAGS } from '../../../constants/index';
import ProjectActions from '../../../actions/projects';
import { IList } from '../../../utils/ListSchema';
import { initialState } from '../../../reducers/projects';
import GitProcessManagement from '../../../utils/git/git-process-management';
import {
  NotificationContentType,
  NotificationKeys,
} from '../../../actions/notification';
import displayNotification from '../../../utils/common/notification';

const variables = require('../../../global.scss');

interface StateProps {
  theme: InitialThemeState;
}

interface DispatchProps {
  currentProject: (payload: IList) => void;
  addNewProject: (payload: IList) => void;
}

type State = {
  currentState: [number, number];
  progress: [number, string][];
  project: LocationState;
  // isGitFetchFailed: boolean;
};
type LocationState = {
  projectUsername: string;
  versionValue: string;
  databaseValue: string;
  projectName: string;
  addDescription: string;
  projectEmail: string;
  projectPass: string;
  type: RegisterPackages;
  id: string;
  location?: locationTypeFromCore;
  projectType: ProjectEnumType;
  gitUrl: string;
  gitLogin: string;
  projectBranchName: string;
  websiteClone: WebsiteClone;
};

interface LocationPropsState {
  location: {
    state: LocationState;
  };
}
type Props = StateProps &
  RouteComponentProps &
  DispatchProps &
  LocationPropsState;

const log = logger.scope('SettingUpSite');

class SettingUpSite extends React.PureComponent<Props, State> {
  // cms = [RegisterPackages.WORDPRESS, RegisterPackages.JOOMLA];

  dispatcher!: Dispatcher;

  constructor(props: Props) {
    super(props);
    const {
      location: { state },
    } = this.props;

    this.state = {
      currentState: [0, 100],
      project: state,
      // isGitFetchFailed: false,
      progress: [
        [0, `Downloading Files`],
        [0, `Configuring Settings`],
        [0, `Fetching Files`],
      ],
    };
    if (state.gitUrl !== '') {
      this.dispatcher = new Dispatcher();
    }
  }

  /**
   * @info Avoid changing the signature of react function such as componentdidmount
   */
  componentDidMount() {
    // to show bottom notification in hoc
    // disableBottomNotification(Disable.SETTING_UP, {});
    this.props.currentProject({ ...initialState.currentProject, loader: true });
    Analytics.getInstance().screenView('Setting Up Site');
    this.init();
  }

  componentWillUnmount() {
    // for removing listner
    removeCommunicationChannel(Constants.event.PROGRESS_UI);
  }

  getKeyByValue = (
    object: { [label: string]: string },
    value: string
  ): string => {
    return (
      Object.keys(object).find((key) => object[key] === value) ||
      'THEME_COLOR_0'
    );
  };

  initiateGithubDownloading = (projectDetail: ProjectsSchema) => {
    // try {
    /**
     * projectDetail.container_name contains the id of the project
     */

    const pathToRepository = projectDetail.location.code;
    const gitUserName = localStorage.getItem('currentUser') || '';
    debugger;
    this.dispatcher.cloneIntoNonEmptyFile(
      projectDetail.git_clone_url,
      pathToRepository,
      projectDetail.git_branch,
      projectDetail.container_name,
      projectDetail.name,
      gitUserName,
      (
        progressData: { value: number },
        projectInfo: { id: string; name: string }
      ) => {
        /**
         * @description progressCallback
         */
        const instanceGit = GitProcessManagement.getInstance();
        instanceGit.cloneProgress(
          projectInfo.id,
          projectInfo.name,
          progressData
        );
        // const { progress } = this.state;
        // log.info(
        //   'HHHHHHHHHHHHHHHHHHHHHHEEEEEEYYYYYYYYYYYYYYYYY Look here',
        //   progress
        // );
        // const arr = progress;
        // arr.splice(3, 1, [
        //   Math.round(progressData.value * 100),
        //   progress[3][1],
        // ]);
        // this.setState({
        //   progress: [...arr],
        //   currentState: [3, Math.round(progressData.value * 100)],
        // });
      },
      (err: Error, projectInfo: { id: string; name: string }) => {
        /**
         * @description errorCallback
         */
        const instanceGit = GitProcessManagement.getInstance();
        instanceGit.cloneError(projectInfo.id, projectInfo.name, err);
        log.error('Error in cloning');
        log.error(err);
      },
      (projectInfo: { id: string; name: string }) => {
        /**
         * @description completeCallback
         */
        const instanceGit = GitProcessManagement.getInstance();
        instanceGit.cloneComplete(projectInfo.id, projectInfo.name);
      },
      (projectInfo: { id: string; name: string }) => {
        /**
         * @description startCallback
         */
        const instance = GitProcessManagement.getInstance();
        instance.cloneStart(projectInfo.id, projectInfo.name);
      }
    );

    // } catch (e) {
    // log.info('Git flow error ', e);
    // const gitError = new Error('Git authentication failed.');
    // const action = request(
    //   EndPoint.SERVICE_FUNCTION,
    //   RegisterPackages.skip,
    //   [
    //     FuntionList.STOP_REMOVE_PROVISON,
    //     [args.response.container_name, args.response.name],
    //   ]
    // );

    // await Promise.allSettled([action]);

    // this.props.currentProject({ ...initialState.currentProject });
    // history.push({
    //   pathname: `${routes.LANDING}${routes.ERROR}`,
    //   state: {
    //     error: gitError,
    //     origin: routes.SETTING_UP_SITE,
    //     parent: routes.DASHBOARD,
    //   },
    // });
    // return;
    // }
  };

  fireEvent = (projectDetail: ProjectsSchema, project: IList) => {
    this.props.addNewProject({ ...project });
    if (projectDetail.projectType === ProjectEnumType.BLANKPROJECT) {
      this.props.currentProject({ ...project, showImportDbModal: false });
      // ipcRenderer.send('notification', {
      //   title: 'All Done',
      //   body: `${_.capitalize(projectDetail.name)} is ready!`,
      // });
      const payload: NotificationContentType = {
        id: 'WEBSITE',
        message: `${_.capitalize(projectDetail.name)} is ready!`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'All Done',
      };
      displayNotification(payload);
    } else if (projectDetail.projectType === ProjectEnumType.CLONEFROMGITHUB) {
      this.props.currentProject({ ...project, showImportDbModal: false });
      this.initiateGithubDownloading(projectDetail);
    } else if (projectDetail.projectType === ProjectEnumType.CLONEWEBSITE) {
      this.props.currentProject({ ...project, showImportDbModal: false });
      this.initiliseWebclone(projectDetail, project);
      /**
       * @toto add check for webclone
       */
    }
  };

  getKeyToStoreInDatabase = (db: Database): { [key: string]: string } => {
    let keysToStore = {};
    const {
      project: { gitUrl, gitLogin, projectType, projectBranchName },
    } = this.state;
    if (projectType === ProjectEnumType.BLANKPROJECT) {
      keysToStore = {
        projectcurrentState: CurrenState.COMPLETE,
        projectType: ProjectEnumType.BLANKPROJECT,
      };
    } else if (projectType === ProjectEnumType.CLONEFROMGITHUB) {
      keysToStore = {
        projectcurrentState: CurrenState.INCOMPLETE,
        projectType: ProjectEnumType.CLONEFROMGITHUB,
        git_clone_url: gitUrl,
        git_login: gitLogin,
        git_branch: projectBranchName,
      };
    } else if (projectType === ProjectEnumType.CLONEWEBSITE) {
      const {
        location: {
          state: {
            websiteClone: { syncObj },
            websiteClone,
            projectName,
            id,
          },
        },
      } = this.props;

      const websync = { ...syncObj };
      if (websync.meta) {
        delete websync.meta;
      }
      const added = db.addWebSync(websync);
      log.info('addwebsync', {
        ...websync,
        // ...websiteClone,
        container_name: id,
        name: projectName,
      });
      keysToStore = {
        projectcurrentState: CurrenState.INCOMPLETE,
        projectType: ProjectEnumType.CLONEWEBSITE,
        webSync: {
          ...websiteClone,
          syncId: added.$loki,
          sshKeyId: websync.sshKeyId,
        },
      };
    } else {
      keysToStore = {};
    }
    return keysToStore;
  };

  initiliseWebclone(projectDetail: ProjectsSchema, project: IList) {
    const {
      location: {
        state: {
          projectName,
          type,
          websiteClone: {
            syncObj: { databaseFields, serverFields, serviceProvider },

            addDBDump,
          },
        },
      },
    } = this.props;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { container_name, location } = projectDetail;
    const argsList = {
      id: container_name,
      name: projectName,
      cms: type,
      location,
    };
    request(EndPoint.WEBSITE_PUSH_PULL, RegisterPackages.WEBSITE_PUSH_PULL, [
      FuntionList.CLONE_WEBSITE,
      {
        serviceProvider,
        args: argsList,
        serverfields: serverFields,
        databasefields: databaseFields,
        isSSHKeyTested: true,
        addDBDump,
      },
    ]);
    /**
     * @todo shift api logic to main process and handle logic from there
     */
  }

  async init() {
    const {
      location: { state },
      history,
    } = this.props;
    try {
      log.info('Data Recieved', { ...state, projectPass: undefined });
      const db: Database = await Database.getInstance();

      communicationChannel(
        Constants.event.PROGRESS_UI,
        (result: [number, number]) => {
          log.info('communicationChannel', result);
          const { progress } = this.state;
          const arr = [...progress];
          arr.splice(result[0], 1, [result[1], progress[result[0]][1]]);
          this.setState({ progress: [...arr], currentState: result });
        }
      );

      const args = await startStopsite({
        projectName: state.projectName,
        projectEmail: state.projectEmail,
        projectPass: state.projectPass,
        type: state.type,
        projectUsername: state.projectUsername,
        versionValue: state.versionValue,
        databaseValue: state.databaseValue,
        addDescription: state.addDescription,
        id: state.id,
        ssl: false,
        location: state.location,
        isCreate: true,
        isInstantReloadEnabled: false,
      });

      if (args.status === SiteState.RUNNING) {
        log.info('Return from Service', args);
        const keyBasedOnProjectType = this.getKeyToStoreInDatabase(db);
        const dataToStore = { ...args.response, ...keyBasedOnProjectType };
        log.info('DATATOSTORE', dataToStore);
        db.addProject(dataToStore);
        const projectDetail = db.getProjectByParam({
          name: state.projectName,
          container_name: state.id,
        });

        log.info('GET data after Store', projectDetail);
        const project: IList = {
          ...initialState.currentProject,
          title: projectDetail.name,
          descritption: projectDetail.description,
          type: projectDetail.type,
          groupTitle: projectDetail.type,
          id: projectDetail.$loki,
          subTitle: projectDetail.container_name,
          timeStamp: projectDetail.update_date,
          flag: '',
          active: true,
          status: projectDetail.status,
          loader: false,
          projectcurrentState: projectDetail.projectcurrentState,
        };
        let projectFlow = '';
        if (ProjectEnumType.CLONEFROMGITHUB === projectDetail.projectType) {
          projectFlow = 'Git Clone';
        }
        if (ProjectEnumType.CLONEWEBSITE === projectDetail.projectType) {
          projectFlow = 'Website Clone';
        }
        Analytics.getInstance().eventTracking(
          EVENT.Dashboard,
          ACTION.Project,
          `${project.type}-${projectFlow} Mysql-${state.databaseValue} PHP-${state.versionValue}`
        );
        if (projectDetail) {
          this.fireEvent(projectDetail, project);
          /**
           * Add setTimeout just to make sure will fire the event before moving to new screen.
           */
          // removeExistNotification();
          setTimeout(() => {
            history.push({
              pathname: `${routes.DASHBOARD}${routes.PROJECT_SETTINGS}`,
              state: { ...projectDetail, meta: [...projectDetail.meta] },
            });
          }, 100);
        } else {
          throw new Error('Unable to find the project.');
        }
      } else {
        throw new Error('Unexpected error occoured.');
      }
    } catch (err) {
      log.error(err);
      log.info('outer catch');
      this.props.currentProject({ ...initialState.currentProject });
      // removeExistNotification();
      history.push({
        pathname: `${routes.LANDING}${routes.ERROR}`,
        state: {
          error: err,
          origin: routes.SETTING_UP_SITE,
          parent: routes.DASHBOARD,
        },
      });
    }
  }

  render() {
    const { theme } = this.props;
    const {
      currentState,
      project: { projectName, type, versionValue, projectType, databaseValue },
      progress,
    } = this.state;
    const projectTypeTitle = projectTypeString[projectType];
    return (
      <div className={classNames(Style.setting_up_site_dashboard)}>
        <div className={classNames(Style.setting_up_site_container)}>
          <h1 className={classNames(Style.setting_up_site_heading)}>
            Hang tight while we setup your website!
          </h1>
          <IconBox
            icon={getIcon('LOADER', theme.theme_mode)}
            customClass={classNames(Style.setting_up_site_logo)}
            name="logo"
            tooltip={false}
            // onClickListener={this.createNewProject}
          />
          <h3 className={classNames(Style.setting_up_site_project_name)}>
            {_.capitalize(projectName)}
          </h3>
          <div className={classNames(Style.setting_up_site_project_detail)}>
            <div
              className={classNames(Style.setting_up_site_project_detail_item)}
            >
              {`Type: ${projectTypeTitle}`}
            </div>
            <div
              className={classNames(Style.setting_up_site_project_detail_item)}
            >
              {`CMS: ${type}`}
            </div>
            <div
              className={classNames(Style.setting_up_site_project_detail_item)}
            >
              {`PHP Version: ${versionValue}`}
            </div>
            <div
              className={classNames(Style.setting_up_site_project_detail_item)}
            >
              {`MySQL Version: ${databaseValue}`}
            </div>
          </div>
          <ProgressBar
            background
            status="Completed"
            secondaryColor={`${
              variables[this.getKeyByValue(THEME_COLOR, theme.theme_color)]
            }`}
            primaryColor={theme.theme_mode === 'dark' ? `#373737` : `#cecece`}
            segments={progress}
            customClass={classNames(Style.setting_up_site_progress_bar)}
          />
          <p
            className={classNames(Style.setting_up_site_project_progress_info)}
          >
            {`${currentState[0] + 1} of ${progress.length}
             Receiving Data... ${currentState[1]}%`}
          </p>
        </div>
        {/* Test for toast notification
        <ToastNotification
          id={'start_stop'}
          // backgroundColor='red']
          autoRemove
          // placement={ToastNotification.getPlacement.BOTTOM}
          title={`Hang on! we are starting your site`}
          icon={getIcon('INFORMATION', theme.theme_mode)}
        />  */}
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ProjectActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(SettingUpSite)
);
