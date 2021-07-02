/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { remote } from 'electron';
import { Footer, ProgressBar, IconBox } from '@stackabl/ui';

import EndPoint from '@stackabl/core/shared/api/endpoint';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import request from '@stackabl/core/render/api/index';
import db from '@stackabl/core/render/Database';
import Constant from '@stackabl/core/shared/constants';
import logger from '@stackabl/core/shared/logger';
import communicationChannel, {
  removeCommunicationChannel,
} from '@stackabl/core/render/api/communicationEvent';
import { nanoid } from 'nanoid';
import path from 'path';
import os from 'os';
import fsExtra from 'fs-extra';
import cp from 'child_process';
// import shell from 'shelljs';
import { HelperRole } from '@stackabl/core/shared/dependencies';
import Platform, {
  currentPlatform,
} from '@stackabl/core/shared/dependencies/platform';
import Analytics from '@stackabl/core/render/analytics';

import env_variable, { THEME_COLOR } from '../../../constants';

import ProjectActions from '../../../actions/projects';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import Style from './index.scss';
import { getIcon } from '../../../utils/themes/icons';

import routes from '../../../constants/routes.json';
import { IList } from '../../../utils/ListSchema';
import { contentAdaptar } from '../../../utils/common';
import { InitialProjectState, initialState } from '../../../reducers/projects';
// uncomment the code to preview the notification
const variables = require('../../../global.scss');

interface StateProps {
  theme: InitialThemeState;
  projectsData: InitialProjectState;
}

interface State {
  currentState: [number, number];
  progress: [number, string][];
}
interface DispatchProps {
  getAllProjects: (payload: IList[]) => void;
}
type Props = StateProps & RouteComponentProps & DispatchProps;

const log = logger.scope('Startup');

class Startup extends React.PureComponent<Props, State> {
  db!: db;

  constructor(props: Props) {
    super(props);
    this.state = {
      currentState: [0, 0],
      progress: [
        [0, `Checking Files`],
        [0, `Installing Features`],
        [0, `Configuring Settings`],
      ],
    };
  }

  componentDidMount() {
    Analytics.getInstance().screenView('StartUp');
    communicationChannel(Constant.event.UTILITY_PROGRESS, (result) => {
      const { progress } = this.state;
      const arr = [...progress];
      arr.splice(result[0], 1, [result[1], progress[result[0]][1]]);
      this.setState({ progress: arr, currentState: result });
    });

    this.init();
  }

  componentWillUnmount() {
    removeCommunicationChannel(Constant.event.UTILITY_PROGRESS);
  }

  init = async () => {
    // return
    try {
      const appNamePath = path.join(
        remote.app.getPath('home'),
        remote.app.getName()
      );
      const oldPath = path.join(
        remote.app.getPath('userData'),
        'datastore.json'
      );
      fsExtra.ensureDirSync(appNamePath);
      const newPath = path.join(
        remote.app.getPath('home'),
        remote.app.getName(),
        'datastore.json'
      );
      if (!fsExtra.existsSync(newPath) && fsExtra.existsSync(oldPath)) {
        fsExtra.moveSync(oldPath, newPath, { overwrite: true });
        log.info('No need of migration');
        this.startUpService();
      } else {
        await this.migration();
        this.startUpService();
      }
    } catch (err) {
      log.info(err);
      throw err;
    }
  };

