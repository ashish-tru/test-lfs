import React from 'react';

import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { Button, Modal } from '@stackabl/ui';
import logger from '@stackabl/core/shared/logger';
import { shell, remote } from 'electron';
import { bindActionCreators, Dispatch } from 'redux';
import { InitialThemeState } from '../../reducers/theme';
import { RootState } from '../../reducers/types';
import { getIcon } from '../../utils/themes/icons';
import Style from './index.scss';
import { InitialModalState } from '../../reducers/modal';
import ModalAction, { ModalDataType } from '../../actions/modal';
import env_variable from '../../constants/index';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}
interface State {
  loader: boolean;
}
interface DispatchProps {
  showReleaseModal: (payload: ModalDataType) => void;
}
type Props = StateProps & RouteComponentProps & DispatchProps;
const log = logger.scope('ReleaseUpdate');

class ReleaseUpdate extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loader: false,
    };
  }

  togglePopup = () => {
    log.info('Close Release Modal');
    const { showReleaseModal, modalData } = this.props;
    showReleaseModal({
      ...modalData.release_update,
      show: false,
    });
  };

  render() {
    const { theme } = this.props;
    const { loader } = this.state;
    return (
      <>
        <Modal
          id={1}
          loader={loader ? getIcon('LOADER', theme.theme_mode) : ''}
          loaderTitle="Loading..."
          parentClass={classNames(Style.release_update_modal_outer)}
          customClass={classNames(Style.release_update_modal)}
          header={
            <div className={Style.release_update_modal_header}>
              <div className={Style.release_update_modal_header_content}>
                <h2 className={Style.release_update_title}>
                  Stackabl Update {remote.app.getVersion()}
                </h2>
                <p className={Style.release_update_subtitle}>
                  New Features and Improvements
                </p>
              </div>
              <img
                alt="update stackabl logo"
                className={classNames(Style.release_update_modal_icon)}
                src={getIcon('STACKABL_RELEASE', theme.theme_mode)}
                // src={config.RELEASE_LOGS_IMAGE}
                // src={release_l}
                // onLoad={() => {
                //   this.setState({ isImageLoaded: true });
                // }}
              />
              <div
                role="presentation"
                className={classNames(Style.release_update_close_icon)}
                onClick={() => {
                  this.togglePopup();
                }}
              >
                <img alt="close" src={getIcon('CLOSE', theme.theme_mode)} />
              </div>
            </div>
          }
        >
          <div className={classNames(Style.release_update_modal_content)}>
            <ul className={classNames(Style.release_update_modal_content_list)}>
              {/* <li key={`release_lo-1`}>{'This is new Feature 1'}</li>
              <li key={`release_lo-2`}>{'This is new Feature 2'}</li> */}
              {env_variable.RELEASE_LOG_ARRAY.map((list) => {
                return <li key={`${list}release_log`}>{list}</li>;
              })}
            </ul>
            <Button
              customClass={classNames(Style.release_update_modal_button)}
              text="Learn More"
              onClickListener={() => {
                shell.openExternal(env_variable.STACKABL_RELEASE);
              }}
            />
          </div>
        </Modal>
      </>
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
  return bindActionCreators(ModalAction, dispatch);
};
export default withRouter(
  connect(mapStateToProps, mapDispatchToAction)(ReleaseUpdate)
);
