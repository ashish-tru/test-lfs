import * as React from 'react';
import classNames from 'classnames';
import {
  Button,
  IconBox,
  Input,
  Tooltip,
  Grid,
  Col,
  Card,
  CheckBox,
  TextArea,
  SelectOptions,
} from '@stackabl/ui';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import request from '@stackabl/core/render/api';
import {
  DBFields,
  DBParams,
  Field,
  ServiceProvider,
} from '@stackabl/website-push-pull/shared/constants';
import { clipboard } from 'electron';
import FuntionList from '@stackabl/core/shared/constants/functionlist';
import { nanoid } from 'nanoid';
import db from '@stackabl/core/render/Database';
import { SyncObj, WebsiteClone } from '@stackabl/core/render/Database/schema';
import logger from 'electron-log';
import constants from '@stackabl/core/shared/constants';
import { ProjectEnumType } from '@stackabl/core/render/common';
import _, { isArray } from 'lodash';
import Style from './index.scss';
import { InitialThemeState } from '../../../reducers/theme';
import { RootState } from '../../../reducers/types';
import { getIcon, getColoredIcon } from '../../../utils/themes/icons';
import BasicProject from './basic-project';
import Tick from '../../../resources/Icons/Common/check.svg';
import Error from '../../../resources/Icons/Common/error.svg';
import ButtonLoader from '../../../resources/Icons/Dark-Mode/button_loader.svg';
import {
  BlankProjectState,
  convetToBlankState,
  disableWebsync,
  SelectedKey,
  validateSelectedSSHKey,
  webSyncValidation,
  SSH,
  sshKeyValidation,
} from '../../../utils/common';
import { IList } from '../../../utils/ListSchema';
import { WebsiteCloneDataType } from '../../../actions/modal';
import SSHKey from '../add-ssh-keys';

const log = logger.scope('app/webclone');

interface KeyList {
  id: number;
  name: string;
  icon: string;
  selected: boolean;
}

interface State {
  currentStep: number;
  prevStep: number;
  basicProjectEnded: boolean;
  goBackToBasicProject: boolean;
  hostName: string;
  databaseUser: string;
  showLoader: boolean;
  projectPass: string;
  databaseName: string;
  //  serviceProviderType: ServiceProvider;
  websiteClone: WebsiteClone;
  autoFetchingDB: boolean;
  formErrorTitle: string;
  dbErrorTitle: string;
  sshErrorTitle: string;
  isSshKeyCopied: boolean;
  selectList: KeyList[];
  selectedKey: string;
  selectedPubKey: string;
  sshKeySelected: SelectedKey;
}

interface StateProps {
  theme: InitialThemeState;
  currentProject: IList;
  webcloneModal?: WebsiteCloneDataType;
}

interface Props {
  startAt: number;
  endAt: number;
  option: number;
  changeVal: (val: number) => void;
  changeOption: (type: number) => void;
  submit: (state: BlankProjectState & { websiteClone: WebsiteClone }) => void;
  websiteCloningEnded?: () => void;
}

type ComponentProps = StateProps & Props & RouteComponentProps;
class CloneFromWebsite extends React.Component<ComponentProps, State> {
  blankState!: BlankProjectState;

  db!: db;

  constructor(props: ComponentProps) {
    super(props);
    const { startAt } = this.props;
    log.info('constructor did mount');

    this.state = {
      currentStep: startAt,
      prevStep: startAt > 1 ? startAt - 1 : 0,
      basicProjectEnded: false,
      goBackToBasicProject: false,
      hostName: '',
      databaseUser: '',
      projectPass: 'admin',
      databaseName: '',
      showLoader: false,
      autoFetchingDB: false,
      formErrorTitle: '',
      dbErrorTitle: '',
      sshErrorTitle: '',
      websiteClone: {
        syncObj: {
          serviceProvider: ServiceProvider.WPENGINE,
          sshKeyId: -1,
          serverFields: [],
          databaseFields: [],
          filesCount: '',
          filesSize: '',
        },
        selectedCMS: '',
      },
      // serviceProviderType: ServiceProvider.GODADDY,
      isSshKeyCopied: false,
      // selectList: [],  // list of sshKeys
      selectedKey: '', // name of sshKey
      selectedPubKey: '',
      sshKeySelected: {},
    };
  }

  componentDidMount() {
    const { startAt, webcloneModal } = this.props;
    log.info('component did mount');
    if (startAt === 1 && webcloneModal) {
      const { project } = webcloneModal;
      if (project) this.blankState = convetToBlankState(project);
      // this.getKeysList();
    }
  }

  commonCoditionFormodal = () => {
    const { basicProjectEnded } = this.state;
    const { startAt } = this.props;
    return basicProjectEnded || startAt === 1;
  };

  submitButtonText = () => {
    const { currentStep } = this.state;
    const { endAt, startAt } = this.props;
    if (currentStep === endAt) {
      if (startAt === 1) {
        return 'Attach project';
      }
      return 'Create Project';
    }
    return 'Continue';
  };

