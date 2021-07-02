import React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { IconBox, Button } from '@stackabl/ui';
import { connect } from 'react-redux';
import Analytics, { EVENT } from '@stackabl/core/render/analytics';

import logger from '@stackabl/core/shared/logger';
import { callErrorLogAPI } from '@stackabl/core/render/request';
import fs from 'fs';

import Style from './index.scss';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import { getIcon } from '../../../utils/themes/icons';
import Relaunch from '../../../resources/Icons/Common/relaunch.svg';
import { MapScreenToCode } from '../../../constants/index';

const log = logger.scope('ErrorScreen');

interface StateProps {
  theme: InitialThemeState;
}
interface LocationState {
  location: {
    state: { error: Error; origin: string; parent: string };
  };
}
interface State {
  counter: number;
  errCode: string;
  showRelaunchBtn: boolean;
}
type Props = StateProps & RouteComponentProps & LocationState;

class ErrorHandling extends React.PureComponent<Props, State> {
  timer?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      counter: 60,
      errCode: '',
      showRelaunchBtn: false,
    };
  }

  componentDidMount() {
    Analytics.getInstance().screenView(EVENT.Error);
    const {
      location: {
        state: { origin, error },
      },
    } = this.props;
    const { counter } = this.state;
    this.setErrorCode(origin, error);
    this.timer = setInterval(() => {
      this.setState(
        (prevState) => ({
          counter: prevState.counter - 1 > 0 ? prevState.counter - 1 : 0,
        }),
        () => {
          if (counter === 0) {
            this.redirectHandler();
          }
        }
      );
    }, 1000);
  }

  redirectHandler = () => {
    const {
      history,
      location: {
        state: { parent },
      },
    } = this.props;
    if (this.timer) {
      clearInterval(this.timer);
    }
    history.push(parent);
  };

  /**
   * @description request the error log api end point and upload content of log files
   * @param origin - Origin code for screen from which error originated
   *
   */
  setErrorCode = async (origin: string, error: Error) => {
    try {
      // let randNum = Math.ceil(Math.random() * 1000000);
      const randNum = Date.now();
      let screen: string = MapScreenToCode[origin];
      if (screen === undefined) {
        screen = 'screen';
      }
      const errorCode = `${screen}-${randNum.toString()}`;
      log.error('Error occured with error code', errorCode);
      this.setState({ errCode: errorCode });
      const data = fs.readFileSync(
        logger.transports.file.getFile().path,
        'utf8'
      );
      await callErrorLogAPI(data, error.toString(), errorCode);
      this.setState({ showRelaunchBtn: true });
    } catch (e) {
      this.setState({ showRelaunchBtn: true });
      log.warn('Error in uploading error file', e);
    }
  };

  render() {
    const { errCode, showRelaunchBtn, counter } = this.state;
    const {
      theme,
      location: {
        state: { error },
      },
    } = this.props;

    return (
      <div className={classNames(Style.error_landing)}>
        <div
          className={classNames(Style.error_container)}
          style={{
            background: `url(${getIcon(
              'ERROR_BACKGROUND_LEFT',
              theme.theme_mode
            )}) left center/33%  no-repeat  , url(${getIcon(
              'ERROR_BACKGROUND_RIGHT',
              theme.theme_mode
            )}) right center/33% no-repeat `,
          }}
        >
          <IconBox
            icon={getIcon('ERROR_ICON', theme.theme_mode)}
            customClass={classNames(Style.error_logo)}
            name="logo"
            tooltip={false}
          />
          <h1 className={classNames(Style.error_container_title)}>OOPS!</h1>{' '}
          <p className={classNames(Style.error_container_sub_title)}>
            {error.name}
          </p>
          <div className={classNames(Style.error_container_content)}>
            <p>{error.message}</p>
            <p className={classNames(Style.error_container_content_path)}>
              Reference ID: <span>{errCode}</span>
            </p>
            {!showRelaunchBtn && (
              <p
                className={classNames(
                  Style.error_container_content_path,
                  Style.error_container_content_counting
                )}
              >
                Restarting in:{' '}
                <span>{`${counter} sec${counter > 0 ? 's' : ''}`} </span>
              </p>
            )}
            {showRelaunchBtn && (
              <Button
                customClass={classNames(Style.error_landing_btn)}
                // enable when get icon
                icon={Relaunch}
                onClickListener={this.redirectHandler}
                alignIcon={Button.getPosition.LEFT}
                text="Relaunch Now"
                variant={Button.getVariant.CONTAINED}
              />
            )}

            {/* <Grid
              variant={Grid.getVariant.FLEX}
              alignment={Grid.Alignment.CENTER}
              placement={Grid.Placement.MIDDLE}
              customClass={classNames(
                Style.error_container_relunch_text
              )}
            >
              <IconBox
                customClass={classNames(Style.error_relaunch_icon)}
                icon={getIcon('RELAUNCHING', theme.theme_mode)}
                name="logo"
                tooltip={false}
              />
              <p>Relaunching in 4 seconds...</p>
            </Grid> */}
          </div>
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

export default withRouter(connect(mapStateToProps, null)(ErrorHandling));
