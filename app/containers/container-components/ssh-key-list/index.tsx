/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { Card, Button, Grid, Col, IconBox } from '@stackabl/ui';
import { connect } from 'react-redux';
import { Dispatch, bindActionCreators } from 'redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import db from '@stackabl/core/render/Database';
import request from '@stackabl/core/render/api';
import logger from 'electron-log';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import FuntionList from '@stackabl/core/shared/constants/functionlist';
import { SSHKeySchema } from '@stackabl/website-push-pull/shared/constants';
import Style from './index.scss';
import key_img from '../../../resources/Icons/Dark-Mode/custom.svg';
import { InitialThemeState } from '../../../reducers/theme';
import { RootState } from '../../../reducers/types';
import { getIcon } from '../../../utils/themes/icons';
import { SSH } from '../../../utils/common';
import ModalActions, {
  AddSSHDataType,
  SSHKeyDataModal,
} from '../../../actions/modal';
import { InitialModalState } from '../../../reducers/modal';

const log = logger.scope('app/ssh-keys-list');

interface ClassProps {
  name: string;
}

interface State {
  id: number;
  sshKeysList: SSHKeySchema[];
}

interface DispatchProps {
  showSSHKeys: (payload: AddSSHDataType) => void;
  showSSHKeyDetailModal: (payload: SSHKeyDataModal) => void;
}

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

type Props = ClassProps & RouteComponentProps & StateProps & DispatchProps;

class SSHList extends React.Component<Props, State> {
  db!: db;

  dummy_arr: Array<string> = [];

  constructor(props: Props) {
    super(props);
    this.dummy_arr = ['ssh1', 'ssh2', 'ssh3', 'ssh4'];
    this.state = {
      id: 0,
      sshKeysList: [],
    };
  }

  componentDidMount() {
    this.getKeysList();
  }

  componentDidUpdate() {
    const {
      modalData: {
        ssh_key_data,
        ssh_key_data: { updated },
      },
      showSSHKeys,
    } = this.props;
    if (updated) {
      this.getKeysList();
      showSSHKeys({ ...ssh_key_data, updated: false });
    }
    log.info('componentDidUpdate', 'called');
  }

  getKeysList = async () => {
    try {
      const metadb = await db.getInstance();
      const sshKeysList = await metadb.getAllkeys();
      log.info('response', sshKeysList);
      if (Array.isArray(sshKeysList) && sshKeysList.length) {
        this.setState({
          sshKeysList,
        });
      }
    } catch (err) {
      log.info('[getKeysList]', err);
    }
  };

  /**
   * returns public/ private key string
   * @param isPublicKey returns public key if true otherwise private key text
   * @param keyName key name
   */
  getKeyString = async (
    isPublicKey: boolean,
    keyName: string
  ): Promise<string> => {
    log.info('getKeyString', keyName);
    try {
      const response = await request(
        EndPoint.WEBSITE_PUSH_PULL,
        RegisterPackages.WEBSITE_PUSH_PULL,
        [
          FuntionList.READ_SSH_KEY,
          {
            name: keyName,
            isPublicKey,
          },
        ]
      );
      return response;
    } catch (error) {
      return '';
    }
  };

  onDeleteSshClick = async (name: string) => {
    try {
      const metadb = await db.getInstance();
      const sshKeysList = await metadb.removeSSHKey(name);
      log.info('sshKeysList', sshKeysList);
      this.getKeysList();
    } catch (err) {
      log.error('onDeleteSshClick', err.message);
    }
  };

  onGenerateSshKeyClick = () => {
    console.log('ssh key generated');
  };

  showAddSSHModal = () => {
    const { showSSHKeys, modalData } = this.props;

    showSSHKeys({
      ...modalData.ssh_key_data,
      yes: false,
      no: false,
      removeSSHOption: SSH.SELECT_SSH,

      show: !modalData.ssh_key_data.show,
    });
  };

  showSSHKeyDetailModal = (ssh: SSHKeySchema) => {
    const { showSSHKeyDetailModal, modalData } = this.props;
    showSSHKeyDetailModal({
      ...modalData.ssh_key_detail_data,
      show: !modalData.ssh_key_detail_data.show,
      ssh,
    });
  };

  render() {
    const { theme } = this.props;
    const { sshKeysList } = this.state;
    return (
      <div className={Style.SSH_list_container}>
        <div className={Style.ssh_list_caption_heading}>
          Need help? Check out our guide to{' '}
          <span role="presentation" onClick={this.onGenerateSshKeyClick}>
            generating SSH keys
          </span>
        </div>
        <Card
          customClass={Style.card_custom_class}
          header={
            <div className={Style.ssh_list_card_header}>
              <div className={Style.ssh_card_header_title_section}>
                <div className={Style.ssh_card_header_title}> SSH Keys</div>
                <Button
                  text="Add SSH Key"
                  variant={Button.getVariant.CONTAINED}
                  size={Button.Size.SMALL}
                  onClickListener={this.showAddSSHModal}
                />
              </div>
              <div className={Style.ssh_card_header_subtitle}>
                This is a list of SSH keys associated with your account. Remove
                any keys that do not recognize.
              </div>

              {/** List part */}
              <div className={Style.ssh_list_outer_container}>
                {sshKeysList.map((ssh) => (
                  <Grid
                    key={ssh.id}
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    spacing={Grid.Spacing.SP_10}
                    customClass={Style.ssh_list_body}
                  >
                    <Col>
                      <div className={Style.ssh_list_img}>
                        <img src={key_img} alt="key" />
                      </div>
                    </Col>
                    <Col customClass={Style.account_ssh_col}>
                      <div className={Style.ssh_list_content}>
                        <div className={Style.ssh_list_body_key_name}>
                          {ssh.name}
                        </div>
                        {/* <div className={Style.ssh_list_body_pub_key}>
                          Private key : <br />
                          AAAAB3NzaC1yc2EAAAABIwAAAQEA879BJGYlPTLIuc9/R5M */}
                        {/* {ssh.privateKey} */}
                        {/* </div> */}
                        {/* <div className={Style.ssh_list_body_pri_key}>
                            Public key : <br />
                            ssh-rsa
                            AAAAB3NzaC1yc2EAAAABIwAAAQEA879BJGYlPTLIuc9/R5M
                          </div> */}
                      </div>
                    </Col>
                    <Col>
                      <div className={Style.ssh_list_action_icons}>
                        <IconBox
                          icon={getIcon('CLICK_HERE', theme.theme_mode)}
                          name="Edit ssh"
                          customClass={Style.ssh_key_icons}
                          onClickListener={() =>
                            this.showSSHKeyDetailModal(ssh)
                          }
                        />
                        <IconBox
                          icon={getIcon('DELETE', theme.theme_mode)}
                          name="Delete ssh"
                          customClass={Style.ssh_key_icons}
                          onClickListener={() =>
                            this.onDeleteSshClick(ssh.name)
                          }
                        />
                      </div>
                    </Col>
                  </Grid>
                ))}
              </div>
            </div>
          }
        />
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

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ModalActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(SSHList)
);