  startUpService = async () => {
    this.db = await db.getInstance();
    const {
      getAllProjects,
      projectsData: { allProjects },
    } = this.props;
    try {
      await request(EndPoint.UTILITY_INITILISE, RegisterPackages.ReverseProxy, [
        { skip: true },
      ]);
      this.db.updateCloneWebisteStatus();
      // await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.ReverseProxy, [
      //   functionList.PRE_PROVISON,
      //   [],
      // ]);
      // await request(EndPoint.UTILITY_START, RegisterPackages.CODE_SERVER, [
      //   {skip:true},
      // ]);
      // await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.CODE_SERVER, [
      //   functionList.PRE_PROVISON,
      //   [],
      // ]);
      // await request(EndPoint.UTILITY_START, RegisterPackages.NGROK, [
      //   {skip:true},
      // ]);
      // await request(EndPoint.UTILITY_FUNCTION, RegisterPackages.NGROK, [
      //   functionList.PRE_PROVISON,
      //   [],
      // ]);

      // await request(EndPoint.PROJECT_SET_PATH,RegisterPackages.WORDPRESS,[
      //    path.join(app.getPath('documents'),'Stackabl'),
      //    path.join(app.getAppPath(),'..','packages'),
      //    path.join(app.getPath('userData'),'run'),
      //    path.join(app.getPath('userData'),'Electron'),
      //   '1822'
      // ])
      //  getAllProjects  to remove fluctuation  empty screen
      const userId = localStorage.getItem('UserId');
      getAllProjects(
        contentAdaptar(
          this.db.getAllProject(userId || '', true, 'update_date'),
          allProjects,
          initialState.currentProject
        )
      );
      this.props.history.push(routes.DASHBOARD + routes.LOADER);
    } catch (e) {
      /**
       * @todo add error handling check
       */

      this.props.history.push({
        pathname: `${routes.LANDING}${routes.ERROR}`,
        state: {
          error: e,
          origin: routes.STARTUP,
          parent: routes.LANDING,
        },
      });

      // const err = e;
      // throw err;
    }
  };

