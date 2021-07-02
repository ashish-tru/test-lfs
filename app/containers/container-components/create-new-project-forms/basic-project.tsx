import * as React from 'react';
import classNames from 'classnames';
import {
  Button,
  Card,
  CheckBox,
  Col,
  Grid,
  IconBox,
  Input,
  SelectOptions,
  TextArea,
} from '@stackabl/ui';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  userPath,
  changePath,
  runPath,
  ProjectEnumType,
} from '@stackabl/core/render/common';
import Analytics, {
  ACTION,
  EVENT,
  LABEL,
} from '@stackabl/core/render/analytics';
import { remote } from 'electron';
import _ from 'lodash';
import constants from '@stackabl/core/shared/constants';
import { nanoid } from 'nanoid';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import Style from './index.scss';
import { InitialThemeState } from '../../../reducers/theme';
import { RootState } from '../../../reducers/types';
import { getIcon } from '../../../utils/themes/icons';
import Tick from '../../../resources/Icons/Common/check.svg';
import { IList } from '../../../utils/ListSchema';
import { CMS } from '../../../constants/index';
import {
  BlankProjectState,
  CreateProjectOption,
  disableStep,
  getHelpherVersions,
  InputField,
  validation,
} from '../../../utils/common';

// interface State {
//   currentStep: number;
//   prevStep: number;
//   stepsEnded: boolean;
//   addDescription: string;
//   projectName: string;
//   projectPass: string;
//   projectEmail: string;
//   projectUsername: string;
//   versionValue: string;
//   databaseValue: string;
//   renderPHPVersionList: boolean;
//   renderDatabaseVersionList: boolean;
//   projectCmsTypeID: number;
//   projectTypeId: number;
//   defaultProjectLocation: string;
//   errorField: string;
//   errorFields: string[];
// }

type State = BlankProjectState;
interface StateProps {
  theme: InitialThemeState;
}

interface ParentProps {
  startAt: number;
  endAt: number;
  onNextStepEnded: (blankState: BlankProjectState) => void;
  // onPrevStepEnded: () => void;
  submit: (args: BlankProjectState) => void;
  changeOption: (type: number) => void;
  reverseSteps?: boolean;
  option: number;
  changeVal: (type: number) => void;
}

type Props = StateProps & ParentProps;
interface ListType {
  id: number;
  name: string;
  icon: string;
  selected: boolean;
}

// const CreateProjectOption = {
//   BLANK_PROJECTS: 0,
//   CLONE_FROM_GITHUB: 1,
//   CLONE_FROM_WEBSITE: 2,
// };

