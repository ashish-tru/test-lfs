import * as React from 'react';
import classNames from 'classnames';
import {
  Input,
  TextArea,
  Button,
  SelectOptions,
  IconBox,
  Tooltip,
} from '@stackabl/ui';

import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import logger from 'electron-log';
import db from '@stackabl/core/render/Database';
import request from '@stackabl/core/render/api';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import FuntionList from '@stackabl/core/shared/constants/functionlist';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import Style from './index.scss';
import Tick from '../../../resources/Icons/Common/check.svg';
import Error from '../../../resources/Icons/Common/error.svg';
import dropDownIcon from '../../../resources/Icons/Light-Mode/dropdown.svg';
import { InitialThemeState } from '../../../reducers/theme';
import { RootState } from '../../../reducers/types';
import { getIcon, getColoredIcon } from '../../../utils/themes/icons';
import { SelectedKey, SSH, sshKeyValidation } from '../../../utils/common';
import { IList } from '../../../utils/ListSchema';

const log = logger.scope('app/add-ssh-keys');
interface ClassProps {
  header?: string | JSX.Element;
  footer?: string | JSX.Element;
  removeSSHOption:
    | typeof SSH.ADD_NEW
    | typeof SSH.GENERATE
    | typeof SSH.SELECT_SSH
    | string;
  errMsg: string;
  selectedKeyHandler: (selectedKey: SelectedKey) => void;
  setErrorHandler: (errMsg: string) => void;
}

interface State {
  whichOption?: string;
  selectedSSHKey: string;
  renderSSHList: boolean;
  keyName: string;
  publicKey: string;
  privateKey: string;
  sshGenerated: boolean;
  isSshKeyCopied: boolean;
  sshKeysList: ListType[];
  generateNew: SelectedKey;
  addNew: SelectedKey;
  selectFromList: SelectedKey;
}

interface StateProps {
  theme: InitialThemeState;
  currentProject: IList;
}

type Props = ClassProps & StateProps & RouteComponentProps;

interface ListType {
  id: number;
  name: string;
  selected: boolean;
}

class SHHKey extends React.Component<Props, State> {
  db!: db;

  // sshKeysList = [
  //   { id: 0, name: 'ssh0', selected: false },
  //   { id: 1, name: 'ssh1', selected: true },
  //   { id: 2, name: 'ssh2', selected: false },
  // ];