  onNextStepClickListener = async () => {
    const { currentStep, basicProjectEnded, websiteClone } = this.state;
    const { endAt, submit, option, changeVal, startAt } = this.props;
    let isAttachedProject = false;
    if (currentStep === 4 || currentStep === 1) {
      // check if ssh key is selected

      if (currentStep === 4) {
        isAttachedProject = true;
      }
      this.setState({
        formErrorTitle: '',
      });
      const isSSHKeyValid = await this.validateSSHKey();
      if (!isSSHKeyValid) {
        log.error('ssh key validation failed...');
        return;
      }

      await this.fetchFormFields(true);
    }
    if (currentStep === 5 || currentStep === 2) {
      // const selectedCMS = this.cmsList.find(
      //   (o) => o.id === projectCmsTypeID
      // );
      this.setState({ showLoader: true });
      /**
       * validating SSH Connection
       */
      const response = await this.validateServerFields();
      if (!response) {
        log.error('servervalidation failed...');
        return;
      }
      // getting database field set in state
      await this.fetchFormFields(false);
      // fetch server database by default
      this.setWebClone({ addDBDump: true });
      // fetch database paramters from server and display
      await this.setDBParams();
      this.setState({ showLoader: false, dbErrorTitle: '' });
    }
    if (currentStep === 6 || currentStep === 3) {
      this.setState({ showLoader: true });
      const res = await this.validateDBParams();
      if (!res) {
        log.error('dbvalidation failed...');
        return;
      }
      await this.fetchFilesMeta();
      this.setState({ showLoader: false });
    }
    if (currentStep === endAt) {
      log.info('lastStep', isAttachedProject);
      submit({
        ...this.blankState,
        websiteClone: {
          ...websiteClone,
          firstRunAfterAttach: isAttachedProject,
        },
        projectType: ProjectEnumType.CLONEWEBSITE,
      });
    }
    if (currentStep < endAt && this.commonCoditionFormodal()) {
      this.setState(
        (prevState) => ({
          currentStep: prevState.currentStep + 1,
          prevStep: prevState.currentStep,
        }),
        () => {
          const { currentStep: current } = this.state;
          changeVal(current);
          // if (current === 6) {
          //   debugger;
          //   this.setDBParams()
          // }
        }
      );
    }
  };

  onPrevStepClickListener = () => {
    const { currentStep, basicProjectEnded } = this.state;
    const { startAt, changeVal, websiteCloningEnded } = this.props;
    if (
      currentStep !== startAt &&
      currentStep > startAt &&
      this.commonCoditionFormodal()
    ) {
      this.setState(
        (prevState) => ({
          currentStep: prevState.currentStep - 1,
          prevStep: prevState.prevStep > 1 ? prevState.currentStep - 2 : 0,
        }),
        () => {
          const { currentStep: current } = this.state;
          changeVal(current);
        }
      );
    }
    if (currentStep === startAt) {
      this.setState((prevState) => ({
        goBackToBasicProject: !prevState.goBackToBasicProject,
        basicProjectEnded: false,
      }));
    }

    /** for modal and when there are no basic project steps  */
    if (startAt === 1 && currentStep === startAt && websiteCloningEnded) {
      websiteCloningEnded();
    }
  };

  onBasicProjectEnded = (state: BlankProjectState) => {
    this.blankState = state;
    this.setState({ basicProjectEnded: true });
    // this.getKeysList();
  };

  toggleVisibility = (conditon: boolean) => {
    return conditon ? Style.visibility_on : Style.visibility_hidden;
  };

  togglePrevSlideTransition = (condition: boolean) => {
    return condition ? Style.slide_prev : '';
  };