  migration = async (): Promise<void> => {
    log.info(`[MIGRATION]: Init`);
    const dbPath = path.join(this.getOldPath('appData'), 'datastore.json');
    const newDbPath = path.join(
      remote.app.getPath('home'),
      remote.app.getName(),
      'datastore.json'
    );
    if (!fsExtra.existsSync(dbPath)) {
      return;
    }
    fsExtra.moveSync(dbPath, newDbPath, { overwrite: true });
    log.info('Moving datastore.json ', dbPath, newDbPath);

    const backend = 'ms';
    const runPath = path.join(remote.app.getPath('userData'), backend);
    const userLocation = path.join(
      remote.app.getPath('documents'),
      env_variable.STACKABL_FOLDER
    );
    const oldUserLocation = this.getOldPath();
    log.info(`[MIGRATION] RUNPATH: ${runPath}`);
    log.info(`[MIGRATION] UserLocation (Documents folder): ${userLocation}`);

    this.db = await db.getInstance();
    const allProjectData = this.db.getAllProjectForUser();
    log.info(`[MIGRATION] All Project To Migrate:`, allProjectData);
    allProjectData.forEach((value) => {
      try {
        const object = { ...value };
        const nanoId = nanoid(Constant.nanoid_Length);
        log.info(`[MIGRATION] Current Project Object:`, object);
        const oldContainerName = object.container_name;

        object.container_name = object.container_name.replace(/_/gi, '-');

        object.credential = {
          username: 'admin',
          password: 'admin',
          email: 'admin@stackabl.site',
        };

        object.location = {
          runPath: `${path.join(runPath, object.user_id, nanoId)}`,
          config: `${path.join(runPath, object.user_id, nanoId)}`,
          logs: `${path.join(
            userLocation,
            object.user_id,
            object.name,
            'logs'
          )}`,
          webRoot: `${path.join(userLocation, object.user_id, object.name)}`,
          code: `${path.join(
            userLocation,
            object.user_id,
            object.name,
            'code'
          )}`,
          database: `${path.join(
            userLocation,
            object.user_id,
            object.name,
            'database'
          )}`,
          confTemplate: `${path.join(
            userLocation,
            object.user_id,
            object.name,
            'conf'
          )}`,
          run: `${path.join(runPath, object.user_id)}`,
          user: `${path.join(userLocation, object.user_id)}`,
        };

        if (
          object.type.toLowerCase() === RegisterPackages.WORDPRESS.toLowerCase()
        ) {
          object.meta = [
            { version: '1.16', name: 'Nginx', role: HelperRole.HTTP },
            { version: '7.3', name: 'PHP', role: HelperRole.SCRIPT },
            { version: '5.7', name: 'MySQL', role: HelperRole.DATABASE },
            { version: '5.3', name: 'WordPress', role: HelperRole.FRAMEWORK },
          ];
          object.cms_version = '5.3';
          object.type = RegisterPackages.WORDPRESS;
        } else {
          object.meta = [
            { version: '1.16', name: 'Nginx', role: HelperRole.HTTP },
            { version: '7.3', name: 'PHP', role: HelperRole.SCRIPT },
            { version: '5.7', name: 'MySQL', role: HelperRole.DATABASE },
            { version: '3.9', name: 'Joomla', role: HelperRole.FRAMEWORK },
          ];
          object.type = RegisterPackages.JOOMLA;
          object.cms_version = '3.9';
        }
        object.migration = true;

        // adding  new keys to make projects before migration compatible
        object.domain = object.container_name;
        object.description = '';
        object.flag = '';
        object.git_clone_url = '';
        object.git_login = '';
        object.sslFlag = false;
        object.domain_url = '.stackabl.site';

        object.container_name = nanoId;

        this.db.updateProject(object);
        log.info(`[MIGRATION] Update to datastore`, object);

        // Migrate data base file

        const databaseLocation = path.join(
          oldUserLocation,
          object.user_id,
          object.name, // we are chnage _ with space below
          'database'
        );

        const newdatabaseLocation = path.join(
          runPath,
          object.user_id,
          object.container_name, // overwritten to nano_id
          'mysql',
          'data'
        );

        const codeLocation = path.join(
          oldUserLocation,
          object.user_id,
          object.name, // not using _ name
          'code'
        );

        const newCodeLocation = path.join(
          userLocation,
          object.user_id,
          object.name,
          'code'
        );

        if (oldContainerName !== object.name) {
          // removing _ with ''
          log.info(`[MIGRATION] Rename the document folder`);
          fsExtra.renameSync(
            path.join(oldUserLocation, object.user_id, oldContainerName),
            path.join(oldUserLocation, object.user_id, object.name)
          );
        }
        log.info(`[MIGRATION] CodeLocation : ${codeLocation}`);
        log.info(`[MIGRATION] New CodeLocation : ${newCodeLocation}`);
        log.info(`[MIGRATION] DatabaseLocation: ${databaseLocation}`);
        log.info(`[MIGRATION] New DatabaseLocation: ${newdatabaseLocation}`);

        let isSiteIntsalled = false;
        if (
          object.type.toLowerCase() === RegisterPackages.WORDPRESS.toLowerCase()
        ) {
          const files = fsExtra.readdirSync(
            path.join(databaseLocation, object.type.toLocaleLowerCase())
          );
          const link = path.join(codeLocation, 'wp-config.php');
          if (files.length > 1 && fsExtra.existsSync(link)) {
            isSiteIntsalled = true;
            // this.modifyfile(link);
          } else if (fsExtra.existsSync(link)) {
            log.info(`[MIGRATION] Removing wp-config file`);
            fsExtra.unlinkSync(link);
          }
        } else {
          const link = path.join(codeLocation, 'configuration.php');
          if (fsExtra.existsSync(link)) {
            isSiteIntsalled = true;
          }
        }

        if (isSiteIntsalled) {
          if (fsExtra.existsSync(databaseLocation)) {
            fsExtra.ensureDirSync(newdatabaseLocation);
            fsExtra.moveSync(databaseLocation, newdatabaseLocation, {
              overwrite: true,
            });
            log.info(
              `[MIGRATION] Database Files Moved: From ${databaseLocation} To ${newdatabaseLocation}`
            );
          } else {
            log.info(
              `[MIGRATION] DatabaseLocation Not Exist : ${databaseLocation}`
            );
          }
        }

        if (fsExtra.existsSync(codeLocation)) {
          if (codeLocation !== newCodeLocation) {
            fsExtra.ensureDirSync(newCodeLocation);
            fsExtra.moveSync(codeLocation, newCodeLocation, {
              overwrite: true,
            });
          }
          log.info(
            `[MIGRATION] Moving Code File: From ${codeLocation} To ${newCodeLocation}`
          );
        } else {
          log.info(`[MIGRATION] CodeLocation Not Exist : ${codeLocation}`);
        }
      } catch (err) {
        log.error(`[MIGRATION] ERROR`, err);
      }
    });

    try {
      await this.removeVmFast(env_variable.VM_NAME);
      const appSettings = this.db.getAppSettings();
      appSettings.migration = true;
      this.db.updateAppSetting(appSettings);
      log.info(`[MIGRATION] AppSetting Updated`);
      log.info(`[MIGRATION]: Ends`);
    } catch (e) {
      log.error(e);
      log.info(`Error in migration code ${e}`);
    }
    // this.dependencyCheck();
  };