  defaultKeyValues: SelectedKey = {
    privateKey: '',
    publicKey: '',
    name: '',
    keyId: -1,
    type: SSH.ADD_NEW,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      whichOption: SSH.GENERATE,
      selectedSSHKey: '',
      renderSSHList: false,
      keyName: '',
      publicKey: '',
      privateKey: '',
      sshGenerated: false,
      isSshKeyCopied: false,
      sshKeysList: [],
      generateNew: { ...this.defaultKeyValues, type: SSH.GENERATE },
      addNew: this.defaultKeyValues,
      selectFromList: { ...this.defaultKeyValues, type: SSH.SELECT_SSH },
    };
  }

  init = async () => {
    const {
      currentProject: { title, subTitle },
    } = this.props;
    const metadb = await db.getInstance();
    const project = metadb.getProjectByParam({
      name: title,
      container_name: subTitle,
    });
    if (project && project.webSync) {
      const sshKeyObj = metadb.getKeyById(project.webSync.sshKeyId);
      return sshKeyObj;
    }
    return 0;
  };

  onClickSelectSSHKey = async (item: ListType) => {
    const { sshKeysList } = this.state;
    const { selectedKeyHandler } = this.props;
    const sortList: ListType[] = sshKeysList.map((ssh: ListType) => {
      let el = ssh;
      el = { ...ssh, selected: ssh.name === item.name };
      return el;
    });
    // this.sshKeysList = sortList;
    const publicKey = await this.getPublicKeyString(item.name);
    const sshObj = {
      type: SSH.SELECT_SSH,
      name: item.name,
      publicKey,
      privateKey: '',
      keyId: item.id,
    };
    this.setState({
      selectedSSHKey: item.name,
      sshKeysList: sortList,
      publicKey,
      keyName: item.name,
      selectFromList: sshObj,
    });
    selectedKeyHandler(sshObj);
  };

  isSSHListRemoved = (islistRemoved: boolean) => {
    this.setState({
      renderSSHList: islistRemoved,
    });
  };

  onChangeRadioButton = async (whichOption: string) => {
    const { addNew, generateNew } = this.state;
    const { selectedKeyHandler } = this.props;
    this.setErrMsg('');
    switch (whichOption) {
      case SSH.SELECT_SSH: {
        await this.getKeysList();
        this.setState({
          whichOption,
        });
        break;
      }
      case SSH.ADD_NEW: {
        this.setState({
          keyName: addNew.name || '',
          publicKey: addNew.publicKey || '',
          privateKey: addNew.privateKey || '',
          whichOption,
        });
        selectedKeyHandler(addNew);
        break;
      }
      case SSH.GENERATE: {
        this.setState({
          keyName: generateNew.name || '',
          publicKey: generateNew.publicKey || '',
          privateKey: generateNew.privateKey || '',
          whichOption,
        });
        selectedKeyHandler(generateNew);
        break;
      }
      default:
        break;
    }
  };

  getKeysList = async (): Promise<ListType[]> => {
    try {
      const { selectFromList } = this.state;
      const { selectedKeyHandler } = this.props;
      const metadb = await db.getInstance();
      const response = await metadb.getAllKeysName();
      if (Array.isArray(response) && response.length) {
        let sshObj: SelectedKey;
        if (selectFromList.name) {
          sshObj = { ...selectFromList };
        } else {
          const sshKeyObj = await this.init();
          sshObj = {
            type: SSH.SELECT_SSH,
            publicKey: '',
            privateKey: '',
            name: response[0].name,
            keyId: response[0].$loki,
          };
          if (sshKeyObj) {
            sshObj.name = sshKeyObj.name;
            sshObj.keyId = sshKeyObj.$loki;
          }
        }

        let keyObj;
        const sshKeysList = response.map((k, idx) => {
          keyObj = {
            id: k.$loki,
            name: k.name,
            selected: k.name === sshObj.name,
          };
          return keyObj;
        });

        const publicKey = await this.getPublicKeyString(sshObj.name);
        sshObj.publicKey = publicKey;
        this.setState(
          {
            selectedSSHKey: sshObj.name,
            sshKeysList,
            whichOption: SSH.SELECT_SSH,
            publicKey,
            selectFromList: { ...sshObj },
          },
          () => {
            return sshKeysList;
          }
        );
        selectedKeyHandler(sshObj);
      }
      return [];
    } catch (err) {
      log.error('[getKeysList]', err);
      throw new Error('Unable to fetch keys list');
    }
  };

  /**
   * fetches pub key string from backend for given name of key
   * @param name  key name
   * */
  getPublicKeyString = async (name: string) => {
    try {
      const response = await request(
        EndPoint.WEBSITE_PUSH_PULL,
        RegisterPackages.WEBSITE_PUSH_PULL,
        [
          FuntionList.READ_SSH_KEY,
          {
            name,
            isPublicKey: true,
          },
        ]
      );
      return response;
    } catch (error) {
      return '';
    }
  };

  onChangeKeyNameListener = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setErrMsg('');
    const { whichOption, generateNew, addNew } = this.state;
    const { selectedKeyHandler } = this.props;
    if (whichOption === SSH.GENERATE) {
      this.setState({
        generateNew: {
          ...generateNew,
          name: event.target.value,
        },
        keyName: event.target.value,
      });
      selectedKeyHandler({
        ...generateNew,
        name: event.target.value,
      });
    } else {
      this.setState({
        addNew: {
          ...addNew,
          name: event.target.value,
        },
        keyName: event.target.value,
      });
      selectedKeyHandler({
        ...addNew,
        name: event.target.value,
      });
    }
  };

  onSetPublicKey = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // TODO req refactoring of this function
    const { whichOption, generateNew, addNew } = this.state;
    const { selectedKeyHandler } = this.props;
    const sshKeyobj: SelectedKey = {
      type: SSH.ADD_NEW,
      publicKey: '',
      privateKey: '',
      name: '',
      keyId: -1,
    };
    this.setErrMsg('');
    if (whichOption === SSH.ADD_NEW) {
      this.setState({
        addNew: {
          ...addNew,
          publicKey: event.target.value,
        },
        publicKey: event.target.value,
      });
      sshKeyobj.name = addNew.name;
      sshKeyobj.keyId = -1;
    } else {
      this.setState({
        generateNew: {
          ...generateNew,
          publicKey: event.target.value,
        },
        publicKey: event.target.value,
      });
      sshKeyobj.name = generateNew.name;
      sshKeyobj.type = SSH.GENERATE;
      sshKeyobj.keyId = addNew.keyId || -1;
    }
    sshKeyobj.publicKey = event.target.value;
    sshKeyobj.privateKey = addNew.privateKey;
    selectedKeyHandler(sshKeyobj);
  };

  onSetPrivateKey = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // TODO req refactoring of this function
    log.info('onSetPrivateKey');
    const { whichOption, generateNew, addNew } = this.state;
    const { selectedKeyHandler } = this.props;
    const sshKeyobj: SelectedKey = {
      type: SSH.ADD_NEW,
      publicKey: '',
      privateKey: '',
      name: '',
      keyId: -1,
    };
    this.setErrMsg('');
    if (whichOption === SSH.ADD_NEW) {
      this.setState({
        addNew: {
          ...addNew,
          privateKey: event.target.value,
        },
        privateKey: event.target.value,
      });
      sshKeyobj.name = addNew.name;
      sshKeyobj.keyId = -1;
    } else {
      this.setState({
        generateNew: {
          ...generateNew,
          privateKey: event.target.value,
        },
        privateKey: event.target.value,
      });
      sshKeyobj.name = generateNew.name;
      sshKeyobj.type = SSH.GENERATE;
      sshKeyobj.keyId = generateNew.keyId || -1;
    }
    log.info('sshKeyObj', sshKeyobj);
    sshKeyobj.privateKey = event.target.value;
    sshKeyobj.publicKey = addNew.publicKey;
    selectedKeyHandler(sshKeyobj);
  };

  generateSSHKey = async () => {
    try {
      const { keyName } = this.state;
      const { selectedKeyHandler } = this.props;
      this.setErrMsg('');
      const keyErrMsg = sshKeyValidation('name', keyName);
      if (!keyErrMsg) {
        log.info('entered');
        const metadb = await db.getInstance();
        const response = await metadb.addSSHKey(keyName.trim());
        if (response.pubKey && response.lokiId) {
          log.info('response', response);
          const keyObj = {
            name: keyName,
            publicKey: response.pubKey,
            privateKey: '',
            keyId: response.lokiId,
            type: SSH.GENERATE,
          };
          this.setState({
            sshGenerated: true,
            generateNew: keyObj,
            publicKey: response.pubKey,
          });
          selectedKeyHandler(keyObj);
        }
      } else {
        this.setErrMsg(keyErrMsg);
      }
    } catch (err) {
      log.info('err', err.message);
      // Todo: display notification msg about error
      this.setErrMsg(err.message);
    }
  };

  setErrMsg = (msg: string) => {
    const { setErrorHandler } = this.props;
    setErrorHandler(msg);
  };

  copySSHKey = () => {
    this.setState((prevState) => ({
      isSshKeyCopied: !prevState.isSshKeyCopied,
    }));
    setTimeout(() => {
      this.setState((prevState) => ({
        isSshKeyCopied: !prevState.isSshKeyCopied,
      }));
    }, 100);
  };

  render() {
    const {
      whichOption,
      selectedSSHKey,
      sshKeysList,
      renderSSHList,
      sshGenerated,
      keyName,
      publicKey,
      privateKey,
      isSshKeyCopied,
    } = this.state;

    const { header, footer, theme, removeSSHOption, errMsg } = this.props;
    return (
      <>
        <div className={Style.shh_key_container}>
          <div className={Style.ssh_key_inner_container}>
            {header}
            <div className={classNames(Style.title)}>Select SSH Keys</div>
            {/** === Radio Button Container === */}
            <div className={classNames(Style.ssh_key_options_container)}>
              {/** === Generate key radio button === */}
              <div
                id={SSH.GENERATE}
                className={Style.ssh_key_radio_box}
                role="presentation"
                onClick={() => {
                  this.onChangeRadioButton(SSH.GENERATE);
                }}
              >
                <span
                  className={classNames(
                    Style.ssh_key_radio,
                    whichOption === SSH.GENERATE ? Style.active : ''
                  )}
                />
                <div className={Style.ssh_key_radio_label}>
                  Generate key pair
                </div>
              </div>
              {/** === Add new key radio button === */}
              <div
                id={SSH.ADD_NEW}
                className={Style.ssh_key_radio_box}
                role="presentation"
                onClick={() => {
                  this.onChangeRadioButton(SSH.ADD_NEW);
                }}
              >
                <span
                  className={classNames(
                    Style.ssh_key_radio,
                    whichOption === SSH.ADD_NEW ? Style.active : ''
                  )}
                />
                <div className={Style.ssh_key_radio_label}>Add Key</div>
              </div>
              {/** === Select from key list radio button === */}
              {removeSSHOption !== SSH.SELECT_SSH && (
                <div
                  id={SSH.SELECT_SSH}
                  className={Style.ssh_key_radio_box}
                  role="presentation"
                  onClick={() => {
                    this.onChangeRadioButton(SSH.SELECT_SSH);
                  }}
                >
                  <span
                    className={classNames(
                      Style.ssh_key_radio,
                      whichOption === SSH.SELECT_SSH ? Style.active : ''
                    )}
                  />
                  <div className={Style.ssh_key_radio_label}>
                    Select from existing
                  </div>
                </div>
              )}
            </div>
            {/** === OPTIONS FORM CONATAINER === */}
            <div className={Style.ssh_key_form_container}>
              <div>
                {errMsg && (
                  <div className={classNames(Style.ssh_key_form_error)}>
                    <img src={Error} alt="Error" />
                    {/* <span>{formErrorTitle}</span> */}
                    <span>{errMsg}</span>
                  </div>
                )}
              </div>
              {/** === Dropdown to select SSH === */}
              {whichOption === SSH.SELECT_SSH && (
                <SelectOptions
                  id="git_branch_select_option"
                  placeholder="Select SSH key "
                  customClass={classNames(
                    Style.create_new_project_select_branch
                  )}
                  customDropdownClass={Style.parent_class}
                  listOuterClass={Style.select_list_outer}
                  value={selectedSSHKey}
                  width="100%"
                  icon={dropDownIcon}
                  selectIcon={Tick}
                  selectList={sshKeysList}
                  selectedItem={(item) => {
                    this.onClickSelectSSHKey(item);
                  }}
                  isOptionsRemoved={(isListRemoved) => {
                    this.isSSHListRemoved(isListRemoved);
                  }}
                />
              )}
              {/** === Input for key name === */}
              {whichOption !== SSH.SELECT_SSH && (
                <Input
                  name="key"
                  labelText="Key Name"
                  value={keyName}
                  readOnly={whichOption === SSH.SELECT_SSH}
                  onChangeListener={this.onChangeKeyNameListener}
                />
              )}
              {/** === Add private key value for add new option === */}
              {whichOption === SSH.ADD_NEW && (
                <TextArea
                  id={12}
                  labelText="Private key"
                  // placeholder="Place your private key here"
                  value={privateKey}
                  onChangeListener={(event) => this.onSetPrivateKey(event)}
                  customClass={Style.ssh_key_textarea}
                />
              )}

              {/** === Text Area for public key-value for all three options === */}
              {((sshGenerated && whichOption === SSH.GENERATE) ||
                whichOption === SSH.ADD_NEW ||
                whichOption === SSH.SELECT_SSH) && (
                <TextArea
                  id={11}
                  // placeholder={
                  //   whichOption === SSH.SELECT_SSH
                  //     ? 'Your selected public key will be displayed here'
                  //     : 'Place your public key here '
                  // }
                  labelText="Public key"
                  value={publicKey}
                  readOnly={whichOption === SSH.SELECT_SSH}
                  onChangeListener={(event) => this.onSetPublicKey(event)}
                  customClass={Style.ssh_key_textarea}
                />
              )}
              {/** === NOTE :  For now it will switch back to generate new but in acctual case it will generate new key in the same text area === */}
              {sshGenerated && whichOption === SSH.GENERATE && (
                <Button
                  size={Button.Size.SMALL}
                  id="generate_new_ssh_key"
                  text="Generate New"
                  alignButton={Button.getPosition.RIGHT}
                  variant={Button.getVariant.TEXT}
                  customClass={classNames(
                    Style.create_new_project_project_change_ssh_key_button
                  )}
                  onClickListener={this.generateSSHKey}
                />
              )}
              {/** === Generate key cases === */}
              {!sshGenerated && whichOption === SSH.GENERATE && (
                <div className={classNames(Style.generate_key_container)}>
                  <input
                    className={Style.generate_key_container_input}
                    type="text"
                    placeholder="Your generated SSH key will be displayed here"
                    disabled
                  />
                  <Button
                    text="Generate"
                    size={Button.Size.SMALL}
                    customClass={classNames(
                      Style.generate_key_container_button
                    )}
                    onClickListener={this.generateSSHKey}
                  />
                </div>
              )}
            </div>
          </div>
          {footer}
        </div>
      </>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    currentProject: state.project_attributes.currentProject,
  };
};

export default withRouter(connect(mapStateToProps, null)(SHHKey));
