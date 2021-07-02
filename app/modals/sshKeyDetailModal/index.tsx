import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import db from '@stackabl/core/render/Database';
import log from 'electron-log';
import { bindActionCreators, Dispatch } from 'redux';
import { Input, Modal, TextArea } from '@stackabl/ui';
import { InitialThemeState } from '../../reducers/theme';
import { InitialModalState } from '../../reducers/modal';
import ModalActions, { ModalDataType } from '../../actions/modal';
import { RootState } from '../../reducers/types';

import Style from './index.scss';
import { sshKeyValidation } from '../../utils/common';
import {
  NotificationContentType,
  NotificationKeys,
} from '../../actions/notification';
import displayNotification from '../../utils/common/notification';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  showSSHKeyDetailModal: (payload: ModalDataType) => void;
}

interface State {
  publicKey: string;
  privateKey: string;
  name: string;
  oldKeyName: string;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class ShhKeyDetailModal extends React.Component<Props, State> {
  db!: db;

  constructor(props: Props) {
    super(props);
    this.state = {
      publicKey: '',
      privateKey: '',
      name: '',
      oldKeyName: '',
    };
  }

  componentDidMount() {
    const {
      modalData: {
        ssh_key_detail_data: {
          ssh: { name, publicKey, privateKey },
        },
      },
    } = this.props;
    this.setState({
      name,
      publicKey,
      privateKey,
      oldKeyName: name,
    });
  }

  onChangePublicKeyListener = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    this.setState({
      publicKey: e.target.value,
    });
  };

  onChangePrivateKeyListener = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    this.setState({
      privateKey: e.target.value,
    });
  };

  onChangeKeyNameListener = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    this.setState({
      name: e.target.value,
    });
  };

  validateFields = () => {
    const { name, publicKey, privateKey } = this.state;
    let errMsg;
    errMsg = sshKeyValidation('name', name);
    log.info('eerMMM', errMsg);
    if (errMsg) {
      throw new Error(errMsg);
    }
    errMsg = sshKeyValidation('publicKey', publicKey);
    if (errMsg) {
      throw new Error(errMsg);
    }
    errMsg = sshKeyValidation('privateKey', privateKey);
    if (errMsg) {
      throw new Error(errMsg);
    }
  };

  onSaveSSHKeyDetail = async () => {
    try {
      const {
        modalData: {
          ssh_key_detail_data: { ssh },
        },
      } = this.props;
      const { oldKeyName, name, publicKey, privateKey } = this.state;
      this.validateFields();
      // save updated key data
      const updatedSSHkey = {
        ...ssh,
        name,
        publicKey,
        privateKey,
      };
      const metadb = await db.getInstance();

      const sshKey = await metadb.updateSSHKey(updatedSSHkey, oldKeyName);
      log.info('sshkeysList', sshKey);
      this.hidemodal();
    } catch (err) {
      log.error('[onSaveSSHKeyDetail]', err.message);
      const payload: NotificationContentType = {
        id: 'sshkeyDetail',
        message: err.message,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Edit SSH key',
      };
      displayNotification(payload);
    }
  };

  hidemodal = () => {
    const { showSSHKeyDetailModal, modalData } = this.props;

    showSSHKeyDetailModal({
      ...modalData.ssh_key_detail_data,
      show: !modalData.ssh_key_detail_data.show,
    });
  };

  render() {
    const { privateKey, publicKey, name } = this.state;
    return (
      <Modal
        id={1}
        radius="5px"
        ConfirmationText="Save"
        cancelVariant="text"
        cancelText="Cancel"
        onCancelClickListener={this.hidemodal}
        onYesClickListener={this.onSaveSSHKeyDetail}
        customClass={classNames(Style.shh_key_detail_modal)}
        size={Modal.Size.XTRA_LARGE}
        yesButtonVariant="contained"
        customFooterClass={Style.shh_key_detail_modal_footer}
        buttongGroupClass={Style.shh_key_detail_modal_btn}
        header={
          <h2 className={classNames(Style.heading)}>Edit ssh key Detail</h2>
        }
      >
        <Input
          name="key"
          labelText="Key Name"
          value={name}
          onChangeListener={this.onChangeKeyNameListener}
          customClass={Style.shh_key_input_fields}
        />
        <TextArea
          id={13}
          placeholder="Enter your public key here"
          value={publicKey}
          onChangeListener={this.onChangePublicKeyListener}
          maxLength={-1}
          customClass={Style.shh_key_input_fields}
        />
        <TextArea
          id={14}
          placeholder="Enter your private key here"
          value={privateKey}
          onChangeListener={this.onChangePrivateKeyListener}
          maxLength={-1}
          customClass={Style.shh_key_input_fields}
        />
      </Modal>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    modalData: state.modal_attributes,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ModalActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ShhKeyDetailModal)
);
