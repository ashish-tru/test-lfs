import * as React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import db from '@stackabl/core/render/Database';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { Modal, Button } from '@stackabl/ui';
import logger from '@stackabl/core/shared/logger';
import { RootState } from '../../reducers/types';
import { InitialModalState } from '../../reducers/modal';
import { InitialThemeState } from '../../reducers/theme';
import ModalAction, { AddSSHDataType } from '../../actions/modal';
import SHHKey from '../../containers/container-components/add-ssh-keys';
import Style from './index.scss';
import { SelectedKey, SSH, validateSelectedSSHKey } from '../../utils/common';
import { IList } from '../../utils/ListSchema';
import routes from '../../constants/routes.json';

// import { getIcon } from '../../utils/themes/icons';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
  currentProject: IList;
}

interface DispatchProps {
  showSSHKeys: (payload: AddSSHDataType) => void;
}

type ComponentProps = State & StateProps & RouteComponentProps & DispatchProps;

interface State {
  sshErrorTitle: string;
  sshKeySelected: SelectedKey;
}

const log = logger.scope('modal/sshKeyModal');

class CreateSshKeyModal extends React.Component<ComponentProps, State> {
  db!: db;

  constructor(props: ComponentProps) {
    super(props);
    this.state = {
      sshErrorTitle: '',
      sshKeySelected: {},
    };
  }

  onSaveButtonClicked = () => {
    console.log('Save button clicked');
  };

  closeSSHModal = () => {
    const { showSSHKeys, modalData } = this.props;

    showSSHKeys({
      ...modalData.ssh_key_data,
      yes: false,
      no: false,
      show: !modalData.ssh_key_data.show,
    });
  };

  validateSSHKey = async () => {
    const {
      sshKeySelected: { type, name, publicKey, privateKey, keyId },
    } = this.state;
    try {
      if (type === SSH.GENERATE) {
        if (keyId === -1) {
          this.setState({
            sshErrorTitle: 'SSH key not selected',
          });
          return false;
        }
      }
      if (type === SSH.SELECT_SSH) {
        if (keyId === -1) {
          this.setState({
            sshErrorTitle: 'SSH key not selected',
          });
        }
      }

      if (type === SSH.ADD_NEW) {
        const metadb = await db.getInstance();
        const sshKeyId = await metadb.addUsersKeys({
          keyName: name,
          publicKey,
          privateKey,
        });
        log.info('validateKey', sshKeyId);
        // update database
      }
      return true;
    } catch (err) {
      this.setState({
        sshErrorTitle: err.message,
      });
      log.info('[validateSelectedSSHKey]', err);
      return false;
    }
  };

  onNextStepClickListener = async () => {
    const {
      currentProject: { title, subTitle },
      history,
      showSSHKeys,
      modalData,
      location: { pathname },
    } = this.props;
    const {
      sshKeySelected: { keyId },
    } = this.state;
    const isValid = this.validateSSHKey();
    if (isValid) {
      if (pathname === routes.DASHBOARD + routes.PROJECT_SETTINGS) {
        const metaDB = await db.getInstance();
        const project = metaDB.getProjectByParam({
          name: title,
          container_name: subTitle,
        });
        // TODO:
        // need to add check here coming from project-setting/ or app settings
        // update project key only if coming from
        if (project && project.webSync) {
          project.webSync.sshKeyId = keyId;
          metaDB.updateProject({ ...project });
        }
        this.closeSSHModal();
        history.push(routes.DASHBOARD + routes.REDIRECT);
      } else {
        showSSHKeys({
          ...modalData.ssh_key_data,
          updated: true,
          yes: false,
          no: false,
          show: !modalData.ssh_key_data.show,
        });
      }
    }

  };

  sshKeyErrorHandler = (errMsg: string) => {
    this.setState({
      sshErrorTitle: errMsg,
    });
  };

  selectedSSHKey = async (sshKeySelected: SelectedKey) => {
    log.info('addssh-key-modal', sshKeySelected);
    this.setState({
      sshKeySelected,
    });
  };

  render() {
    const { sshErrorTitle, sshKeySelected } = this.state;
    const { modalData } = this.props;
    return (
      <Modal
        parentClass={Style.create_ssh_key_modal}
        customClass={Style.create_ssh_key_modal_container}
      >
        <div className={Style.create_ssh_key_modal_content}>
          <div className={Style.create_ssh_key_modal_body_content}>
            <SHHKey
              errMsg={sshErrorTitle}
              removeSSHOption={modalData.ssh_key_data.removeSSHOption}
              setErrorHandler={(errMsg: string) =>
                this.sshKeyErrorHandler(errMsg)
              }
              selectedKeyHandler={(sshKey: SelectedKey) =>
                this.selectedSSHKey(sshKey)
              }
            />
          </div>
          <div
            id="button_container_id"
            className={classNames(Style.modal_footer)}
          >
            <Button
              text="Cancel"
              customClass={classNames(Style.button_cancel)}
              size={Button.Size.MEDIUM}
              alignIcon={Button.getPosition.LEFT}
              onClickListener={this.closeSSHModal}
            />
            <Button
              text="Save"
              disable={!!validateSelectedSSHKey(sshKeySelected)}
              customClass={classNames(Style.button_continue)}
              variant={Button.getVariant.CONTAINED}
              size={Button.Size.MEDIUM}
              onClickListener={this.onNextStepClickListener}
              alignIcon={Button.getPosition.RIGHT}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    modalData: state.modal_attributes,
    currentProject: state.project_attributes.currentProject,
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(ModalAction, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToAction)(CreateSshKeyModal)
);