  selectedSSHKey = async (sshKeySelected: SelectedKey) => {
    log.info('clone-from-website', sshKeySelected);
    this.setState({
      sshKeySelected,
    });
    if (sshKeySelected && sshKeySelected.keyId !== -1) {
      const { keyId } = sshKeySelected;
      this.setWebClone({
        syncObj: {
          sshKeyId: keyId,
        },
      });
    }
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
        const keyErrMsg = sshKeyValidation('name', name);
        if (keyErrMsg) {
          throw new Error(keyErrMsg);
        }
        const metadb = await db.getInstance();
        const sshKeyId = await metadb.addUsersKeys({
          keyName: name,
          publicKey,
          privateKey,
        });
        log.info('validateKey', sshKeyId);
        this.setWebClone({
          syncObj: {
            sshKeyId: keyId,
          },
        });
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

  sshKeyErrorHandler = (errMsg: string) => {
    this.setState({
      sshErrorTitle: errMsg,
    });
  };

  onClickQuetionsMarkIcon = () => {
    alert('questions?');
  };

  serviceProviderHandler = (serviceProvider: ServiceProvider) => {
    log.info('serviceProvider', serviceProvider);

    this.setWebClone({
      syncObj: { serviceProvider },
    });
  };

  fetchFormFields = async (isServerFields: boolean) => {
    let functionType;
    let formType;
    if (isServerFields) {
      functionType = FuntionList.SERVER_FIELDS_TEMPLATE;
      formType = 'serverFields';
    } else {
      functionType = FuntionList.SERVER_DB_TEMPLATE;
      formType = 'databaseFields';
    }
    const {
      websiteClone: {
        syncObj: { serviceProvider },
      },
    } = this.state;
    const formFields = await request(
      EndPoint.WEBSITE_PUSH_PULL,
      RegisterPackages.WEBSITE_PUSH_PULL,
      [
        functionType,
        {
          serviceProvider,
        },
      ]
    );
    log.info('SERVER_FIELDS_TEMPLATE', formFields);
    this.setWebClone({ syncObj: { [formType]: formFields } });
  };

  fetchFilesMeta = async () => {
    const {
      websiteClone: {
        syncObj: { serviceProvider, serverFields },
        syncObj,
      },
    } = this.state;
    try {
      const args = await this.getBeforeProjArgs();
      const filesMetaData = await request(
        EndPoint.WEBSITE_PUSH_PULL,
        RegisterPackages.WEBSITE_PUSH_PULL,
        [
          FuntionList.FETCH_FILES_SIZE,
          {
            serviceProvider,
            args,
            serverfields: serverFields,
            isSSHKeyTested: true,
          },
        ]
      );
      if (filesMetaData && isArray(filesMetaData.data)) {
        const { filesCount, filesSize } = filesMetaData.data[0];
        log.info('filesMetaData', JSON.stringify(filesMetaData.data[0]));
        this.setWebClone({ syncObj: { filesCount, filesSize } });
      }
    } catch (error) {
      // Todo: display error msg to ui
      const errMsg = error.message.split('Error:');
      log.info('[fetchFilesMeta]', errMsg[1]);
    }
  };

  validateDBParams = async () => {
    const {
      websiteClone: {
        syncObj: { serviceProvider, serverFields, databaseFields },
      },
    } = this.state;

    try {
      const args = await this.getBeforeProjArgs();
      const resp = await request(
        EndPoint.WEBSITE_PUSH_PULL,
        RegisterPackages.WEBSITE_PUSH_PULL,
        [
          FuntionList.VALIDATE_DB_PARAMS,
          {
            serviceProvider,
            args,
            serverfields: serverFields,
            databasefields: databaseFields,
          },
        ]
      );
      log.info('[validateDBParams]', resp);
      if (!resp) {
        this.setState({
          dbErrorTitle: 'Invalid parameters/insufficient permissions',
          showLoader: false,
        });
      }
      return resp;
    } catch (err) {
      log.error('[validateDBParams-err]', err);
      const errMsg = err.message.split('Error:');
      this.setState({
        dbErrorTitle: errMsg[1] || 'Something went wrong',
        showLoader: false,
      });
      return false;
    }
  };

  getSelectedKeyName = async () => {
    const {
      websiteClone: {
        syncObj: { sshKeyId },
      },
    } = this.state;
    const metadb = await db.getInstance();
    const keyObj = metadb.getKeyById(sshKeyId);
    log.info('keyObj', keyObj);
    return keyObj.keyName;
  };

  /**
   * get arguments obj before project creation is complete
   */
  getBeforeProjArgs = async () => {
    const {
      projectName,
      defaultProjectLocation,
      projectId,
      type,
    } = this.blankState;
    log.info(this.blankState);
    let id = projectId;
    const selectedCMS = type;
    if (!projectId) {
      id = nanoid(constants.nanoid_Length);
    }
    // sshKeyName: 'stackabl',
    const sshKeyName = await this.getSelectedKeyName();
    return {
      id,
      name: projectName.trim().toLowerCase(),
      cms: selectedCMS,
      sshKeyName,
      location: {
        code: '',
        database: '',
        logs: '',
        webRoot: defaultProjectLocation,
        confTemplate: '',
        config: '',
        runPath: '',
        user: '',
        run: '',
        package: '',
      },
    };
    // location: LocationBehaviour;
  };

  validateServerFields = async () => {
    try {
      const {
        websiteClone,
        websiteClone: {
          syncObj: { serviceProvider, serverFields },
        },
      } = this.state;
      log.info('testsete', websiteClone);
      const args = await this.getBeforeProjArgs();
      log.info('validate server fields args', args);
      const response: any = await request(
        EndPoint.WEBSITE_PUSH_PULL,
        RegisterPackages.WEBSITE_PUSH_PULL,
        [
          FuntionList.PING_SERVER,
          {
            serviceProvider,
            args,
            serverfields: serverFields,
          },
        ]
      );
      log.info('validateServerFields', response);
      return true;
    } catch (err) {
      log.info('[validateServerFields]', err.message);
      const errMsg = err.message.split('Error:');
      this.setState({
        formErrorTitle: errMsg[1] || 'Something went wrong',
        showLoader: false,
      });
      return false;
    }
  };

  fetchDBParams = async () => {
    const {
      websiteClone: {
        syncObj: { serviceProvider, serverFields },
      },
    } = this.state;
    const args = await this.getBeforeProjArgs();
    const response: any = await request(
      EndPoint.WEBSITE_PUSH_PULL,
      RegisterPackages.WEBSITE_PUSH_PULL,
      [
        FuntionList.FETCH_DB_PARAMS,
        {
          serviceProvider,
          args,
          serverfields: serverFields,
          isSSHKeyTested: true,
        },
      ]
    );
    log.info('fetchDBParams', response);
    return response;
  };

  setDBParams = async () => {
    try {
      this.setState({ autoFetchingDB: true });
      const dbParams = await this.fetchDBParams();
      const {
        websiteClone: {
          syncObj: { databaseFields },
        },
      } = this.state;
      const dbFields = [...databaseFields];
      dbFields.forEach((_field, idx) => {
        dbFields[idx].error = '';
        dbFields[idx].value = '';
      });
      if (Object.keys(dbParams).length !== 0) {
        dbFields.forEach((field, idx) => {
          dbFields[idx].value = dbParams[field.key];
        });
      }
      this.setWebClone({ syncObj: { databaseFields: dbFields } });
      this.setState({ autoFetchingDB: false });
    } catch (er) {
      log.error('[setDBParams]', er.message);
      this.setState({ autoFetchingDB: false });
    }
  };

  /**
   * @description common function for modifying websiteclone state
   * @param webCloneParam
   */
  setWebClone = (webCloneParam: {
    [key: string]:
      | { [key: string]: string | number | Field[] }
      | string
      | Field[]
      | boolean;
  }) => {
    log.info('setwebClone', webCloneParam);
    let syncUpdateObj = {};

    const {
      websiteClone: prevWebClone,
      websiteClone: { syncObj },
    } = this.state;
    if (webCloneParam.syncObj && typeof webCloneParam.syncObj === 'object') {
      syncUpdateObj = { syncObj: { ...syncObj, ...webCloneParam.syncObj } };
    }
    this.setState({
      websiteClone: {
        ...prevWebClone,
        ...webCloneParam,
        ...syncUpdateObj,
      },
    });
  };

  // copySSHKey = () => {
  //   const { selectedPubKey } = this.state;
  //   clipboard.writeText(selectedPubKey);
  //   this.setState({
  //     isSshKeyCopied: true,
  //   });
  // };

  onChangeFormFields = (
    fieldValue: string,
    formField: Field,
    idx: number,
    isServerFields: boolean
  ) => {
    let fieldsArray;
    let formType;
    if (isServerFields) {
      const {
        websiteClone: {
          syncObj: { serverFields },
        },
      } = this.state;
      fieldsArray = [...serverFields];
      formType = 'serverFields';
    } else {
      const {
        websiteClone: {
          syncObj: { databaseFields },
        },
      } = this.state;
      fieldsArray = [...databaseFields];
      formType = 'databaseFields';
    }

    formField.value = fieldValue;
    fieldsArray[idx] = formField;
    this.setState({ formErrorTitle: '', dbErrorTitle: '' });
    this.setWebClone({ syncObj: { [formType]: fieldsArray } });
  };

  /**
   * @description for skip db step
   */
  skipDBStep = () => {
    this.onNextStepClickListener();
    this.setWebClone({ addDBDump: false });
  };

  serverFormFields = (isServerFields: boolean) => {
    const { theme } = this.props;
    let arrayFields: Field[];
    let formType: string;
    if (isServerFields) {
      const {
        websiteClone: {
          syncObj: { serverFields },
        },
      } = this.state;
      arrayFields = [...serverFields];
      formType = 'serverFields';
    } else {
      const {
        websiteClone: {
          syncObj: { databaseFields },
        },
      } = this.state;

      arrayFields = [...databaseFields];
      formType = 'databaseFields';
    }

    const { showLoader, websiteClone, autoFetchingDB } = this.state;

    log.info('arrayFields', arrayFields);
    return arrayFields.map((o: Field, idx: number) => {
      const fieldObj = { ...o };
      return (
        <Input
          key={o.key}
          id={o.key}
          type={o.key === DBFields.DB_PASSWORD ? 'password' : 'text'}
          labelText={o.label}
          value={o.value}
          disable={showLoader}
          // disable={isServerFields ? showLoader : autoFetchingDB}
          cancelIcon={getIcon('CLEAR', theme.theme_mode)}
          onChangeListener={(e) =>
            this.onChangeFormFields(
              e.target.value,
              fieldObj,
              idx,
              isServerFields
            )
          }
          onClearTextListener={() => {
            const isDisabled = isServerFields ? showLoader : autoFetchingDB;
            if (!isDisabled) {
              this.onChangeFormFields('', fieldObj, idx, isServerFields);
            }
          }}
          customClass={classNames(
            Style.create_new_project_project_input_server_info
          )}
          onFocus={(e) => {
            if (!e) {
              fieldObj.error = webSyncValidation(o.key, websiteClone);
            } else {
              fieldObj.error = '';
            }
            arrayFields[idx] = fieldObj;
            this.setWebClone({ syncObj: { [formType]: arrayFields } });
          }}
          onBlur={() => {
            const error = webSyncValidation(o.key, websiteClone);
            if (error) {
              fieldObj.error = webSyncValidation(o.key, websiteClone);
              arrayFields[idx] = fieldObj;
              this.setWebClone({ syncObj: { [formType]: arrayFields } });
            }
          }}
          errorMessage={o.error || ''}
          icon={
            o.key === DBFields.DB_PASSWORD
              ? [
                  getIcon('SHOW_PASSWORD', theme.theme_mode),
                  getIcon('HIDE_PASSWORD', theme.theme_mode),
                ]
              : undefined
          }
          // loaderIcon={getIcon('BUTTON_LOADER', theme.theme_mode)}
        />
      );
    });
  };

  getFieldsSummary = (isServerFields: boolean) => {
    let arrayFields: Field[];
    if (isServerFields) {
      const {
        websiteClone: {
          syncObj: { serverFields },
        },
      } = this.state;
      arrayFields = [...serverFields];
    } else {
      const {
        websiteClone: {
          syncObj: { databaseFields },
        },
      } = this.state;

      arrayFields = [...databaseFields];
    }
    return arrayFields.map((o: Field) => {
      return (
        <p key={o.key}>
          {o.label}: {o.value}
        </p>
      );
    });
  };

  render() {
    const {
      currentStep,
      prevStep,
      basicProjectEnded,
      goBackToBasicProject,
      hostName,
      databaseUser,
      projectPass,
      databaseName,
      autoFetchingDB,
      formErrorTitle,
      dbErrorTitle,
      sshErrorTitle,
      isSshKeyCopied,
      // serviceProviderType,
      showLoader,
      websiteClone,
      websiteClone: {
        syncObj: { serviceProvider, databaseFields, filesSize, serverFields },
      },
      selectList,
      selectedKey,
      selectedPubKey,
      sshKeySelected,
    } = this.state;

    const {
      startAt,
      endAt,
      theme,
      changeVal,
      changeOption,
      option,
    } = this.props;
    return (
      <>
        {/* <!============== Clone from github Step 1 to 3 Start here ============== !> */}
        {startAt !== 1 && (
          <BasicProject
            theme={theme}
            startAt={1}
            endAt={3}
            option={option}
            changeVal={changeVal}
            changeOption={changeOption}
            onNextStepEnded={this.onBasicProjectEnded}
            reverseSteps={goBackToBasicProject}
            submit={() => {}}
          />
        )}
        {/* <!============== Clone from github step  1 to 3 end here ============== !> */}
        {/* <!============== Clone from website step 4 start here ============== !> */}
        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt &&
                (basicProjectEnded || startAt === 1) &&
                prevStep === (startAt > 1 ? startAt - 1 : 0)
            ),
            this.togglePrevSlideTransition(prevStep === startAt),
            Style.create_new_project_website_clone_container
          )}
        >
          <div
            className={classNames(
              Style.create_new_project_list_view,
              Style.create_new_project_website_clone_step_one
            )}
          >
            <div
              className={classNames(
                Style.create_new_project_section_website_clone_title
              )}
            >
              Select Service Provider
            </div>

