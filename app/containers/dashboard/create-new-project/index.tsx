import * as React from 'react';
import classNames from 'classnames';
// import { Button } from '@stackabl/ui';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { IselectBranch } from '@stackabl/git';
import { WebsiteClone } from '@stackabl/core/render/Database/schema';
import { nanoid } from 'nanoid';
import { changePath, runPath } from '@stackabl/core/render/common/systempath';
import Constants from '@stackabl/core/shared/constants';
import electronlog from 'electron-log';
import { ProjectEnumType } from '@stackabl/core/render/common';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import routes from '../../../constants/routes.json';
import {
  AllProjectState,
  BlankProjectState,
  Ilogin,
  InputField,
} from '../../../utils/common';

import Style from './index.scss';
import BasicProject from '../../container-components/create-new-project-forms/basic-project';
import CloneFromWebsite from '../../container-components/create-new-project-forms/clone-from-website';
import CloneFromGithub from '../../container-components/create-new-project-forms/clone-from-github';

const log = electronlog.scope('create-new-project');

interface StateProps {
  theme: InitialThemeState;
}

interface Props {
  id: number;
}
const CreateProjectOption = {
  BLANK_PROJECTS: 0,
  CLONE_FROM_GITHUB: 1,
  CLONE_FROM_WEBSITE: 2,
};

type ComponentProps = StateProps & Props & RouteComponentProps;
export interface ChildProp {
  projectName: string;
  siteName: string;
  isSshKeyCopied: boolean;
  addDescription: string;
  projectTypeId: number;
  defaultProjectLocation: string;
  initial: boolean;
  projectCmsTypeID: number;
  databaseValue: string;
  projectId: string;
  versionValue: string;
  projectUsername: string;
  projectPass: string;
  projectEmail: string;
  projectCloneWebsiteType: number;
  selectProjectName: string;
  createProjectName: string;
  projectToken: string;
  projectBranchName: string;
  currentStep: number;
  tagId: number;
  prevStep: number;
  renderPHPVersionList: boolean;
  renderDatabaseVersionList: boolean;
  renderGitBranchList: boolean;
  renderCloneList: boolean;
  // login: Ilogin;
  gitUrl: string;
  authenticationFailed: boolean;
  inputError: string;
  loadingInput: boolean;
  repoCallbackError: boolean;
  fieldList: InputField[];
  branches: Array<IselectBranch>;
  whether_git_branch_selected: boolean;
  showLoginSuccessBox: boolean;
  showLoader: boolean;
  isGitInitialized: boolean;
  gitAccount: Account | null;
  errorField: InputField;
  websiteClone: WebsiteClone;
  autoFetchingDB: boolean;
  formErrorTitle: string;
}
interface State {
  option: number;
  currentStep: number;
  screenObj: { [key: number]: { start: number; end: number } };
}

class CreateNewProject extends React.Component<ComponentProps, State> {
  constructor(props: ComponentProps) {
    super(props);
    this.state = {
      option: CreateProjectOption.BLANK_PROJECTS,
      currentStep: 1,
      screenObj: {
        0: { start: 1, end: 3 },
        1: { start: 4, end: 6 },
        2: { start: 4, end: 7 },
      },
    };
  }

  changeOption = (str: number) => {
    this.setState({
      option: str,
    });
  };

