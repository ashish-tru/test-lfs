import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import db from '@stackabl/core/render/Database';

// import routes from '../../../constants/routes.json';
import {
  Grid,
  Col,
  Tab,
  TabPanel,
  Button,
  Switch,
  Modal,
  Input,
} from '@stackabl/ui';

import { ipcRenderer } from 'electron';
import logger from '@stackabl/core/shared/logger';
import { callUserInfoAPI } from '@stackabl/core/render/request';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RequestToSocket from '@stackabl/core/render/api/index';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';

import { Dispatcher } from '@stackabl/git';
import { URLActionType } from '@stackabl/git/src/lib/parse-app-url';
import Analytics, {
  EVENT,
  LABEL,
  ACTION,
} from '@stackabl/core/render/analytics';

import _ from 'lodash';
import { ProjectsSchema } from '@stackabl/core/render/Database/schema';
import SSHKeyList from '../../container-components/ssh-key-list';

import Style from './index.scss';
import Loading from '../loading';
import ThemeActions from '../../../actions/theme';
import ModalActions, {
  ModalDataType,
  GithubAccount,
} from '../../../actions/modal';

import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import { InitialModalState } from '../../../reducers/modal';

import { getIcon } from '../../../utils/themes/icons';
import env_variable, { THEME_COLOR, THEME_MODE } from '../../../constants';

const variables = require('../../../global.scss');

const TabId = {
  ACCOUNT_INFO: 0,
  THEME: 1,
  SSH_KEYS: 2,
  LOGOUT: 3,
};

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  getThemeMode: (payload: string) => void;
  getThemeColor: (payload: string) => void;
  showLogOutModal: (payload: ModalDataType) => void;
  showGitSwitchModal: (payload: GithubAccount) => void;
}

interface TabList {
  id: number;
  name: string;
  disable: boolean;
  type: string;
  icon: string;
}

interface ThemeColorsList {
  id: number;
  name: string;
  backgroundColor: string;
  checked: boolean;
  onClickListener: () => void;
}

interface State {
  tabId: number;
  checkedColor: string;
  logoutShowModal: boolean;
  userPersonalshowModal: boolean;
  userPasswordshowModal: boolean;
  currentPassword: string;
  newPassword: string;
  reNewPassword: string;
  showPersonalInfoModal: boolean;
  activeTabId: string;
  selectCheckbox: { [label: string]: boolean };
  firstName: string;
  email: string;
  checkThemeSwitch: boolean;
  tabList: TabList[];
  hiddenPass: string;
  showLoader: boolean;
  isGitLogin: boolean;
  gitEmail: string;
  value: string;
  gitUsers: string;
  gitUserNames: string[];
  currentGitUser: string;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

const log = logger.scope('AccountSettings');

class AccountSettings extends React.Component<Props, State> {
  url_action: (
    event: Electron.IpcRendererEvent,
    { action }: { action: URLActionType }
  ) => void;

  private readonly dispatcher: Dispatcher;

  tabList: TabList[] = [
    {
      id: TabId.ACCOUNT_INFO,
      name: 'Account Info',
      type: 'ACCOUNT_INFO',
      disable: false,
      icon: '',
    },
    {
      id: TabId.THEME,
      name: 'Theme',
      disable: false,
      type: 'ACCOUNT_THEME',
      icon: '',
    },
    {
      id: TabId.SSH_KEYS,
      name: 'SSH keys',
      type: 'ACCOUNT_LOGOUT',
      disable: false,
      icon: '',
    },
    {
      id: TabId.LOGOUT,
      name: 'Logout',
      type: 'ACCOUNT_LOGOUT',
      disable: false,
      icon: '',
    },
  ];