            <Grid
              variant={Grid.getVariant.FLEX}
              customClass={classNames(Style.create_new_project_grid)}
            >
              <Col xs={4} md={4} lg={4}>
                <Card
                  selected={serviceProvider === ServiceProvider.WPENGINE}
                  onClickListener={() => {
                    this.serviceProviderHandler(ServiceProvider.WPENGINE);
                  }}
                  header={
                    <CheckBox
                      icon={Tick}
                      radius="50%"
                      disable={false}
                      checked={serviceProvider === ServiceProvider.WPENGINE}
                    />
                  }
                  footer={
                    <IconBox
                      customClass={classNames(Style.grid_card_icon)}
                      icon={getIcon('WPENGINE', theme.theme_mode)}
                      tooltip={false}
                    />
                  }
                  customClass={classNames(Style.create_new_project_grid_card)}
                >
                  <h3
                    className={classNames(
                      Style.create_new_project_grid_card_title
                    )}
                  >
                    WPengine
                  </h3>
                </Card>
              </Col>
              <Col xs={4} md={4} lg={4}>
                <Card
                  selected={serviceProvider === ServiceProvider.SITEGROUND}
                  onClickListener={() => {
                    this.serviceProviderHandler(ServiceProvider.SITEGROUND);
                  }}
                  header={
                    <CheckBox
                      icon={Tick}
                      radius="50%"
                      checked={serviceProvider === ServiceProvider.SITEGROUND}
                    />
                  }
                  footer={
                    <IconBox
                      customClass={classNames(Style.grid_card_icon)}
                      icon={getIcon('SITEGROUND', theme.theme_mode)}
                      tooltip={false}
                    />
                  }
                  customClass={classNames(Style.create_new_project_grid_card)}
                  disable={false}
                >
                  <h3
                    className={classNames(
                      Style.create_new_project_grid_card_title
                    )}
                  >
                    Siteground
                  </h3>
                </Card>
              </Col>
              <Col xs={4} md={4} lg={4}>
                <Card
                  selected={serviceProvider === ServiceProvider.GODADDY}
                  onClickListener={() => {
                    this.serviceProviderHandler(ServiceProvider.GODADDY);
                  }}
                  header={
                    <CheckBox
                      icon={Tick}
                      value="dhaj"
                      radius="50%"
                      checked={serviceProvider === ServiceProvider.GODADDY}
                    />
                  }
                  footer={
                    <IconBox
                      customClass={classNames(Style.grid_card_icon)}
                      icon={getIcon('GODADDY', theme.theme_mode)}
                      tooltip={false}
                    />
                  }
                  customClass={classNames(Style.create_new_project_grid_card)}
                >
                  <h3
                    className={classNames(
                      Style.create_new_project_grid_card_title
                    )}
                  >
                    GoDaddy
                  </h3>
                </Card>
              </Col>
            </Grid>
            {/* <div
              className={classNames(
                Style.create_new_project_section_website_clone_title,
                Style.create_new_project_website_clone_title
              )}
            >
              Your SSH Key
            </div> */}