class BasicProject extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    onNextStepEnded: () => {},
    changeOption: () => {},
    option: CreateProjectOption.BLANK_PROJECTS,
  };

  selectVersionList: ListType[] = [
    { id: 0, name: '1.2.3', icon: '', selected: false },
    { id: 1, name: '2.3.4', icon: '', selected: false },
    { id: 2, name: '3.4.5.', icon: '', selected: false },
  ];

  selectDatabaseList: ListType[] = [
    { id: 0, name: '1.2', icon: '', selected: false },
    { id: 1, name: '2.1', icon: '', selected: false },
    { id: 2, name: '2.3', icon: '', selected: false },
  ];

  cmsList = [
    {
      id: 0,
      title: '',
      subTitle: '',
      active: false,
      icon: '',
      type: CMS.WORDPRESS,
      descritption: '',
      flag: '',
      groupTitle: '',
      status: '',
      order: false,
      timeStamp: '',
      disable: false,
      hideDivider: false,
      downloading: false,
      selected: false,
    },
    {
      id: 1,
      title: '',
      subTitle: '',
      icon: '',
      type: CMS.JOOMLA,
      descritption: '',
      flag: '',
      groupTitle: '',
      status: '',
      order: false,
      active: false,
      timeStamp: '',
      disable: false,
      hideDivider: false,
      downloading: false,
      selected: false,
    },
    {
      id: 2,
      title: '',
      subTitle: '',
      icon: '',
      type: CMS.DRUPAL,
      active: false,
      descritption: '',
      flag: '',
      groupTitle: '',
      status: '',
      order: false,
      timeStamp: '',
      disable: false,
      hideDivider: false,
      downloading: false,
      selected: false,
    },
    {
      id: 3,
      title: '',
      subTitle: '',
      icon: '',
      active: false,
      type: CMS.CUSTOM,
      descritption: '',
      flag: '',
      groupTitle: '',
      status: '',
      order: false,
      timeStamp: '',
      disable: false,
      hideDivider: false,
      downloading: false,
      selected: false,
    },
  ];

  constructor(props: Props) {
    super(props);
    const { startAt, reverseSteps, endAt, option } = this.props;
    this.state = {
      currentStep: reverseSteps ? endAt : startAt,
      prevStep: startAt > 1 ? startAt - 1 : 0,
      stepsEnded: false,
      addDescription: '',
      projectName: '',
      errorFields: [],
      errorField: InputField.DEFAULT,
      projectPass: 'admin',
      projectEmail: 'admin@stackabl.site',
      versionValue: '7.3',
      databaseValue: '5.7',
      projectUsername: 'admin',
      renderPHPVersionList: false,
      renderDatabaseVersionList: false,
      projectCmsTypeID: 0,
      defaultProjectLocation: changePath(userPath),
      projectTypeId: option,
      projectId: '',
      projectType: option,
      type: this.cmsList[0].type,
    };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { reverseSteps } = this.props;

    if (prevProps.reverseSteps !== reverseSteps) {
      this.setStepsOnReverse();
    }
  }

  getIconUsingId = (cms: IList) => {
    switch (cms.type) {
      case CMS.WORDPRESS:
        return 'WORDPRESS';
      case CMS.JOOMLA:
        return 'JOOMLA';
      case CMS.DRUPAL:
        return 'DRUPAL';
      case CMS.CUSTOM:
        return 'CUSTOM';
      default:
        return '';
    }
  };

  setStepsOnReverse = () => {
    this.setState({
      currentStep: 3,
      stepsEnded: false,
    });
  };

  onNextStepClickListener = () => {
    const { currentStep, projectCmsTypeID, projectTypeId } = this.state;
    const { endAt, onNextStepEnded, option, changeVal, submit } = this.props;
    if (currentStep === 1) {
      getHelpherVersions(this, this.cmsList[projectCmsTypeID]);
    }
    if (currentStep < endAt) {
      this.setState(
        (prevState) => ({
          currentStep: prevState.currentStep + 1,
          prevStep: prevState.currentStep,
        }),
        () => {
          const { currentStep: current } = this.state;
          changeVal(current);
        }
      );
    }
    if (currentStep === endAt) {
      this.setState({
        stepsEnded: true,
      });
      onNextStepEnded({
        ...this.state,
        projectId: nanoid(constants.nanoid_Length),
        type: this.cmsList[projectCmsTypeID].type,
      });
      if (projectTypeId === CreateProjectOption.BLANK_PROJECTS) {
        submit({
          ...this.state,
          type: this.cmsList[projectCmsTypeID].type,
          projectType: ProjectEnumType.BLANKPROJECT,
        });
      }
    }
  };

  onPrevStepClickListener = () => {
    const { currentStep } = this.state;
    const { startAt, changeVal } = this.props;
    if (currentStep !== startAt && currentStep > startAt) {
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
  };

  toggleVisibility = (conditon: boolean) => {
    return conditon ? Style.visibility_on : Style.visibility_hidden;
  };

  togglePrevSlideTransition = (condition: boolean) => {
    return condition ? Style.slide_prev : '';
  };

  onChangeProjectName = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ projectName: event.target.value });
  };

  onTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ addDescription: event.target.value });
  };

  onClearProjectName = () => {
    this.setState({ projectName: '' });
  };

  // On click select option scroll to end of div
  onSelectClickListener = () => {
    const elmnt = document.getElementById('create_new_project_id');
    elmnt?.scrollTo(0, elmnt.scrollHeight);
  };

  isPHPSelectionOptionRemoved = (islistRemoved: boolean) => {
    this.setState(
      {
        renderPHPVersionList: islistRemoved,
      },
      () => {
        this.onSelectClickListener();
      }
    );
  };

  isDatabaseSelectionOptionRemoved = (islistRemoved: boolean) => {
    this.setState(
      {
        renderDatabaseVersionList: islistRemoved,
      },
      () => {
        this.onSelectClickListener();
      }
    );
  };

  onClickSelectVersion = (item: ListType) => {
    this.setState({
      versionValue: item.name,
    });
    const sortList: ListType[] = this.selectVersionList.map(
      (version: ListType) => {
        let el = version;
        el = { ...version, selected: version.name === item.name };
        return el;
      }
    );
    this.selectVersionList = sortList;
  };

  onClickSelectDatabase = (item: ListType) => {
    this.setState({
      databaseValue: item.name,
    });

    const sortList: ListType[] = this.selectDatabaseList.map(
      (version: ListType) => {
        let el = version;
        el = { ...version, selected: version.name === item.name };
        return el;
      }
    );
    this.selectDatabaseList = sortList;
  };

  onSelectProjectCmsType = (i: IList) => {
    this.setState({ projectCmsTypeID: i.id });
    getHelpherVersions(this, i);
  };

  onClickProjectFrom = (id: number) => {
    const { changeOption } = this.props;
    changeOption(id);
    this.setState({ projectTypeId: id });
  };

  /**
   * browse project location
   */
  onClickBrowseBtn = () => {
    Analytics.getInstance().eventTracking(
      EVENT.Change,
      ACTION.Location,
      LABEL.Unique
    );

    const { dialog } = remote;
    const { defaultProjectLocation } = this.state;
    const sqlFilePath = dialog.showOpenDialogSync({
      defaultPath: defaultProjectLocation,
      title: 'Please select Project location directory',
      properties: ['openDirectory'],
    });
    if (sqlFilePath && sqlFilePath[0]) {
      this.setState((prevState) => {
        if (prevState.defaultProjectLocation !== sqlFilePath[0]) {
          return {
            ...prevState,
            defaultProjectLocation: changePath(sqlFilePath[0]),
          };
        }
        return { ...prevState, defaultProjectLocation };
      });
    }
  };

  /**
   * @description common funtion handles focus on input element
   * @param e  for e=0 focus element else disable focus
   * @param type
   */
  onFocus = (e: number, type: InputField) => {
    if (!e) {
      this.setState((prevState) => ({
        errorFields: [
          ...prevState.errorFields.filter((each) => each !== type),
          type,
        ],
      }));
    } else {
      this.setState((prevState) => ({
        errorFields: [...prevState.errorFields.filter((each) => each !== type)],
      }));
    }
  };

  /**
   * @description common funtion which trigger on focus out event used for showing input errors
   * @param value
   * @param type
   */
  onBlur = (value: string, type: InputField) => {
    const error = validation(type, value);
    if (error) {
      this.setState((prevState) => ({
        errorFields: [
          ...prevState.errorFields.filter((each) => each !== type),
          type,
        ],
      }));
    }
  };

  /**
   * @description common function return error based on input value
   * @param type
   * @param value
   * @returns {String}
   */
  handleErrorMessage = (type: InputField, value: string) => {
    const { errorFields } = this.state;
    if (errorFields.includes(type)) {
      return validation(type, value);
    }
    return '';
  };

  /**
   * @description handle submit text
   * @returns {String}
   */
  nextButtonText = () => {
    const { currentStep, projectTypeId } = this.state;
    const { endAt, option } = this.props;
    if (
      projectTypeId === CreateProjectOption.BLANK_PROJECTS &&
      currentStep === endAt
    ) {
      return 'create Project';
    }
    return 'continue';
  };

  render() {
    const {
      currentStep,
      prevStep,
      stepsEnded,
      addDescription,
      projectName,
      projectPass,
      projectEmail,
      versionValue,
      databaseValue,
      projectUsername,
      renderDatabaseVersionList,
      renderPHPVersionList,
      projectCmsTypeID,
      projectTypeId,
      defaultProjectLocation,
    } = this.state;
    const { startAt, theme, endAt, option } = this.props;
    return (
      <>
        {/* <!============== Basic Project step 1 start here ============== !> */}
        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt &&
                prevStep === (startAt > 1 ? startAt - 1 : 0)
            ),
            this.togglePrevSlideTransition(prevStep === startAt),
            Style.create_new_project_form_list
          )}
        >
          <Grid
            variant={Grid.getVariant.FLEX}
            customClass={classNames(Style.create_new_project_grid)}
          >
            <Col xs={4} md={4} lg={4}>
              <Card
                selected={CreateProjectOption.BLANK_PROJECTS === projectTypeId}
                onClickListener={() => {
                  this.onClickProjectFrom(CreateProjectOption.BLANK_PROJECTS);
                }}
                header={
                  <CheckBox
                    icon={Tick}
                    radius="50%"
                    checked={
                      CreateProjectOption.BLANK_PROJECTS === projectTypeId
                    }
                  />
                }
                footer={
                  <IconBox
                    customClass={classNames(Style.grid_card_icon)}
                    icon={getIcon('BLANK_PROJECT', theme.theme_mode)}
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
                  Blank Project
                </h3>
              </Card>
            </Col>
            <Col xs={4} md={4} lg={4}>
              <Card
                selected={
                  CreateProjectOption.CLONE_FROM_GITHUB === projectTypeId
                }
                onClickListener={() => {
                  this.onClickProjectFrom(
                    CreateProjectOption.CLONE_FROM_GITHUB
                  );
                }}
                header={
                  <CheckBox
                    icon={Tick}
                    radius="50%"
                    checked={
                      CreateProjectOption.CLONE_FROM_GITHUB === projectTypeId
                    }
                  />
                }
                footer={
                  <IconBox
                    customClass={classNames(Style.grid_card_icon)}
                    icon={getIcon('GITHUB_CLONE', theme.theme_mode)}
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
                  Clone from GitHub
                </h3>
              </Card>
            </Col>
            <Col xs={4} md={4} lg={4}>
              <Card
                selected={
                  CreateProjectOption.CLONE_FROM_WEBSITE === projectTypeId
                }
                onClickListener={() => {
                  this.onClickProjectFrom(
                    CreateProjectOption.CLONE_FROM_WEBSITE
                  );
                }}
                header={
                  <CheckBox
                    icon={Tick}
                    radius="50%"
                    disable={false}
                    checked={
                      CreateProjectOption.CLONE_FROM_WEBSITE === projectTypeId
                    }
                  />
                }
                footer={
                  <IconBox
                    customClass={classNames(Style.grid_card_icon)}
                    icon={getIcon('WEBSITE_CLONE', theme.theme_mode)}
                    tooltip={false}
                  />
                }
                customClass={classNames(
                  Style.create_new_project_grid_card,
                  Style.create_new_project_coming_soon
                )}
                // disable={true}
              >
                <h3
                  className={classNames(
                    Style.create_new_project_grid_card_title
                  )}
                >
                  Clone from Website
                </h3>
                <div
                  className={classNames(
                    Style.create_new_project_coming_soon_text
                  )}
                >
                  BETA
                </div>
              </Card>
            </Col>
          </Grid>
          <div
            className={classNames(Style.create_new_project_project_detail_form)}
          >
            <Input
              id="project_name"
              labelText="Project Name"
              value={projectName}
              cancelIcon={getIcon('CLEAR', theme.theme_mode)}
              onChangeListener={this.onChangeProjectName}
              onClearTextListener={this.onClearProjectName}
              disableFocus
              customClass={classNames(Style.create_new_project_project_input)}
              onFocus={(e) => this.onFocus(e, InputField.PROJECTNAME)}
              onBlur={() => {
                this.onBlur(projectName, InputField.PROJECTNAME);
              }}
              errorMessage={this.handleErrorMessage(
                InputField.PROJECTNAME,
                projectName
              )}
              // loaderIcon={getIcon('BUTTON_LOADER', theme.theme_mode)}
            />
            <TextArea
              id={1}
              customClass={classNames(
                Style.create_new_project_project_detail_textarea
              )}
              labelText="Project Description"
              // placeholder="Enter project descriptions"
              value={addDescription}
              onChangeListener={this.onTextAreaChange}
              maxLength={200}
            />
            <div
              className={classNames(
                Style.create_new_project_project_location_browse
              )}
            >
              <Input
                id="browse_name"
                labelText="Project Location"
                // value={defaultProjectLocation}
                // customClass={classNames(
                //   Style.create_new_project_project_input
                // )}
                // errorMessage={
                //   projectName.length
                //     ? this.validation(InputField.PROJECTNAME)
                //     : ''
                // }
                value={defaultProjectLocation}
                disable
                formGroupElements={
                  <Button
                    text="Browse"
                    size={Button.Size.SMALL}
                    customClass={classNames(
                      Style.create_new_project_project_location_browse_button
                    )}
                    onClickListener={this.onClickBrowseBtn}
                  />
                }
                // loaderIcon={getIcon('BUTTON_LOADER', theme.theme_mode)}
              />
              {/* <input
                      type="text"
                      className={classNames(
                        Style.create_new_project_project_location_browse
                      )}
                      value={defaultProjectLocation}
                      placeholder="Location"
                      disabled
                    />

                    <Button
                      text="Browse"
                      size={Button.Size.SMALL}
                      customClass={classNames(
                        Style.create_new_project_project_location_browse_button
                      )}
                      onClickListener={this.onClickBrowseBtn}
                    /> */}
            </div>
          </div>
        </div>
        {/* <!============== Basic Project step 1 end here ============== !> */}
        {/* <!============== Basic Project step 2 start here ============== !> */}

        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt + 1 && prevStep === currentStep - 1
            ),
            this.togglePrevSlideTransition(prevStep === startAt + 1),
            Style.create_new_project_select_cms_container
          )}
        >
          <div className={classNames(Style.create_new_project_select_cms)}>
            <Card
              customClass={classNames(
                Style.create_new_project_select_cms_github_url
              )}
              header={
                <>
                  {projectTypeId === CreateProjectOption.CLONE_FROM_GITHUB && (
                    <img
                      src={getIcon('GITHUB_CLONE', theme.theme_mode)}
                      alt="github"
                    />
                  )}
                  {projectTypeId === CreateProjectOption.CLONE_FROM_WEBSITE && (
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
                  )}
                </>
              }
            >
              <div className={classNames(Style.card_separator)} />
              {/* {currentStep === this.getLastTwoSteps(false ,Screen.GITHUBURL) && projectTypeId ===
                      CreateProjectOption.CLONE_FROM_GITHUB && (
                      <p>
                        <strong>GitHub URL: </strong> {gitUrl}
                      </p>
                    )} */}
              {/* {projectTypeId === CreateProjectOption.CLONE_FROM_WEBSITE && ( */}
              <p>
                <strong>Project: </strong>
                {_.capitalize(projectName)}
              </p>
              {/* )} */}
              {/* {projectTypeId === CreateProjectOption.BLANK_PROJECTS && ( */}
              <p>
                {/* <strong>Project: </strong> */}
                {/* {_.capitalize(projectName)} */}
              </p>
              {/* )} */}
              {/* {projectTypeId === CreateProjectOption.CLONE_FROM_GITHUB && ( */}
              <p>
                {/* <strong>Project: </strong> */}
                {/* {_.capitalize(projectName)} */}
              </p>
              {/* )} */}
            </Card>
            <h2>Select CMS</h2>
            <Grid
              variant={Grid.getVariant.FLEX}
              placement={Grid.Placement.MIDDLE}
              customClass={classNames(
                Style.create_new_project_select_cms_container_inner
              )}
            >
              {this.cmsList.map((cms) => (
                <Col xs={3} sm={3} md={3} lg={3} key={`select_cms_${cms.id}`}>
                  <Card
                    disable={cms.disable}
                    selected={cms.disable ? false : projectCmsTypeID === cms.id}
                    onClickListener={() => {
                      this.onSelectProjectCmsType(cms);
                    }}
                    customClass={classNames(
                      Style.create_new_project_select_cms_card,
                      projectCmsTypeID === cms.id
                        ? Style.selected
                        : Style.hovered,
                      cms.disable ? Style.disable : ''
                    )}
                    header={
                      !cms.disable ? (
                        <CheckBox
                          customClass={classNames(
                            Style.create_new_project_select_cms_card_checkbox
                          )}
                          placement={CheckBox.getplacement.RIGHT}
                          icon={Tick}
                          radius="50%"
                          checked={projectCmsTypeID === cms.id}
                        />
                      ) : (
                        <div
                          className={
                            Style.create_new_project_select_cms_card_coming_soon
                          }
                        >
                          COMING SOON
                        </div>
                      )
                    }
                  >
                    <IconBox
                      customClass={classNames(
                        Style.create_new_project_select_cms_icon
                      )}
                      icon={
                        cms.disable
                          ? getIcon(
                              `${this.getIconUsingId(cms)}_DISABLE`,
                              theme.theme_mode
                            )
                          : getIcon(this.getIconUsingId(cms), theme.theme_mode)
                      }
                      tooltip={false}
                      variant={IconBox.getVariant.OUTLINED}
                      radius="50%"
                    />
                    <h3>{cms.type}</h3>
                  </Card>
                </Col>
              ))}
            </Grid>
          </div>
        </div>
        {/* <!============== Basic Project step 2 end here ============== !> */}
        {/* <!============== Basic Project step 3 start here ============== !> */}

        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt + 2 &&
                prevStep === currentStep - 1 &&
                !stepsEnded
            ),
            this.togglePrevSlideTransition(prevStep === startAt + 2),
            this.togglePrevSlideTransition(stepsEnded),
            Style.create_new_project_cms_setting_form_container
          )}
        >
          <div
            className={classNames(Style.create_new_project_cms_setting_form)}
          >
            {/* <h2>{this.cmsList[projectCmsTypeID].type} Settings</h2> */}
            <h2> Settings</h2>

            {this.cmsList[projectCmsTypeID].type !==
              RegisterPackages.CUSTOM && (
              <>
                <Input
                  id="wordpress_name"
                  type="text"
                  labelText={`${this.cmsList[projectCmsTypeID].type} Username`}
                  value={projectUsername}
                  cancelIcon={getIcon('CLEAR', theme.theme_mode)}
                  onChangeListener={(event) => {
                    this.setState({ projectUsername: event.target.value });
                  }}
                  onClearTextListener={() =>
                    this.setState({ projectUsername: '' })
                  }
                  customClass={classNames(
                    Style.create_new_project_project_input
                  )}
                  onFocus={(e) => this.onFocus(e, InputField.USERNAME)}
                  onBlur={() =>
                    this.onBlur(projectUsername, InputField.USERNAME)
                  }
                  errorMessage={this.handleErrorMessage(
                    InputField.USERNAME,
                    projectUsername
                  )}
                />
                <Input
                  id="wordpress_password"
                  type="password"
                  labelText={`${this.cmsList[projectCmsTypeID].type} Password`}
                  value={projectPass}
                  cancelIcon={getIcon('CLEAR', theme.theme_mode)}
                  onChangeListener={(event) =>
                    this.setState({ projectPass: event.target.value })
                  }
                  onClearTextListener={() => this.setState({ projectPass: '' })}
                  customClass={classNames(
                    Style.create_new_project_project_input
                  )}
                  onFocus={(e) => this.onFocus(e, InputField.PASSWORD)}
                  onBlur={() => this.onBlur(projectPass, InputField.PASSWORD)}
                  errorMessage={this.handleErrorMessage(
                    InputField.PASSWORD,
                    projectPass
                  )}
                  icon={[
                    getIcon('SHOW_PASSWORD', theme.theme_mode),
                    getIcon('HIDE_PASSWORD', theme.theme_mode),
                  ]}
                  // uncomment for error
                  // errorMessage="Please provide a correct password."
                />
                <Input
                  type="email"
                  id="wordpress_email"
                  labelText={`${this.cmsList[projectCmsTypeID].type} Email`}
                  value={projectEmail}
                  cancelIcon={getIcon('CLEAR', theme.theme_mode)}
                  onChangeListener={(event) =>
                    this.setState({ projectEmail: event.target.value })
                  }
                  onClearTextListener={() =>
                    this.setState({ projectEmail: '' })
                  }
                  customClass={classNames(
                    Style.create_new_project_project_input
                  )}
                  onFocus={(e) => this.onFocus(e, InputField.EMAIL)}
                  onBlur={() => this.onBlur(projectEmail, InputField.EMAIL)}
                  errorMessage={this.handleErrorMessage(
                    InputField.EMAIL,
                    projectEmail
                  )}
                />
              </>
            )}
            <Grid variant={Grid.getVariant.FLEX}>
              <Col xs={6}>
                <SelectOptions
                  id="php_select_option"
                  placeholder="Select PHP Version"
                  customClass={classNames(
                    Style.create_new_project_cms_setting_form_select
                  )}
                  customDropdownClass={Style.create_new_project_select_dropdown}
                  listOuterClass={Style.select_list_outer}
                  value={versionValue}
                  width="100%"
                  icon={getIcon('DROPDOWN', theme.theme_mode)}
                  selectedItem={(item) => this.onClickSelectVersion(item)}
                  selectList={
                    renderPHPVersionList ? this.selectVersionList : []
                  }
                  selectIcon={getIcon('TICK', theme.theme_mode)}
                  isOptionsRemoved={(isListRemoved) => {
                    this.isPHPSelectionOptionRemoved(isListRemoved);
                  }}
                />
              </Col>
              <Col xs={6}>
                <SelectOptions
                  id="database_select_option"
                  placeholder="Select MySQL Version"
                  customClass={classNames(
                    Style.create_new_project_cms_setting_form_select
                  )}
                  customDropdownClass={Style.create_new_project_select_dropdown}
                  listOuterClass={Style.select_list_outer}
                  value={databaseValue}
                  width="100%"
                  selected
                  icon={getIcon('DROPDOWN', theme.theme_mode)}
                  selectList={
                    renderDatabaseVersionList ? this.selectDatabaseList : []
                  }
                  selectedItem={(item) => {
                    this.onClickSelectDatabase(item);
                  }}
                  selectIcon={getIcon('TICK', theme.theme_mode)}
                  isOptionsRemoved={(isListRemoved) => {
                    this.isDatabaseSelectionOptionRemoved(isListRemoved);
                  }}
                />
              </Col>
            </Grid>
          </div>
        </div>
        {/* <!============== Basic Project step 3 end here ============== !> */}
        {/* <!============== Basic Project step bottom button bar start here ============== !> */}

        {!stepsEnded && (
          <div
            id="button_container_id"
            className={classNames(Style.create_new_project_buttons_container)}
          >
            <Button
              text="Back"
              customClass={classNames(Style.create_new_project_button_cancel)}
              size={Button.Size.LARGE}
              // disable={currentStep !== 1 && (showLoader || autoFetchingDB)}
              onClickListener={this.onPrevStepClickListener}
            />
            <div className={classNames(Style.create_new_project_button_group)}>
              <Button
                text={this.nextButtonText()}
                customClass={classNames(
                  Style.create_new_project_button_continue
                )}
                variant={Button.getVariant.CONTAINED}
                disable={!!disableStep(this)}
                onClickListener={this.onNextStepClickListener}
                alignIcon={Button.getPosition.LEFT}
                // Enable buttton loader whenever you want loading process
                //   loader={
                //     (loadingInput && gitUrl !== '' ? ButtonLoader : '') ||
                //  }
              />
            </div>
          </div>
        )}
        {/* <!============== Basic Project step bottom button bar end here ============== !> */}
      </>
    );
  }
}
const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(BasicProject));
