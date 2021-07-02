/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { shell, ipcRenderer } from 'electron';
import { Footer, IconBox, Button } from '@stackabl/ui';
import logger from '@stackabl/core/shared/logger';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import request from '@stackabl/core/render/api/index';
import path from 'path';
import { remote } from 'electron';
import Request from 'request';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import Style from './index.scss';
import { getIcon } from '../../../utils/themes/icons';

import env_variable from '../../../constants/index';
import routes from '../../../constants/routes.json';
const log = logger.scope('LoginNew');
interface StateProps {
  theme: InitialThemeState;
}

type Props = StateProps & RouteComponentProps;
class LoginNew extends React.PureComponent<Props> {
  componentDidMount() {
    ipcRenderer.on('login-success', () => {
      this.authenticateCreds(true);
    });
    this.authenticateCreds();
  }

  /**
   * @description request the api end point and verify the token
   * request and await and verify
   */
  callVerifyTokenAPI = () => {
    const options = {
      method: 'POST',
      url: env_variable.VERIFY_TOKEN_END_POINT,
      headers: {
        'postman-token': 'feb0958f-e7d1-f38c-a432-edab4a678c4c',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
      },
      body: {
        token: localStorage.getItem('UserToken'), // localStorage.getItem('UserToken'),
        user_email: 'paramjit@tru.agency', // static for now as we are sending only token
        current_password: 'Anuu75!@#', // static for now as we are sending only token
        new_password: 'anuu75!@#', // static for now as we are sending only token
        confirm_password: 'anuu75!@#',
      }, // static for now as we are sending only token
      json: true,
    };

    Request(
      options,
      (error: string, _response: string, body: string | object) => {
        if (error) {
          log.info('Error while verifying token');
          log.error(error);
          return;
        }
        log.info('[LoginNewindex.tsx] Response from api ', body);

        if (body === 'Invalid Access Token') {
          log.info('Token not verified');
        } else {
          this.props.history.push(routes.LANDING + routes.STARTUP);
        }
      }
    );
  };

  authenticateCreds = async (skipRemoteCheck = false) => {
    if (localStorage.getItem('UserToken') && localStorage.getItem('UserId')) {
      if (!skipRemoteCheck) {
        const a = this.callVerifyTokenAPI();
        log.info(a);
      } else {
        this.props.history.push(routes.LANDING + routes.STARTUP);
      }
    }
  };

  /**
   * @description not in use, we can un comment this code if want to skip the login code
   */
  init = async () => {
    await request(EndPoint.PROJECT_SET_PATH, RegisterPackages.skip, [
      path.join(remote.app.getPath('documents'), 'stackabl'),
      path.join(remote.app.getAppPath(), process.env.PACKAGE || ''),
      path.join(remote.app.getPath('userData'), 'run'),
      path.join(remote.app.getPath('userData'), 'Electron'),
      '145',
    ]);
    this.props.history.push(routes.LANDING + routes.STARTUP);
  };

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('login-success');
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

  render() {
    const { theme } = this.props;
    return (
      <div className={classNames(Style.startup_landing)}>
        <div
          className={classNames(Style.startup_landing_container)}
          style={{
            background: `url(${getIcon(
              'STARTUP_BG_LEFT',
              theme.theme_mode
            )}) no-repeat,
              url(${getIcon('STARTUP_BG_RIGHT', theme.theme_mode)}) no-repeat `,
          }}
        >
          <div className={classNames(Style.startup_landing_wrapper)}>
            <div className={classNames(Style.startup_landing_heading)}>
              <h2 className={classNames(Style.startup_landing_title)}>
                Welcome to
                <strong> Stackabl </strong>
              </h2>
              <p className={classNames(Style.startup_landing_subtitle)}>
                Good things take time! We’ll be up and running in just a few...
              </p>
            </div>
            <IconBox
              icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
              customClass={classNames(Style.startup_landing_icon)}
              name="logo"
              tooltip={false}
              onClickListener={() => {
                //  shell.openExternal('https://stackoverflow.com/questions/64337625/typeerror-err-invalid-url-invalid-url-on-elasticsearch-api')
                // shell.openExternal('foobar:///?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjQyNCwidmFsaWRhdGVfdG9rZW4iOnRydWV9.bg8zpEgdHGhtHymVnQzlrBWuAI5rbRWnIHNsvq03Liw&login-wth=c3RhY2thYmxlLWFwcA=');
                // history.push(routes.LANDING + routes.LOGIN)
                // history.push(routes.DASHBOARD);
                // this.init();
              }}
            />
            <Button
              text="Login"
              alignButton="center"
              variant={Button.getVariant.CONTAINED}
              size="lg"
              customClass={classNames(Style.landing_login_restartbtn)}
              onClickListener={() => {
                //   shell.openExternal('https://stackoverflow.com/questions/64337625/typeerror-err-invalid-url-invalid-url-on-elasticsearch-api')
                shell.openExternal(env_variable.LOGIN_URL);
                // history.push(routes.LANDING + routes.LOGIN)
              }}
            />
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

export default withRouter(connect(mapStateToProps, null)(LoginNew));