  getDockerFolder = (): string => {
    if (Platform.Darwin === currentPlatform) {
      return path.join(
        os.homedir(),
        env_variable.USERFOLDER_DARWIN,
        'docker-machine'
      );
    }

    const docker_version = 'docker-machine.exe';
    return path.join(
      os.homedir(),
      env_variable.USERFOLDER_WINDOWS,
      docker_version
    );
  };

  removeVmFast = (vm: string) => {
    return new Promise((resolve) => {
      cp.exec(`"${this.getDockerFolder()}" rm ${vm} -f -y`, () => {
        try {
          const loc = path.join(
            os.homedir(),
            '.docker',
            'machine',
            'machines',
            vm
          );
          if (fsExtra.existsSync(loc)) {
            // shell.rm('-rf', loc);
            fsExtra.removeSync(loc);
          }
          fsExtra.removeSync(this.getOldPath('appData'));
          resolve(true);
        } catch (e) {
          log.warn('removeVmFast', e.message);
        }
      });
    });
  };

  modifyfile = (param: string): void => {
    try {
      let content = fsExtra.readFileSync(param, {
        encoding: 'utf8',
        flag: 'r',
      });
      if (
        content.includes(
          "define('WP_SITEURL', 'http://' . $_SERVER['HTTP_HOST'])"
        )
      ) {
        log.log(' [startup/index.ts] Code already present in wp-config');
      } else {
        log.log(' [startup/index.ts] Code not found in wp-config');
        const tempStr = content.split(');', 1)[0];
        const newtempStr = `${tempStr});\ndefine('WP_SITEURL', 'http://' . $_SERVER['HTTP_HOST']);\n define('WP_HOME', 'http://' . $_SERVER['HTTP_HOST']`;

        content = content.replace(tempStr, newtempStr);

        fsExtra.writeFileSync(param, content);
      }
    } catch (e) {
      log.info('[startup/index.ts] Error in modify file');
    }
  };

  getOldPath = (param = '') => {
    const type = os.type();
    if (param === 'appData') {
      if (type === 'Darwin') {
        return path.join(os.homedir(), env_variable.USERFOLDER_DARWIN);
      }
      return path.join(os.homedir(), env_variable.USERFOLDER_WINDOWS);
    }
    if (type === 'Darwin') {
      return path.join(os.homedir(), env_variable.PROJECTS_FOLDER_DARWIN);
    }
    return path.join(os.homedir(), env_variable.PROJECTS_FOLDER_WINDOWS);
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

  render() {
    const { theme } = this.props;
    const { currentState, progress } = this.state;
    const currentProgressPercentage = Math.floor(
      (currentState[0] * 100 + currentState[1]) / progress.length
    );
    return (
      <div className={classNames(Style.startup_landing)}>
        <div
          className={classNames(Style.startup_container)}
          style={{
            background: `url(${getIcon(
              'STARTUP_BG_LEFT',
              theme.theme_mode
            )}) no-repeat,
              url(${getIcon('STARTUP_BG_RIGHT', theme.theme_mode)}) no-repeat `,
          }}
        >
          <div className={classNames(Style.startup_wrapper)}>
            <IconBox
              icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
              customClass={classNames(Style.startup_icon)}
              name="logo"
              tooltip={false}
            />
            <div className={classNames(Style.startup_heading)}>
              <h2 className={classNames(Style.startup_title)}>
                Welcome to
                <strong> Stackabl </strong>
              </h2>
              <p className={classNames(Style.startup_subtitle)}>
                Good things take time! We’ll be up and running in just a few...
              </p>
            </div>

            <ProgressBar
              background
              showSteps={false}
              status="Completed"
              secondaryColor={`${
                variables[this.getKeyByValue(THEME_COLOR, theme.theme_color)]
              }`}
              primaryColor={theme.theme_mode === 'dark' ? `#373737` : `#cecece`}
              segments={this.state.progress}
              customClass={classNames(Style.startup_progress_bar)}
              parentClass={classNames(Style.startup_progress_bar_inner)}
            />
            <p className={classNames(Style.startup_loading_info)}>
              <strong>{progress[currentState[0]][1]} </strong>
              <span>{` ${currentState[0] + 1} of ${
                progress.length
              } Receiving Data... ${currentProgressPercentage}%`}</span>
            </p>
          </div>
          <Footer>
            <div>
              <span>&copy; </span>
              <strong>Stackabl. </strong>
              All Rights Reserved.
            </div>
          </Footer>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    projectsData: state.project_attributes,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ProjectActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Startup)
);
