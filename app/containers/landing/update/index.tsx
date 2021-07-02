/* eslint-disable react/no-unused-state */
import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { ipcRenderer } from 'electron';
import { Footer, IconBox, Button } from '@stackabl/ui';
import request from '@stackabl/core/render/api';
import logger from '@stackabl/core/shared/logger';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import Analytics, {
  EVENT,
  LABEL,
  ACTION,
} from '@stackabl/core/render/analytics';

import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import Style from './index.scss';
import { getIcon } from '../../../utils/themes/icons';
// import { THEME_COLOR } from '../../../constants/index';
import routes from '../../../constants/routes.json';
import Loading from '../../dashboard/loading';
import { InitialModalState } from '../../../reducers/modal';
import ModalActions, { UpdateStackablType } from '../../../actions/modal';

// const variables = require('../../../global.scss');

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  showUpdateModal: (payload: UpdateStackablType) => void;
}

interface State {
  install: number;
  showLoader: boolean;
  progress: {
    total: number;
    delta: number;
    transferred: number;
    percent: number;
    bytesPerSecond: number;
  };
}

type Props = StateProps & DispatchProps & RouteComponentProps;

const log = logger.scope('Update');

class Update extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showLoader: true,
      install: 0,
      progress: {
        total: 0,
        delta: 0,
        transferred: 0,
        percent: 0,
        bytesPerSecond: 0,
      },
    };
  }

  componentDidMount() {
    Analytics.getInstance().screenView('Update');

    this.updateCheck('check');
    ipcRenderer.on('download-progress', this.downloadProgressHandler);
    ipcRenderer.on('update-downloaded', this.updateDownloadHandler);
    ipcRenderer.on('download-error', this.downloadErr);
  }

  componentDidUpdate(prevProps: Props) {
    const { modalData } = this.props;

    if (
      prevProps.modalData.update_data.cancel !== modalData.update_data.cancel &&
      modalData.update_data.cancel !== false
    ) {
      // cancelled udpate
      this.cancelUpdate();
    }
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(
      'download-progress',
      this.downloadProgressHandler
    );
    ipcRenderer.removeListener('update-downloaded', this.updateDownloadHandler);
    ipcRenderer.removeListener('download-err', this.downloadErr);
  }

  /**
   * @todo Add progress bar to show the downloading of updates.
   * @param _event
   * @param progress obj -- need to see the type
   */
  downloadProgressHandler = (
    _event: any,
    progress: {
      total: number;
      delta: number;
      transferred: number;
      percent: number;
      bytesPerSecond: number;
    }
  ) => {
    log.info('downloadProgressHandler');
    const { showUpdateModal, modalData } = this.props;
    // show update modal and progress in it
    showUpdateModal({
      ...modalData.update_data,
      show: true,
      percentage: Number(progress.percent),
      text: `${this.roundFloat(
        this.convertBytesIntoMB(progress.transferred)
      )} MB / ${this.roundFloat(this.convertBytesIntoMB(progress.total))} MB `,
    });
    this.setState({ progress });
  };

  updateDownloadHandler = () => {
    log.info('updateDownloadHandler');
    this.setState({ install: 2 });
    const { showUpdateModal, modalData } = this.props;
    showUpdateModal({
      ...modalData.update_data,
      show: false,
    });
  };

  updateCheck = async (req: string) => {
    const token = localStorage.getItem('UserToken');
    const checkUpdate = await request(
      EndPoint.UPDATE,
      RegisterPackages.UPDATE,
      [{ action: req, token }]
    );

    if (!checkUpdate) {
      this.redirectToStartup();
    } else {
      this.setState({ showLoader: false });
    }
    log.info('check for update ', checkUpdate);
  };

  downloadErr = (_event: any, err: Error) => {
    const {
      history: { push },
      modalData,
      showUpdateModal,
    } = this.props;
    showUpdateModal({
      ...modalData.update_data,
      show: false,
    });
    push({
      pathname: `${routes.LANDING}${routes.ERROR}`,
      state: {
        error: err,
        origin: routes.UPDATE,
        parent: routes.LANDING,
      },
    });
  };

  updateStackabl = async () => {
    Analytics.getInstance().eventTracking(
      EVENT.Update,
      ACTION.Download,
      LABEL.Unique
    );
    try {
      const { showUpdateModal, modalData } = this.props;
      showUpdateModal({
        ...modalData.update_data,
        show: true,
        percentage: 0,
        text: 'Updating data... Please wait ',
      });
      this.setState({ install: 1 });
      await request(EndPoint.UPDATE, RegisterPackages.UPDATE, [
        { action: 'download' },
      ]);
    } catch (err) {
      const {
        history: { push },
      } = this.props;
      push({
        pathname: `${routes.LANDING}${routes.ERROR}`,
        state: {
          error: err,
          origin: routes.UPDATE,
          parent: routes.LANDING,
        },
      });
    }
  };

  quitAndInstall = async () => {
    await request(EndPoint.UPDATE, RegisterPackages.UPDATE, [
      { action: 'relaunch' },
    ]);
  };

  cancelUpdate = async () => {
    // Used updateAndNotify() when cancel button is clicked. Please call the suitable method instaed of updateAndNotify for cancel functionality.
    Analytics.getInstance().eventTracking(
      EVENT.Update,
      ACTION.Cancel,
      LABEL.Unique
    );
    await request(EndPoint.UPDATE, RegisterPackages.UPDATE, [
      { action: 'cancel' },
    ]);

    const { showUpdateModal, modalData } = this.props;
    showUpdateModal({
      ...modalData.update_data,
      show: false,
    });

    this.redirectToStartup();
  };

  convertBytesIntoMB = (bytes: number) => {
    return this.convertBytesIntoKB(bytes) / 1024;
  };

  convertBytesIntoKB = (bytes: number) => {
    return bytes / 1024;
  };

  roundFloat = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
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

  redirectToStartup = () => {
    const {
      history: { push },
    } = this.props;
    push(routes.LANDING + routes.STARTUP);
  };

  skipUpdate = () => {
    Analytics.getInstance().eventTracking(
      EVENT.Update,
      ACTION.Cancel,
      LABEL.Unique
    );
    this.redirectToStartup();
  };

  render() {
    const { theme } = this.props;
    const { install, showLoader } = this.state;

    return (
      <div className={classNames(Style.update_landing)}>
        <div
          className={classNames(Style.update_container)}
          style={{
            background: `url(${getIcon(
              'STARTUP_BG_LEFT',
              theme.theme_mode
            )}) no-repeat,
              url(${getIcon('STARTUP_BG_RIGHT', theme.theme_mode)}) no-repeat `,
          }}
        >
          {showLoader && <Loading theme={theme} />}
          {/* Remove HTML Div here its only link move for the next slide */}
          <div role="presentation" className={classNames(Style.emptylink)} />
          {/* Remove HTML Div here its only link move for the next slide end */}
          <div className={classNames(Style.update_wrapper)}>
            <IconBox
              icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
              customClass={classNames(Style.update_icon)}
              name="logo"
              tooltip={false}
            />
            <div className={classNames(Style.update_heading)}>
              <h2 className={classNames(Style.update_title)}>
                A new version of Stackabl is available
              </h2>
              <p className={classNames(Style.update_subtitle)}>
                The version of Stackabl installed is outdated. Please update to
                the new version.
              </p>
            </div>

            {install === 0 && (
              <div className={classNames(Style.update_actions)}>
                <Button
                  id="update_stackabl"
                  text="Update Stackabl"
                  variant={Button.getVariant.CONTAINED}
                  customClass={classNames(Style.update_actions_update_stackbl)}
                  onClickListener={this.updateStackabl}
                />
                <Button
                  id="update_no_right_now"
                  text="Not Right Now"
                  variant={Button.getVariant.TEXT}
                  customClass={classNames(Style.update_actions_text_link)}
                  onClickListener={this.skipUpdate}
                />
              </div>
            )}

            {install === 1 && (
              <div className={classNames(Style.update_actions)}>
                {/* Need to add Progree bar */}
                {/* <Button
                  id="Progress_stackabl"
                  text={`Downloading (${this.roundFloat(
                    this.convertBytesIntoMB(progress.transferred)
                  )} / ${this.roundFloat(
                    this.convertBytesIntoMB(progress.total)
                  )}), (${this.roundFloat(
                    progress.percent
                  )}), ${this.roundFloat(
                    this.convertBytesIntoMB(progress.bytesPerSecond)
                  )} kb/s`}
                  variant={Button.getVariant.TEXT}
                  customClass={classNames(Style.update_actions_text_link)}
                />
                <Button
                  id="cancel_stackabl"
                  text="Cancel"
                  variant={Button.getVariant.TEXT}
                  customClass={classNames(Style.update_actions_text_link)}
                  onClickListener={this.cancelUpdate}
                /> */}
              </div>
            )}

            {install === 2 && (
              <div className={classNames(Style.update_actions)}>
                <Button
                  id="relaunch_stackabl"
                  text="Relaunch"
                  variant={Button.getVariant.CONTAINED}
                  customClass={classNames(Style.update_actions_update_stackbl)}
                  onClickListener={this.quitAndInstall}
                />
              </div>
            )}
            {/* <div className={classNames(Style.update_actions)}>
              <Button
                id="update_stackabl"
                text="Update Stackabl"
                variant={Button.getVariant.CONTAINED}
                customClass={classNames(Style.update_actions_update_stackbl)}
              />
              <Button
                id="update_no_right_now"
                text="Not Right Now"
                variant={Button.getVariant.TEXT}
                customClass={classNames(Style.update_actions_text_link)}
              />
            </div> */}
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
    modalData: state.modal_attributes,
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(ModalActions, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToAction)(Update)
);