  validateProjectHandler = (args: BlankProjectState) => {
    const { history } = this.props;
    log.info('validateProjectHandler', args);
    // sessionStorage.setItem('state', JSON.stringify(this.state));
    const {
      projectName,
      projectUsername,
      projectTypeId,
      addDescription,
      projectType,
      projectCmsTypeID,
      type,
      versionValue,
      projectId,
      databaseValue,
      projectPass,
      projectEmail,
      defaultProjectLocation,
      gitUrl,
      projectBranchName,
      login,
      gitLogin,
      websiteClone: webClone,
    } = args;
    if (projectType !== ProjectEnumType.CLONEFROMGITHUB) {
      log.info(`[create-new-project] send url ${args.gitUrl}`);
    }
    let newProjectName = projectName.trim().toLowerCase();
    newProjectName = newProjectName.replace(/\s\s+/g, ' ');
    const obj = {
      projectType,
      projectName: newProjectName,
      projectUsername: decodeURIComponent(projectUsername),
      projectEmail: decodeURIComponent(projectEmail),
      projectPass: decodeURIComponent(projectPass),
      type,

      versionValue,
      databaseValue,
      addDescription,
      gitUrl,
      location: defaultProjectLocation
        ? { user: defaultProjectLocation, run: changePath(runPath) }
        : undefined,
      gitLogin,
      projectBranchName,
      id: projectId || nanoid(Constants.nanoid_Length),
      websiteClone:
        projectType === ProjectEnumType.CLONEWEBSITE
          ? {
              ...webClone,
              isDownloading: true,
            }
          : {},
    };
    history.push({
      pathname: `${routes.DASHBOARD}${routes.SETTING_UP_SITE}`,
      state: obj,
    });
  };

  // change current step value
  changeVal = (val: number) => this.setState({ currentStep: val });

  render() {
    const { currentStep, option, screenObj } = this.state;
    const { theme } = this.props;
    return (
      <div className={classNames(Style.create_new_project_dashboard)}>
        <div
          id="create_new_project_id"
          className={classNames(Style.create_new_project_outer)}
        >
          <div className={classNames(Style.create_new_project_inner_container)}>
            <h1 className={classNames(Style.create_new_project_heading)}>
              Create New Project
            </h1>

            <div className={classNames(Style.create_new_project_steps)}>
              {`Step ${currentStep} of ${screenObj[option].end}`}
              {/* {`Step ${currentStep} of ${
                projectTypeId === CreateProjectOption.BLANK_PROJECTS ? '3' : ''
              } ${
                projectTypeId === CreateProjectOption.CLONE_FROM_WEBSITE
                  ? '7'
                  : ''
} ${
                projectTypeId === CreateProjectOption.CLONE_FROM_GITHUB
                  ? '5'
                  : ''
              }  `} */}
            </div>
            <div className={classNames(Style.create_new_project_container)}>
              {/* <Button
                text="Basic Project"
                onClickListener={() => {
                  this.changeOption('basic');
                }}
              />
              <Button
                text="Git Project"
                onClickListener={() => {
                  this.changeOption('git');
                }}
              />
              <Button
                text="Website Project"
                onClickListener={() => {
                  this.changeOption('website');
                }}
              /> */}
              {option === CreateProjectOption.BLANK_PROJECTS && (
                <BasicProject
                  theme={theme}
                  option={option}
                  submit={(args: BlankProjectState) =>
                    this.validateProjectHandler(args)
                  }
                  onNextStepEnded={() => {}}
                  changeVal={this.changeVal}
                  startAt={screenObj[ProjectEnumType.BLANKPROJECT].start}
                  changeOption={(type: number) => this.changeOption(type)}
                  endAt={screenObj[ProjectEnumType.BLANKPROJECT].end}
                  reverseSteps={false}
                />
              )}

              {option === CreateProjectOption.CLONE_FROM_GITHUB && (
                <CloneFromGithub
                  theme={theme}
                  submit={(args: BlankProjectState) =>
                    this.validateProjectHandler(args)
                  }
                  startAt={screenObj[ProjectEnumType.CLONEFROMGITHUB].start}
                  option={option}
                  changeVal={this.changeVal}
                  changeOption={(type: number) => this.changeOption(type)}
                  endAt={screenObj[ProjectEnumType.CLONEFROMGITHUB].end}
                />
              )}
              {option === CreateProjectOption.CLONE_FROM_WEBSITE && (
                <CloneFromWebsite
                  theme={theme}
                  submit={(args: BlankProjectState) =>
                    this.validateProjectHandler(args)
                  }
                  changeVal={this.changeVal}
                  changeOption={(type: number) => this.changeOption(type)}
                  option={option}
                  startAt={screenObj[ProjectEnumType.CLONEWEBSITE].start}
                  endAt={screenObj[ProjectEnumType.CLONEWEBSITE].end}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(CreateNewProject));