  themeColorList: ThemeColorsList[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      currentPassword: '',
      newPassword: '',
      reNewPassword: '',
      logoutShowModal: false,
      firstName: localStorage.getItem('UserName') || '',
      email: localStorage.getItem('UserEmail') || '',
      userPersonalshowModal: false,
      userPasswordshowModal: false,
      tabId: TabId.ACCOUNT_INFO,
      showPersonalInfoModal: false,
      checkedColor: THEME_COLOR.THEME_COLOR_0,
      activeTabId: '',
      selectCheckbox: {
        dontwarn: false,
      },
      tabList: this.tabList,
      checkThemeSwitch: false,
      hiddenPass: 'password',
      showLoader: false,
      isGitLogin: false,
      gitEmail: '',
      gitUsers: localStorage.getItem('gitUsers') || '',
      gitUserNames: [],
      currentGitUser: '',
    };
    this.dispatcher = Dispatcher.getInstance();
    this.url_action = async (
      _event: Electron.IpcRendererEvent,
      { action }: { action: URLActionType }
    ) => {
      // this.setState({
      //   showLoginSuccessBox: true,
      //   inputError: '',
      // });
      // if (gitUrl) {
      //   await this.repositoryhandler();
      // }
      this.setState({ showLoader: true });
      const {
        modalData: { gitSwitchModal },
        showGitSwitchModal,
      } = this.props;
      this.dispatcher
        .dispatchURLAction(action)
        .then(async (result) => {
          this.setState({
            isGitLogin: !!result,
            gitEmail: result ? result.login : '',
            showLoader: false,
          });

          return result;
        })
        .catch((error) => {
          log.info(error);
          this.setState({ showLoader: false });
        });
    };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.setState({ showLoader: true });
    const curretUser = localStorage.getItem('currentUser');
    const { gitUsers } = this.state;
    if (gitUsers?.length) {
      const gitJson: [] = JSON.parse(gitUsers);
      const gitUserName: string[] = gitJson.map((user: any) => {
        return user.login;
      });
      this.setState({ gitUserNames: gitUserName });
      if (curretUser) {
        this.setState({ currentGitUser: curretUser });
      } else {
        this.setState({ currentGitUser: gitUserName[0] });
      }
    }
    Analytics.getInstance().screenView('Account Settings');
    this.init();
  }

  componentDidUpdate(prevProps: Props) {
    const { modalData, theme } = this.props;
    if (prevProps.theme.theme_mode !== theme.theme_mode) {
      this.updateTabListIcons();
    }
    if (
      prevProps.modalData.gitSwitchModal.yes === false &&
      modalData.gitSwitchModal.yes
    ) {
      const {
        modalData: { gitSwitchModal },
        showGitSwitchModal,
      } = this.props;
      showGitSwitchModal({
        ...gitSwitchModal,
        yes: false,
      });
      this.onClickLoginUsingBrowser(true);
    }

    if (
      (prevProps.modalData.logOut_data.yes !== modalData.logOut_data.yes &&
        modalData.logOut_data.yes !== false) ||
      (prevProps.modalData.logOut_data.no !== modalData.logOut_data.no &&
        modalData.logOut_data.no !== false)
    ) {
      this.updateAndNotify();
    }
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('url-action', this.url_action);
  }

  /**
   * @description Get data from API
   */
  init = async () => {
    try {
      debugger;
      const { theme } = this.props;
      const { tabList, tabId, currentGitUser } = this.state;
      const curretUser = localStorage.getItem('currentUser');
      const { gitUsers } = this.state;
      if (gitUsers?.length) {
        const gitJson: [] = JSON.parse(gitUsers);
        const gitUserName: string[] = gitJson.map((user: any) => {
          return user.login;
        });
        this.setState({ gitUserNames: gitUserName });
        if (curretUser) {
          this.setState({ currentGitUser: curretUser });
        } else {
          this.setState({ currentGitUser: gitUserName[0] });
        }
      }
      const list = tabList.map((item) => {
        let el = item;
        el = {
          ...item,
          icon: getIcon(
            item.id === tabId ? `ACTIVE_${item.type}` : item.type,
            theme.theme_mode
          ),
        };
        return el;
      });

      //  this.dispatcher.initialiseGithubSignIn();
      ipcRenderer.on('url-action', this.url_action);
      const account = await this.dispatcher.getCurrentAccount(currentGitUser);

      this.setState({
        isGitLogin: !!account,
        gitEmail: account?.login || '',
        checkedColor: theme.theme_color,
        checkThemeSwitch: theme.theme_mode === THEME_MODE.DARK,
        tabList: list,
      });

      const userInfo: { [label: string]: string } = await callUserInfoAPI();

      if (userInfo.error) {
        this.setState({
          checkedColor: theme.theme_color,
          checkThemeSwitch: theme.theme_mode === THEME_MODE.DARK,
          tabList: list,
          showLoader: false,
        });
      } else {
        this.setState({
          showLoader: false,
          firstName: userInfo.user_name,
          email: userInfo.user_email,
        });
      }
    } catch (err) {
      log.error(err);
      this.setState({ showLoader: false });
    }
  };

