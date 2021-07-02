import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import logger from '@stackabl/core/shared/logger';
import Constants from '@stackabl/core/shared/constants';

import { RootState } from '../../../reducers/types';
import ModalActions, { ModalDataType } from '../../../actions/modal';
import { ipcRenderer } from 'electron';
import { InitialModalState } from '../../../reducers/modal';

const log = logger.scope('landing/hoc');

interface Ownprops {
  // props form parent
  children: React.ReactNode;
}

interface StateProps {
  modalData: InitialModalState;
}

interface DispatchProps {
  showQuitModal: (payload: ModalDataType) => void;
}

type Props = Ownprops & StateProps & DispatchProps;

class Hoc extends React.PureComponent<Props> {
  componentDidMount() {
    const {
      event: { Quit_APP },
    } = Constants;
    log.info("Quit_APP listenerCount: ",ipcRenderer.listenerCount(Quit_APP));
    ipcRenderer.removeAllListeners(Quit_APP);
    ipcRenderer.on(Quit_APP, this.handler);
  }

  handler = () => {
    log.info('listner called  ');
    const { showQuitModal, modalData } = this.props;
    showQuitModal({
      ...modalData.quit_data,
      show: true,
    });
  };

  componentWillUnmount() {
    // const {
    //   event: { Quit_APP },
    // } = Constants;

    // ipcRenderer.removeListener(Quit_APP, this.handler);
  }

  render() {
    const { children } = this.props;
    return <>{children}</>;
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    modalData: state.modal_attributes,
  };
};
const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(ModalActions, dispatch);
};
export default connect(mapStateToProps, mapDispatchToAction)(Hoc);
