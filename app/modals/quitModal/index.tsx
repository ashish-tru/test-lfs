/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';

import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { IconBox, Modal } from '@stackabl/ui';
// import { bindActionCreators, Dispatch } from 'redux';
import logger from '@stackabl/core/shared/logger';
import { bindActionCreators, Dispatch } from 'redux';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import request from '@stackabl/core/render/api';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import { ipcRenderer } from 'electron';
import constants from '@stackabl/core/shared/constants';
import ModalAction, { ModalDataType } from '../../actions/modal';
import { InitialModalState } from '../../reducers/modal';
import Style from './index.scss';
import { getIcon } from '../../utils/themes/icons';
import { RootState } from '../../reducers/types';
import { InitialThemeState } from '../../reducers/theme';
import {
  NotificationContentType,
  NotificationKeys,
} from '../../actions/notification';
import displayNotification from '../../utils/common/notification';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}
interface State {
  loader: boolean;
}
interface DispatchProps {
  showQuitModal: (payload: ModalDataType) => void;
}
type Props = StateProps & RouteComponentProps & DispatchProps;
const log = logger.scope('quitModal');
class QuitModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loader: false,
    };
  }

  actionOnClick = async (parameter: string) => {
    const {
      showQuitModal,
      modalData,
      modalData: { quit_data },
    } = this.props;
    log.info(parameter, quit_data);

    switch (parameter) {
      case 'No':
        log.info('parameter', parameter);
        showQuitModal({
          ...modalData.quit_data,
          show: !quit_data.show,
          yes: false,
          no: true,
          dont_show_again: quit_data.dont_show_again,
        });
        break;
      case 'Yes':
        log.info('parameter', parameter);
        this.setState({ loader: true });
        try {
          // for stoping & removing all utilities
          await request(EndPoint.LOGOUT, RegisterPackages.skip, ['logout']);
          log.info('quit completed');
          ipcRenderer.send(constants.event.Quit_APP, parameter);
        } catch (err) {
          ipcRenderer.send(constants.event.Quit_APP, parameter);

          log.info('quit model error', err);
        }
        break;
      case 'Warn Again':
        log.info('parameter', parameter);

        showQuitModal({
          ...quit_data,
          dont_show_again: quit_data.dont_show_again,
        });
        break;
      default:
        break;
    }
  };

  render() {
    const { theme } = this.props;
    const { loader } = this.state;
    return (
      <>
        <Modal
          id={1}
          ConfirmationText="Yes"
          cancelText="Cancel"
          loader={loader ? getIcon('LOADER', theme.theme_mode) : ''}
          loaderTitle="Loading..."
          onCancelClickListener={() => {
            this.actionOnClick('No');
          }}
          onYesClickListener={() => {
            this.actionOnClick('Yes');
          }}
          parentClass={classNames(Style.quit_main_modal)}
          customClass={classNames(Style.quit_modal)}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.quit_modal_btn)}
        >
          <div className={classNames(Style.quit_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.quit_modal_icon)}
              icon={getIcon('ACCOUNT_LOGOUT_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>
              Are you sure you want
              <br />
              to quit?
            </h1>
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
  connect(mapStateToProps, mapDispatchToAction)(QuitModal)
);