  updateAndNotify = () => {
    const { theme } = this.props;
    const { tabList } = this.state;

    this.setState(
      {
        tabId: TabId.ACCOUNT_INFO,
        activeTabId: `${TabId.ACCOUNT_INFO}`,
      },
      () => {
        const list = tabList.map((tabItem) => {
          let el = tabItem;
          el = {
            ...tabItem,
            icon: getIcon(
              tabItem.id === TabId.ACCOUNT_INFO
                ? `ACTIVE_${tabItem.type}`
                : tabItem.type,
              theme.theme_mode
            ),
          };
          return el;
        });

        this.setState({ tabList: list });
      }
    );
  };

  updateTabListIcons = () => {
    const { theme } = this.props;
    const { tabList, tabId } = this.state;

    const list = tabList.map((item) => {
      let el = item;
      el = {
        ...item,
        icon: getIcon(
          item.id === tabId ? `ACTIVE_${item.type}` : item.type,
          theme.theme_mode
        ),
      };
      return el;
    });

    this.setState({
      tabList: list,
      checkedColor: theme.theme_color,
      checkThemeSwitch: theme.theme_mode === THEME_MODE.DARK,
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

  onTabClickListener = (item: TabList) => {
    const { showLogOutModal, modalData, theme } = this.props;
    const { tabList } = this.state;

    const list = tabList.map((tabItem) => {
      let el = tabItem;
      el = {
        ...tabItem,
        icon: getIcon(
          tabItem.id === item.id ? `ACTIVE_${tabItem.type}` : tabItem.type,
          theme.theme_mode
        ),
      };
      return el;
    });

    this.setState(
      {
        tabId: item.id,
        activeTabId: '',
        tabList: list,
      },
      () => {
        if (item.id === TabId.LOGOUT) {
          Analytics.getInstance().eventTracking(
            EVENT.Setting,
            ACTION.Logout,
            LABEL.Unique
          );
          showLogOutModal({
            ...modalData.logOut_data,
            yes: false,
            no: false,
            show: !modalData.logOut_data.show,
          });
        }
      }
    );
  };

  onToggleThemeModeListener = () => {
    this.setState(
      (prevState) => ({
        checkThemeSwitch: !prevState.checkThemeSwitch,
      }),
      () => {
        const { getThemeMode } = this.props;
        const { checkThemeSwitch } = this.state;
        const theme = checkThemeSwitch ? THEME_MODE.DARK : THEME_MODE.LIGHT;
        Analytics.getInstance().eventTracking(
          EVENT.Setting,
          ACTION.Theme,
          theme
        );
        getThemeMode(theme);
      }
    );
  };

  onSelectThemeColorListener = (colorName: string) => {
    Analytics.getInstance().eventTracking(
      EVENT.Setting,
      ACTION.Colour,
      colorName
    );
    const { getThemeColor } = this.props;
    this.setState({
      checkedColor: colorName,
    });
    getThemeColor(colorName);
  };

  onClickPersonalInfoModal = () => {
    this.setState((prevState) => ({
      showPersonalInfoModal: !prevState.showPersonalInfoModal,
    }));
  };

  onClickuserPasswordshowModal = () => {
    this.setState((prevState) => ({
      userPasswordshowModal: !prevState.userPasswordshowModal,
    }));
  };

  onCheckChangeListener = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const { selectCheckbox } = this.state;

    selectCheckbox[name] = !selectCheckbox[name];
    this.setState({
      selectCheckbox,
    });
  };

  updateDatabase = async (payload: ProjectsSchema) => {
    const metaDB = await db.getInstance();
    metaDB.updateProject(payload);
    // this.updateAllprojectRedux();
  };

  handleChange = (event) => {
    const { project } = this.state;
    // event.persist();
    const newUser = event.target.value;
    localStorage.setItem('currentUser', newUser);
    this.updateDatabase({ ...project, gitLogin: newUser });
    this.setState({ currentGitUser: newUser });
  };

  getHiddenPass = () => {
    const { hiddenPass } = this.state;
    const contant = [];
    for (let i = 1; i <= hiddenPass.length; i += 1) {
      contant.push(<span key={`dot_${i}`} />);
    }
    return contant;
  };

  onClickChangePassword = async () => {
    await RequestToSocket(EndPoint.OPEN_BROWSER, RegisterPackages.skip, [
      `${env_variable.LOGIN_URL}&token=${
        localStorage.getItem('UserToken') || ''
      }`,
    ]);
  };

  onClearFirstName = () => {
    debugger;
    this.setState({ firstName: '' });
  };

  handleSwitch = async () => {
    const {
      showGitSwitchModal,
      modalData: { gitSwitchModal },
    } = this.props;

    showGitSwitchModal({
      ...gitSwitchModal,
      show: true,
    });
  };

  onClickLoginUsingBrowser = async (signInDifferentAccount = false) => {
    const { isGitLogin, currentGitUser, gitUsers } = this.state;
    if (isGitLogin) {
      debugger;
      const account = await this.dispatcher.getCurrentAccount(currentGitUser);
      if (account) {
        // await this.dispatcher.signOut(account).then((result) => {
        //   // this.setState({
        //   //   isGitLogin: false,
        //   // });
        //   this.setState({ currentGitUser: gitUsers[0] });
        //   return result;
        // });
        if (signInDifferentAccount) {
          debugger;
          Analytics.getInstance().eventTracking(
            EVENT.Setting,
            `${ACTION.Git} ${LABEL.Switch}`,
            LABEL.Unique
          );
          await this.dispatcher.authenticateUsingBrowser();
        } else {
          Analytics.getInstance().eventTracking(
            EVENT.Setting,
            `${ACTION.Git} ${LABEL.Logout}`,
            LABEL.Success
          );
        }
      } else {
        localStorage.removeItem('gitUsers');
        this.setState({
          isGitLogin: false,
        });
        // gitTemp.data.isGitLogin = false;
      }
    } else {
      Analytics.getInstance().eventTracking(
        EVENT.Setting,
        `${ACTION.Git} ${LABEL.Login}`,
        LABEL.Success
      );
      await this.dispatcher.authenticateUsingBrowser();
      this.setState({ gitUsers: localStorage.getItem('gitUsers') || '' });
    }
  };

  render() {
    const {
      tabId,
      checkedColor,
      showPersonalInfoModal,
      activeTabId,
      firstName,
      email,
      checkThemeSwitch,
      tabList,
      showLoader,
      isGitLogin,
      gitEmail,
      gitUserNames,
      currentGitUser,
    } = this.state;
    const { theme } = this.props;
    return (
      <div className={classNames(Style.account_settings_dashboard)}>
        <div className={classNames(Style.account_settings_heading)}>
          <h1 className={classNames(Style.account_settings_title)}>Settings</h1>
          <h3 className={classNames(Style.account_settings_sub_title)}>
            Basic settings for the application.
          </h3>
        </div>
        <div className={classNames(Style.account_settings_main_wrapper)}>
          <Tab
            activeTabId={activeTabId}
            radius="4px"
            tabList={tabList}
            onTabClickListener={(item) => this.onTabClickListener(item)}
            customClass={classNames(Style.account_settings_tabs)}
            vertical
            header={
              <Grid
                variant={Grid.getVariant.FLEX}
                placement={Grid.Placement.MIDDLE}
                customClass={classNames(Style.account_settings_user_info)}
              >
                <div>
                  <div
                    className={classNames(Style.account_settings_user_avatar)}
                  >
                    <span>{firstName ? firstName[0] : ''}</span>
                  </div>
                </div>

                <div className={classNames(Style.account_settings_user_name)}>
                  <div>
                    Hi,
                    <br />
                    {firstName}
                  </div>
                </div>
              </Grid>
            }
          >
            {tabId === TabId.ACCOUNT_INFO ? (
              <TabPanel
                id={TabId.ACCOUNT_INFO}
                customClass={classNames(
                  Style.account_settings_tab_panel_account_info
                )}
              >
                <Grid
                  customClass={classNames(
                    Style.account_settings_tab_panel_row,
                    Style.account_settings_tab_panel_row_top
                  )}
                >
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_heading
                    )}
                    lg={12}
                    xs={12}
                  >
                    <h4> Personal Info </h4>
                  </Col>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    spacing={Grid.Spacing.BETWEEN}
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_content
                    )}
                  >
                    <Col
                      xs={2}
                      md={2}
                      lg={2}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col
                      )}
                    >
                      <span> Name: </span>
                    </Col>
                    <Col
                      xs={3}
                      md={3}
                      lg={3}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col
                      )}
                    >
                      <span> {firstName} </span>
                    </Col>
                    <Col
                      xsOffset={3}
                      xs={2}
                      md={2}
                      lg={2}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col_last
                      )}
                    />
                  </Grid>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    spacing={Grid.Spacing.BETWEEN}
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_content,
                      Style.account_settings_tab_panel_row_content_border,
                      Style.account_settings_tab_panel_row_last
                    )}
                  >
                    <Col
                      xs={2}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col
                      )}
                    >
                      <span> Email Address: </span>
                    </Col>
                    <Col
                      xs={3}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col
                      )}
                    >
                      <span> {email} </span>
                    </Col>
                    <Col
                      xsOffset={3}
                      xs={2}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col_last
                      )}
                    />
                  </Grid>
                </Grid>
                <Grid
                  customClass={classNames(Style.account_settings_tab_panel_row)}
                >
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_heading
                    )}
                    lg={12}
                    xs={12}
                  >
                    <h4> Password </h4>
                  </Col>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    spacing={Grid.Spacing.BETWEEN}
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_content,
                      Style.account_settings_tab_panel_row_second
                    )}
                  >
                    <Col
                      xs={3}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col
                      )}
                    >
                      <span> Current password: </span>
                    </Col>
                    <Col
                      xs={3}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col
                      )}
                    >
                      <div
                        className={classNames(
                          Style.account_settings_tab_panel_passowrd
                        )}
                      >
                        {this.getHiddenPass()}
                      </div>
                    </Col>
                    <Col
                      xsOffset={4}
                      xs={2}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col_last
                      )}
                    >
                      <Button
                        text="Change"
                        alignButton="left"
                        customClass={classNames(
                          Style.account_settings_change_btn
                        )}
                        onClickListener={() => {
                          this.onClickChangePassword();
                        }}
                      />
                    </Col>
                  </Grid>
                </Grid>
                <Grid
                  customClass={classNames(Style.account_settings_tab_panel_row)}
                >
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_heading
                    )}
                    lg={12}
                    xs={12}
                  >
                    <h4>GitHub Account </h4>
                  </Col>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    spacing={Grid.Spacing.BETWEEN}
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_content,
                      Style.account_settings_tab_panel_row_second
                    )}
                  >
                    <Col
                      xs={3}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col
                      )}
                    >
                      <span>Logged In As:</span>
                    </Col>
                    <Col
                      xs={3}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col,
                        Style.account_settings_tab_panel_col_buttons
                      )}
                    >
                      {isGitLogin ? (
                        <span>{currentGitUser}</span>
                      ) : (
                        <span
                          className={classNames(
                            Style.account_settings_not_signed_in
                          )}
                        >
                          Not Signed In.
                        </span>
                      )}
                      <Button
                        text={isGitLogin ? 'Logout' : 'Log In '}
                        alignButton="left"
                        variant={Button.getVariant.TEXT}
                        customClass={classNames(
                          Style.account_settings_change_btn,
                          Style.account_settings_login_logout_btn
                        )}
                        onClickListener={() => {
                          this.onClickLoginUsingBrowser();
                        }}
                      />
                    </Col>
                    <Col
                      xsOffset={4}
                      xs={2}
                      customClass={classNames(
                        Style.account_settings_tab_panel_col_last
                      )}
                    >
                      {isGitLogin && (
                        <Button
                          text="Switch Account"
                          alignButton="left"
                          customClass={classNames(
                            Style.account_settings_change_btn,
                            Style.account_settings_change_btn_github
                          )}
                          onClickListener={() => {
                            //  this.onClickChangeAccount();
                            this.handleSwitch();
                          }}
                        />
                      )}
                      <Button
                        text="Add Account"
                        alignButton="left"
                        customClass={classNames(
                          Style.account_settings_change_btn,
                          Style.account_settings_change_btn_github
                        )}
                        onClickListener={() => {
                          //  this.onClickChangeAccount();
                          this.onClickLoginUsingBrowser(true);
                        }}
                      />
                      {/* Pick your account: */}
                      <select
                        value={currentGitUser}
                        onChange={this.handleChange}
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
                </Grid>
              </TabPanel>
            ) : null}
            {tabId === TabId.THEME ? (
              <TabPanel
                id={TabId.THEME}
                customClass={classNames(Style.account_settings_tab_panel_theme)}
              >
                <Grid
                  customClass={classNames(Style.account_settings_tab_panel_row)}
                >
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_heading
                    )}
                    lg={12}
                    xs={12}
                  >
                    <h4> Select Theme Color</h4>
                  </Col>
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_theme_color
                    )}
                  >
                    <ul>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_0,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_0
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_0
                            );
                          }}
                        />
                        <span>Default</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_1,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_1
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_1
                            );
                          }}
                        />
                        <span>Royal Blue</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_2,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_2
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_2
                            );
                          }}
                        />
                        <span>{THEME_COLOR.THEME_COLOR_2}</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_3,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_3
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_3
                            );
                          }}
                        />
                        <span>Light Blue</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_4,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_4
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_4
                            );
                          }}
                        />
                        <span>{THEME_COLOR.THEME_COLOR_4}</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_5,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_5
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_5
                            );
                          }}
                        />
                        <span>{THEME_COLOR.THEME_COLOR_5}</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_6,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_6
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_6
                            );
                          }}
                        />
                        <span>{THEME_COLOR.THEME_COLOR_6}</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_7,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_7
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_7
                            );
                          }}
                        />
                        <span>{THEME_COLOR.THEME_COLOR_7}</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_8,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_8
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_8
                            );
                          }}
                        />
                        <span>{THEME_COLOR.THEME_COLOR_8}</span>
                      </li>
                      <li>
                        <span
                          role="presentation"
                          style={{
                            backgroundColor: variables.THEME_COLOR_9,
                          }}
                          className={classNames(
                            Style.account_settings_tab_panel_row_theme_color_options,
                            checkedColor === THEME_COLOR.THEME_COLOR_9
                              ? Style.checkmark
                              : ''
                          )}
                          onClick={() => {
                            this.onSelectThemeColorListener(
                              THEME_COLOR.THEME_COLOR_9
                            );
                          }}
                        />
                        <span>{THEME_COLOR.THEME_COLOR_9}</span>
                      </li>
                    </ul>
                  </Col>
                </Grid>
                <Grid
                  customClass={classNames(Style.account_settings_tab_panel_row)}
                >
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_heading
                    )}
                    lg={12}
                    xs={12}
                  >
                    <h4> Select Theme Mode </h4>
                  </Col>
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_theme_color
                    )}
                  >
                    <Switch
                      customClass={classNames(Style.theme_switch)}
                      leftTitle="Dark Mode"
                      checked={checkThemeSwitch}
                      onClickListener={this.onToggleThemeModeListener}
                      size="md"
                    />
                  </Col>
                </Grid>
              </TabPanel>
            ) : null}
            {tabId === TabId.SSH_KEYS && (
              <TabPanel
                id={TabId.ACCOUNT_INFO}
                customClass={classNames(
                  Style.account_settings_tab_panel_account_info,
                  Style.account_settings_tab_ssh_key
                )}
              >
                <Grid
                  customClass={classNames(
                    Style.account_settings_tab_panel_row,
                    Style.account_settings_tab_panel_row_top
                  )}
                >
                  <Col
                    customClass={classNames(
                      Style.account_settings_tab_panel_row_heading
                    )}
                    lg={12}
                    xs={12}
                    md={12}
                  >
                    <SSHKeyList />
                  </Col>
                </Grid>
              </TabPanel>
            )}
          </Tab>
        </div>
        {showLoader && <Loading theme={theme} />}

        {showPersonalInfoModal && (
          <Modal
            parentClass={Style.account_setting_edit_user_main_modal}
            cancelVariant="text"
            ConfirmationText="Save"
            cancelText="Cancel"
            yesButtonVariant="contained"
            onCancelClickListener={this.onClickPersonalInfoModal}
            customClass={classNames(Style.account_setting_edit_user_modal)}
            size={Modal.Size.LARGE}
            customButtonClass={classNames(
              Style.account_setting_edit_user_modal_cancel_button
            )}
            buttongGroupClass={classNames(
              Style.account_setting_edit_user_modal_buttonGroup
            )}
          >
            <h4
              className={classNames(Style.account_setting_edit_user_info_title)}
            >
              Edit Info
            </h4>
            <Input
              id="account_Setting_edit_info_firstname"
              type="text"
              value={_.capitalize(firstName)}
              name="firstName"
              customClass={classNames(
                Style.account_setting_edit_user_info_input
              )}
              labelText="Name"
              // onChangeListener={this.handleChange}
              labelCustomClass={classNames(
                Style.account_setting_edit_user_info_input_label
              )}
              cancelIcon={getIcon('CLEAR', theme.theme_mode)}
              onClearTextListener={this.onClearFirstName}
              // uncomment for error
              // errorMessage="test"
            />
            {/* <Input
              id="account_Setting_edit_info_lastname"
              type="text"
              value={lastName}
              name="lastName"
              customClass={classNames(
                Style.account_setting_edit_user_info_input
              )}
              labelText="Last Name"
              onChangeListener={this.handleChange}
              labelCustomClass={classNames(
                Style.account_setting_edit_user_info_input_label
              )}
              cancelIcon={getIcon('CLEAR', theme.theme_mode)}
              onClearTextListener={this.onClearLastName}
              // uncomment for error
              // errorMessage="test"
            /> */}
          </Modal>
        )}
        {/* {userPasswordshowModal && (
          <Modal
            parentClass={Style.account_setting_user_password_main_modal}
            cancelVariant="text"
            ConfirmationText="Save"
            cancelText="Cancel"
            onCancelClickListener={this.onClickuserPasswordshowModal}
            customClass={classNames(Style.account_setting_user_password_modal)}
            size={Modal.Size.LARGE}
            customButtonClass={classNames(
              Style.account_setting_user_password_modal_cancel_button
            )}
            buttongGroupClass={classNames(
              Style.account_setting_user_password_modal_buttonGroup
            )}
            yesButtonVariant="contained"
          >
            <h4
              className={classNames(Style.account_setting_user_password_title)}
            >
              Change your password
            </h4>
            <Input
              type="password"
              name="currentPassword"
              value={currentPassword}
              icon={[
                getIcon('SHOW_PASSWORD', theme.theme_mode),
                getIcon('HIDE_PASSWORD', theme.theme_mode),
              ]}
              customClass={classNames(
                Style.account_setting_user_password_input
              )}
              labelCustomClass={classNames(
                Style.account_setting_user_password_input_label
              )}
              labelText="Current Password"
              onChangeListener={this.handleChange}
              // uncomment for error
              errorMessage="test"
            />
            <Input
              type="password"
              name="newPassword"
              value={newPassword}
              icon={[
                getIcon('SHOW_PASSWORD', theme.theme_mode),
                getIcon('HIDE_PASSWORD', theme.theme_mode),
              ]}
              customClass={classNames(
                Style.account_setting_user_password_input
              )}
              labelText="Enter your new password"
              onChangeListener={this.handleChange}
              labelCustomClass={classNames(
                Style.account_setting_user_password_input_label
              )}
              // uncomment for error
              // errorMessage="test"
            />
            <ProgressBar
              background={false}
              showSteps={false}
              status="Completed"
              secondaryColor={`${
                variables[this.getKeyByValue(THEME_COLOR, theme.theme_color)]
              }`}
              primaryColor={theme.theme_mode === 'dark' ? `#373737` : `#cecece`}
              segments={[
                [100, `Downloading files`],
                [10, `Installing features`],
                [0, `Configuring settings`],
              ]}
              customClass={classNames(
                Style.account_setting_user_password_progress_bar
              )}
            />
            <div
              className={classNames(
                Style.account_setting_user_password_progressbar_status
              )}
            >
              Password strength:
              <span
                className={classNames(Style.account_setting_proggress_strength)}
              >
                Average
              </span>
            </div>

            <Input
              type="password"
              name="reNewPassword"
              icon={[
                getIcon('SHOW_PASSWORD', theme.theme_mode),
                getIcon('HIDE_PASSWORD', theme.theme_mode),
              ]}
              value={reNewPassword}
              customClass={classNames(
                Style.account_setting_user_password_input
              )}
              labelText="Re-type new password"
              onChangeListener={this.handleChange}
              labelCustomClass={classNames(
                Style.account_setting_user_password_input_label
              )}
              // uncomment for error
              // errorMessage="test"
            />
            <h5
              className={classNames(
                Style.account_setting_user_password_list_heading
              )}
            >
              <IconBox
                icon={getIcon('LOCK_ICON', theme.theme_mode)}
                name="logo"
                tooltip={false}
              />
              <span> Your password needs to: </span>
            </h5>
            <ul>
              <li>
                include at least one number or
                <strong> symbol.</strong>
              </li>
              <li>
                include both lower and upper case
                <strong> latin characters. </strong>
              </li>
              <li> be at least 8 characters long. </li>
            </ul>
          </Modal>
        )} */}
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    modalData: state.modal_attributes,
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ThemeActions, ...ModalActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToAction)(AccountSettings)
);
