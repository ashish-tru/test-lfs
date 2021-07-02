import React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { Footer, IconBox, Button } from '@stackabl/ui';
import { callVerifyTokenAPI } from '@stackabl/core/render/request';
import { systemLocation } from '@stackabl/core/render/common';
import { ipcRenderer } from 'electron';
import logger from '@stackabl/core/shared/logger';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RequestToSocket from '@stackabl/core/render/api/index';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';

import Analytics, {
  ACTION,
  LABEL,
  EVENT,
} from '@stackabl/core/render/analytics';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import Style from './index.scss';
import { getIcon } from '../../../utils/themes/icons';
// import { THEME_COLOR } from '../../../constants/index';
import routes from '../../../constants/routes.json';
import env_variable from '../../../constants/index';
import Loading from '../../dashboard/loading';
import {
  NotificationContentType,
  NotificationKeys,
} from '../../../actions/notification';
import displayNotification from '../../../utils/common/notification';

// const variables = require('../../../global.scss');
const log = logger.scope('Login-UI');

interface StateProps {
  theme: InitialThemeState;
}

interface State {
  showLoader: boolean;
}

type Props = StateProps & RouteComponentProps;
class Login extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showLoader: false,
    };
  }

  componentDidMount() {
    ipcRenderer.on('login-success', (_event, data) => {
      localStorage.setItem('UserToken', data.key);
      localStorage.setItem('UserName', data.first_name);
      localStorage.setItem('UserEmail', data.email);
      localStorage.setItem('UserId', data.uid);
      this.authenticateCreds(true);
    });
    this.authenticateCreds();
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('login-success');
  }

  authenticateCreds = async (skipRemoteCheck = false) => {
    if (skipRemoteCheck) {
      this.redirectHandler();
    } else if (
      localStorage.getItem('UserToken') &&
      localStorage.getItem('UserId')
    ) {
      try {
        this.setState({ showLoader: true });
        const response = await callVerifyTokenAPI();
        const result = response;
        if (!result.data) {
          this.setState({ showLoader: false });
          log.info('Token not verified');
        } else {
          this.redirectHandler();
        }
      } catch (err) {
        log.error(err);
        this.setState({ showLoader: false });
        // ipcRenderer.send('notification', {
        //   title: 'Error',
        //   body: `Unable to connect, please try to login again.`,
        // });
        const payload: NotificationContentType = {
          id: 'NETWORK',
          message: `Unable to connect, please try to login again.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Error',
        };
        displayNotification(payload);
      }
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

  redirectHandler = async () => {
    await RequestToSocket(
      EndPoint.PROJECT_SET_PATH,
      RegisterPackages.skip,
      systemLocation()
    );
    const {
      history: { push },
    } = this.props;
    push(routes.LANDING + routes.UPDATE);
  };

  openBrowser = async () => {
    Analytics.getInstance().eventTracking(
      EVENT.Login,
      ACTION.Login,
      LABEL.Unique
    );
    await RequestToSocket(EndPoint.OPEN_BROWSER, RegisterPackages.skip, [
      env_variable.LOGIN_URL,
    ]);
    // const launch = new Launch();
    // await launch.launchBrowser(env_variable.LOGIN_URL);
    // shell.openExternal(env_variable.LOGIN_URL);
  };

  render() {
    const { theme } = this.props;
    const { showLoader } = this.state;
    return (
      <div className={classNames(Style.login_landing)}>
        <div
          className={classNames(Style.login_container)}
          style={{
            background: `url(${getIcon(
              'STARTUP_BG_LEFT',
              theme.theme_mode
            )}) no-repeat,
              url(${getIcon('STARTUP_BG_RIGHT', theme.theme_mode)}) no-repeat `,
          }}
        >
          <div className={classNames(Style.login_wrapper)}>
            <IconBox
              icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
              customClass={classNames(Style.login_icon)}
              name="logo"
              tooltip={false}
            />
            <div className={classNames(Style.login_heading)}>
              <h2 className={classNames(Style.login_title)}>
                Get more done with the new Stackabl
              </h2>
              <p className={classNames(Style.login_subtitle)}>
                Now more simple, secure, and faster than ever.
              </p>
            </div>
            {showLoader && <Loading theme={theme} />}
            <div className={classNames(Style.login_actions)}>
              <Button
                id="login_stackabl"
                text="Login Using Browser"
                variant={Button.getVariant.CONTAINED}
                customClass={classNames(Style.login_actions_login_stackbl)}
                onClickListener={this.openBrowser}
              />
            </div>
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
  };
};

export default withRouter(connect(mapStateToProps, null)(Login));