            <div
              className={classNames(
                Style.create_new_project_project_detail_form,
                Style.create_new_project_project_detail_full_form
              )}
            >
              <div
                className={classNames(
                  Style.create_new_project_project_copy_ssh_outer
                )}
              >
                <SSHKey
                  errMsg={sshErrorTitle}
                  setErrorHandler={(errMsg: string) =>
                    this.sshKeyErrorHandler(errMsg)
                  }
                  selectedKeyHandler={(sshKey: SelectedKey) =>
                    this.selectedSSHKey(sshKey)
                  }
                />
              </div>

              {/* {!sshKey ? (
                <div
                  className={classNames(
                    Style.create_new_project_project_location_browse
                  )}
                >
                  <input type="text" placeholder="Generate SSH Key" disabled />
                  <Button
                    text="Generate"
                    size={Button.Size.SMALL}
                    customClass={classNames(
                      Style.create_new_project_project_location_browse_button
                    )}
                    onClickListener={this.generateSSHKey}
                  />
                </div>
              ) : (
                <div
                  className={classNames(
                    Style.create_new_project_project_copy_ssh_outer
                  )}
                >
                  <TextArea
                    id={1}
                    value={selectedPubKey}
                    // onChangeListener={this.onTextAreaChange}
                    customClass={classNames(
                      Style.create_new_project_project_copy_textarea
                    )}
                  />
                </div>
              )} */}
              {/* <div className={Style.create_new_project_wrapper_content}>
                <div
                  className={classNames(
                    Style.create_new_project_project_add_ssh_key
                  )}
                >
                  <IconBox
                    id="ssh_key_question"
                    icon={getColoredIcon('INFO', theme.theme_color)}
                    customClass={classNames(
                      Style.create_new_project_project_add_ssh_key_icon
                    )}
                    tooltip={false}
                    // onClickListener={this.onClickQuetionsMarkIcon}
                  />
                  How to add your SSH key
                </div>
                <div
                  className={classNames(
                    Style.create_new_project_project_copy_ssh_key
                  )}
                >
                  <Tooltip
                    title={isSshKeyCopied ? 'Copied' : 'Copy'}
                    placement={Tooltip.getPlacement.TOP}
                    customClass={classNames(
                      Style.project_setting_actions_copy_link_tooltip
                    )}
                  >
                    <Button
                      icon={getIcon('SITE_DOMAIN', theme.theme_mode)}
                      alignIcon={Button.getPosition.LEFT}
                      onClickListener={this.copySSHKey}
                      // onMouseLeave={this.copySSHKey}
                      customClass={classNames(
                        Style.create_new_project_project_copy_ssh_key_button
                      )}
                    />
                  </Tooltip>
                  <Button
                    size={Button.Size.MEDIUM}
                    id="change_ssh_key"
                    text="Change SSH Key"
                    alignButton="right"
                    customClass={classNames(
                      Style.create_new_project_project_change_ssh_key_button
                    )}
                    onClickListener={this.onChangeSSHKey}
                  />
                </div>
              </div> */}
            </div>
          </div>
        </div>
        {/* <!============== Clone from website step 4 end here ============== !> */}
        {/* <!============== Clone from website step 5 Start here ============== !> */}
        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt + 1 &&
                prevStep === currentStep - 1 &&
                (basicProjectEnded || startAt === 1)
            ),
            this.togglePrevSlideTransition(prevStep === startAt + 1),
            Style.create_new_project_website_clone_container
          )}
        >
          <div
            className={classNames(
              Style.create_new_project_list_view,
              Style.create_new_project_website_clone_step_two
            )}
          >
            <div
              className={classNames(
                Style.create_new_project_select_cms_container,
                Style.create_new_project_select_cms_container_website_clone
              )}
            >
              <div className={classNames(Style.create_new_project_select_cms)}>
                <Card
                  customClass={classNames(
                    Style.create_new_project_select_cms_github_url
                  )}
                  header={
                    <>
                      <img
                        src={getIcon('WEBSITE_CLONE', theme.theme_mode)}
                        alt="website clone"
                      />
                      {/* {projectTypeId ===
                        CreateProjectOption.CLONE_FROM_GITHUB && (
                        <img
                          src={getIcon('GITHUB_CLONE', theme.theme_mode)}
                          alt="github"
                        />
                      )}
                      {projectTypeId ===
                        CreateProjectOption.CLONE_FROM_WEBSITE && (
                        <img
                          src={getIcon('WEBSITE_CLONE', theme.theme_mode)}
                          alt="website clone"
                        />
                      )}
                      {projectTypeId === CreateProjectOption.BLANK_PROJECTS && (
                        <img
                          src={getIcon('BLANK_PROJECT', theme.theme_mode)}
                          alt="blank project"
                        />
                      )} */}
                    </>
                  }
                >
                  <div className={classNames(Style.card_separator)} />
                  <p>
                    <strong>Project: </strong>
                    {_.capitalize(this.blankState?.projectName)}
                  </p>
                  {/* {projectTypeId === CreateProjectOption.CLONE_FROM_GITHUB && (
                    <p>
                      <strong>GitHub URL: </strong>
                      https://github.com/project
                    </p>
                  )}



                  {projectTypeId === CreateProjectOption.BLANK_PROJECTS && (
                    <p>
                      <strong>Project: </strong>
                      Project Name
                      {_.capitalize(projectName)}
                    </p>
                  )} */}
                </Card>
              </div>
            </div>
            <div
              className={classNames(
                Style.create_new_project_section_website_clone_title
              )}
            >
              Server Info
            </div>
            {formErrorTitle && (
              <div className={classNames(Style.ssh_key_form_error)}>
                <img src={Error} alt="Error" />
                <span>{formErrorTitle}</span>
              </div>
            )}
            <div
              className={classNames(
                Style.create_new_project_project_detail_form
              )}
            >
              {/* <Input
                id="Server_info_input"
                type="password"
                labelText="Password"
                value={projectPass}
                cancelIcon={getIcon('CLEAR', theme.theme_mode)}
                onChangeListener={(event) =>
                  this.setState({
                    projectPass: event.target.value,
                  })
                }
                onClearTextListener={() => this.setState({ projectPass: '' })}
                customClass={classNames(Style.create_new_project_project_input)}
                // onFocus={(e) => {
                //   if (!e) {
                //     this.setState((prevState) => ({
                //       fieldList: [
                //         ...prevState.fieldList.filter(
                //           (each: InputField) => each !== InputField.PASSWORD
                //         ),
                //         InputField.PASSWORD,
                //       ],
                //     }));
                //   } else {
                //     this.setState((prevState) => ({
                //       fieldList: [
                //         ...prevState.fieldList.filter(
                //           (each: InputField) => each !== InputField.PASSWORD
                //         ),
                //       ],
                //     }));
                //   }
                // }}
                // onBlur={() => {
                //   const error = this.validation(InputField.PASSWORD);
                //   if (error) {
                //     this.setState((prevState) => ({
                //       fieldList: [
                //         ...prevState.fieldList.filter(
                //           (each: InputField) => each !== InputField.PASSWORD
                //         ),
                //         InputField.PASSWORD,
                //       ],
                //       errorField: InputField.PASSWORD,
                //     }));
                //   }
                // }}
                // errorMessage={
                //   // eslint-disable-next-line react/destructuring-assignment
                //   this.state.fieldList.includes(InputField.PASSWORD)
                //     ? this.validation(InputField.PASSWORD)
                //     : ''
                // }
                icon={[
                  getIcon('SHOW_PASSWORD', theme.theme_mode),
                  getIcon('HIDE_PASSWORD', theme.theme_mode),
                ]}
                // uncomment for error
                // errorMessage="Please provide a correct password."
              /> */}
              {serverFields && this.serverFormFields(true)}
              <div
                className={classNames(
                  Style.create_new_project_project_add_ssh_key
                )}
              >
                <IconBox
                  id="server_info_question"
                  icon={getColoredIcon('INFO', theme.theme_color)}
                  customClass={classNames(
                    Style.create_new_project_project_add_ssh_key_icon
                  )}
                  tooltip={false}
                  onClickListener={this.onClickQuetionsMarkIcon}
                />
                How to get the server info
              </div>
            </div>
          </div>
        </div>
        {/* <!============== Clone from website step 5 end here ============== !> */}
        {/* <!============== Clone from website step 6 start here ============== !> */}
        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt + 2 &&
                prevStep === currentStep - 1 &&
                (basicProjectEnded || startAt === 1)
            ),
            this.togglePrevSlideTransition(prevStep === startAt + 2),
            Style.create_new_project_website_clone_container
          )}
        >
          <div
            className={classNames(
              Style.create_new_project_list_view,
              Style.create_new_project_website_clone_step_three
            )}
          >
            <div
              className={classNames(
                Style.create_new_project_section_website_clone_title
              )}
            >
              Database Info
            </div>
            <div
              className={classNames(
                Style.create_new_project_project_detail_form
              )}
            >
              {dbErrorTitle && (
                <div className={classNames(Style.ssh_key_form_error)}>
                  <img src={Error} alt="Error" />
                  <span>{dbErrorTitle}</span>
                </div>
              )}
              {databaseFields && this.serverFormFields(false)}

              <div className={Style.create_new_project_auto_fetch_skip}>
                <Button
                  id="auto_fetch"
                  text="Auto Fetch"
                  customClass={classNames(
                    Style.create_new_project_database_button
                  )}
                  onClickListener={() => this.setDBParams()}
                  alignIcon={Button.getPosition.LEFT}
                  loader={
                    autoFetchingDB
                      ? getIcon('BUTTON_LOADER', theme.theme_mode)
                      : ''
                  }
                />
                <Button
                  id="skip_step"
                  text="Skip"
                  customClass={classNames(
                    Style.create_new_project_database_button
                  )}
                  onClickListener={this.skipDBStep}
                />
              </div>
              <div
                className={classNames(
                  Style.create_new_project_project_add_ssh_key_outer
                )}
              >
                <div
                  className={classNames(
                    Style.create_new_project_project_add_ssh_key
                  )}
                >
                  <IconBox
                    id="databse_quetions"
                    icon={getColoredIcon('INFO', theme.theme_color)}
                    customClass={classNames(
                      Style.create_new_project_project_add_ssh_key_icon
                    )}
                    tooltip={false}
                    // onClickListener={this.onClickQuetionsMarkIcon}
                  />
                  How to get the database info
                </div>
                {/* <Button
                id="about_fetch"
                text="Auto Fetch"
                customClass={classNames(
                  Style.create_new_project_database_button
                )}
                // uncomment - for enable loader while fetching form data
                alignIcon={Button.getPosition.LEFT}
                loader={
                  autoFetchingDB
                    ? getIcon('BUTTON_LOADER', theme.theme_mode)
                    : ''
                }
                onClickListener={() => this.setDBParams()}
              /> */}
              </div>
            </div>
          </div>
        </div>
        {/* <!============== Clone from website step 6 end here ============== !> */}
        {/* <!============== Clone from website step 7 start here ============== !> */}
        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt + 3 &&
                prevStep === currentStep - 1 &&
                (basicProjectEnded || startAt === 1)
            ),
            this.togglePrevSlideTransition(prevStep === startAt + 3),
            Style.create_new_project_website_clone_container
          )}
        >
          <div
            className={classNames(
              Style.create_new_project_list_view,
              Style.create_new_project_website_clone_step_four
            )}
          >
            <div
              className={classNames(
                Style.create_new_project_project_detail_form
              )}
            >
              <Card
                id="server_info"
                customClass={classNames(
                  Style.create_new_project_project_info_card,
                  Style.create_new_project_project_download_info
                )}
              >
                <div
                  className={classNames(
                    Style.create_new_project_project_download_info_title
                  )}
                >
                  Total size download:
                  <span>{filesSize}</span>
                </div>
              </Card>
              <Card
                id="server_info"
                customClass={classNames(
                  Style.create_new_project_project_info_card
                )}
              >
                <div
                  className={classNames(
                    Style.create_new_project_project_info_header
                  )}
                >
                  <IconBox
                    icon={getIcon('SEVER_INFO', theme.theme_mode)}
                    tooltip={false}
                    customClass={classNames(
                      Style.create_new_project_project_info_icon
                    )}
                  />
                  <h2
                    className={classNames(
                      Style.create_new_project_project_info_header_title
                    )}
                  >
                    Server Info
                  </h2>
                </div>

                <div
                  className={classNames(
                    Style.create_new_project_project_info_content
                  )}
                >
                  {serverFields && this.getFieldsSummary(true)}
                </div>
                {/* {addDBDump && ( */}
                <div
                  className={classNames(
                    Style.create_new_project_project_info_divider
                  )}
                />
                {/* )} */}
                {/* {addDBDump && ( */}
                <div
                  className={classNames(
                    Style.create_new_project_project_info_header
                  )}
                >
                  <IconBox
                    icon={getIcon('DATABAES_INFO', theme.theme_mode)}
                    tooltip={false}
                    customClass={classNames(
                      Style.create_new_project_project_info_icon
                    )}
                  />
                  <h2
                    className={classNames(
                      Style.create_new_project_project_info_header_title
                    )}
                  >
                    Database Info
                  </h2>
                </div>
                {/* // )} */}
                {/* {addDBDump && ( */}
                <div
                  className={classNames(
                    Style.create_new_project_project_info_content
                  )}
                >
                  {databaseFields && this.getFieldsSummary(false)}
                </div>
                {/* )} */}
              </Card>
            </div>
          </div>
        </div>
        {this.commonCoditionFormodal() && (
          <div
            id="button_container_website_clone"
            className={classNames(Style.create_new_project_buttons_container)}
          >
            <Button
              text="Back"
              customClass={classNames(Style.create_new_project_button_cancel)}
              size={Button.Size.LARGE}
              disable={showLoader || autoFetchingDB}
              onClickListener={this.onPrevStepClickListener}
            />
            <div className={classNames(Style.create_new_project_button_group)}>
              <Button
                text={this.submitButtonText()}
                customClass={classNames(
                  Style.create_new_project_button_continue
                )}
                variant={Button.getVariant.CONTAINED}
                disable={
                  !!disableWebsync({
                    currentStep,
                    websiteClone,
                    basicProjectEnded,
                    sshKeySelected,
                  })
                }
                onClickListener={this.onNextStepClickListener}
                alignIcon={Button.getPosition.LEFT}
                // Enable buttton loader whenever you want loading process
                loader={showLoader ? ButtonLoader : ''}
              />
            </div>
          </div>
        )}
        {/* <!============== Clone from website step bottom button bar start bar end here ============== !> */}
      </>
    );
  }
}
const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    currentProject: state.project_attributes.currentProject,
    webcloneModal: state.modal_attributes.website_clone_data,
  };
};

export default withRouter(connect(mapStateToProps, null)(CloneFromWebsite));
