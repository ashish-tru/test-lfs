import * as React from 'react';
import classNames from 'classnames';
import { Button, IconBox, Input, SelectOptions } from '@stackabl/ui';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Dispatcher, IselectBranch } from '@stackabl/git';
import { IapiBranch, IapiRepository } from '@stackabl/git/src/lib/api';
import { URLActionType } from '@stackabl/git/src/lib/parse-app-url';
import { Account } from '@stackabl/git/src/models/account';
import Analytics, {
  ACTION,
  EVENT,
  LABEL,
} from '@stackabl/core/render/analytics';
import logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { ProjectEnumType } from '@stackabl/core/render/common';
import Style from './index.scss';
import { InitialThemeState } from '../../../reducers/theme';
import { RootState } from '../../../reducers/types';
import { getIcon } from '../../../utils/themes/icons';
import BasicProject from './basic-project';
import Tick from '../../../resources/Icons/Common/check.svg';
import GoTo from '../../../resources/Icons/Common/go_to.svg';
import GoToSetting from '../../../resources/Icons/Common/setting.svg';
import Success from '../../../resources/Icons/Common/success.svg';
// import Error from '../../../resources/Icons/Common/error.svg';
import ButtonLoader from '../../../resources/Icons/Dark-Mode/button_loader.svg';
import routes from '../../../constants/routes.json';
import {
  AllProjectState,
  disableGithubProject,
  disableStep,
  Ilogin,
} from '../../../utils/common';

const log = logger.scope('clone-from-github');

interface State {
  currentStep: number;
  goBackToBasicProject: boolean;
  gitUrl: string;
  authenticationFailed: boolean;
  inputError: string;
  repoCallbackError: boolean;
  branches: IselectBranch[];
  projectBranchName: string;
  renderGitBranchList: boolean;
  showLoader: boolean;
  login: Ilogin;
  signInDifferentAccount: boolean;
  loadingInput: boolean;
  showLoginSuccessBox: boolean;
  isLoginOnceClicked: boolean;
    gitUsers: string;
  gitUserNames: string[];
  currentGitUser: string;
}
interface ListType {
  id: number;
  name: string;
  icon: string;
  selected: boolean;
}

interface StateProps {
  theme: InitialThemeState;
}

interface Props {
  startAt: number;
  endAt: number;
  submit: (
    state: BlankProjectState & {
      login: Ilogin;
      gitUrl: string;
      gitLogin: string;
      projectBranchName: string;
    }
  ) => void;
  changeVal: (val: number) => void;
  changeOption: (type: number) => void;
  option: number;
}

type ComponentProps = StateProps & Props & RouteComponentProps;
class CloneFromGithub extends React.Component<ComponentProps, State> {
  selectBranchList: ListType[] = [
    { id: 0, name: 'Branch1', icon: '', selected: false },
    { id: 1, name: 'Branch2', icon: '', selected: false },
    { id: 2, name: 'Branch3', icon: '', selected: false },
  ];

  blankState!: BlankProjectState;

  dispatcher!: Dispatcher;

  url_action: (
    event: Electron.IpcRendererEvent,
    { action }: { action: URLActionType }
  ) => void;

  constructor(props: ComponentProps) {
    super(props);
    const { startAt } = this.props;
    this.state = {
      repoCallbackError: false,
      currentStep: startAt,
      prevStep: startAt > 1 ? startAt - 1 : 0,
      basicProjectEnded: false,
      goBackToBasicProject: false,
      gitUrl: '',
      loadingInput: false,
      projectBranchName: '',
      isLoginOnceClicked: false,
      showLoader: false,
      showLoginSuccessBox: false,
      inputError: '',
      authenticationFailed: false,
      renderGitBranchList: false,
      signInDifferentAccount: false,
      branches: [],
      login: { success: false, user_login: '', avatar: '' },
    };

    this.url_action = async (
      _event: Electron.IpcRendererEvent,
      { action }: { action: URLActionType }
    ) => {
      const { gitUrl } = this.state;
      this.setState({
        showLoginSuccessBox: true,
        inputError: '',
        showLoader: true,
      });
      if (gitUrl) {
        await this.repositoryhandler();
      }
      this.dispatcher
        .dispatchURLAction(action)
        .then(async (result) => {
          const account = await this.dispatcher.getCurrentAccount();

          this.setState((prevState) => ({
            ...prevState,
            login: {
              ...prevState.login,
              success: true,
              user_login: account ? account.login : '',
              avatar: account ? account.avatarURL : '',
            },
            signInDifferentAccount: false,
            showLoader: false,
          }));

          return result;
        })
        .catch((error) => {
          this.setState({
            authenticationFailed: true,
            signInDifferentAccount: false,
            loadingInput: false,
            showLoader: false,
          });
          // log.info(error);
        });
    };
  }

  onClickLoginUsingBrowser = async (
    _param1 = '',
    _param2 = '',
    _param3 = ''
  ) => {
    const { signInDifferentAccount, isLoginOnceClicked } = this.state;
    Analytics.getInstance().eventTracking(
      EVENT.Dashboard,
      `${ACTION.Git} ${LABEL.Login}`,
      LABEL.Success
    );
    this.setState({
      authenticationFailed: false,
      login: {
        success: false,
        user_login: '',
        avatar: '',
        // user_email: ''
      },
      inputError: '',
    });

    const account = await this.dispatcher.getCurrentAccount();
    if (account) {
      this.setState({ signInDifferentAccount: true }, async () => {
        await this.dispatcher.signOut(account);
        log.info(
          'Working on sign in with account!!!!!',
          signInDifferentAccount
        );
      });
    }

    if (isLoginOnceClicked) {
      this.dispatcher.initialiseGithubSignIn();
    }
    await this.dispatcher.authenticateUsingBrowser();
    this.setState({ isLoginOnceClicked: true });
  };

  disableState = () => {
    this.setState({
      branches: [],
      projectBranchName: '',
    });
  };

  getBranchesFromRepository = async (repository: {
    repo: IapiRepository;
    account: Account;
  }) => {
    debugger;
    let branchList: Array<IselectBranch> = [];
    const { gitUrl } = this.state;
    let getAllBranches: ReadonlyArray<IapiBranch> | null;
    if (gitUrl) {
      getAllBranches = await this.dispatcher.getBranchesusingURL(
        gitUrl,
        repository.account
      );
      if (getAllBranches) {
        branchList = getAllBranches.map((item, index: number) => {
          const branch: IselectBranch = {
            id: index,
            name: item.name,
            type: 'branch_name',
            protected: item.protected,
            selected: item.name === repository.default_branch,
            tag: item.name === repository.default_branch ? 'default' : '',
          };
          return branch;
        });

        this.setState(
          (prevState) => ({
            ...prevState,
            branches: branchList,
            projectBranchName: repository.default_branch,
            currentStep: prevState.currentStep + 1,
            prevStep: prevState.currentStep,
            whether_git_branch_selected: true,
            loadingInput: false,
          }),
          () => {
            // Commented by Munish
            // this.getHelpherVersions(this.cmsList[projectCmsTypeID]);
          }
        );
      } else {
        this.setState({
          inputError: 'No branch found. Please check the repository in GitHub.',
          projectBranchName: 'No branch found',
          loadingInput: false,
        });
      }
    }
  };

  onSubmitInputListener = async (
    event?:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    event?.preventDefault();
    this.setState({
      authenticationFailed: false,
      loadingInput: true,
      showLoginSuccessBox: false,
      inputError: '',
    });
    // this.setState({ showStep: true });
    await this.repositoryhandler();
  };

  showErrormessages = (e: string, _account: boolean) => {
    // let error_arr: string[] = [];
    let inputError: string;
    if (e.includes('Failed to fetch')) {
      inputError = 'Please check your internet connection and try again!';
      // error_arr = [
      //   'Please check your internet connection and try again!',
      //   'Failed to fetch. \nCheck your internet connection and try again'
      // ];
    } else if (e.includes('returned a 404')) {
      Analytics.getInstance().eventTracking(
        EVENT.Dashboard,
        ACTION.Authentic,
        LABEL.Fail
      );
      inputError =
        'You do not have permission to access this repository. Go to settings to switch account.';
      // error_arr = [
      //   'You do not have permission to access this.',
      //   account
      //     ? 'Returned a 404. Check the repository settings in git to confirm the access.'
      //     : 'Returned a 404. You are not logged in to GitHub Account.'
      // ];
    } else {
      inputError = `Something went wrong! ${e}.`;
      // error_arr = ['Something went wrong!', e];
    }
    this.setState(
      (prevState) => ({
        inputError,
        authenticationFailed: e.includes('returned a 404'),
        login: {
          ...prevState.login,
          success: false,
        },
        loadingInput: false,
      }),
      this.disableState
    );
  };

  isURLEmpty = () => {
    const { gitUrl } = this.state;
    if (gitUrl !== '') {
      return false;
    }
    this.setState((prevState) => ({
      inputError: 'Empty URL.',
      authenticationFailed: false,
      projectBranchName: '',
      login: {
        ...prevState.login,
        success: false,
      },
      loadingInput: false,
    }));
    return true;
  };

  isURLValid = () => {
    const { gitUrl } = this.state;
    if (gitUrl && Dispatcher.validateURL(gitUrl)) {
      return true;
    }
    this.setState(
      (prevState) => ({
        inputError: 'Invalid URL. Please use valid GIT HTTPS URL.',
        authenticationFailed: false,
        login: {
          ...prevState.login,
          success: false,
        },
        loadingInput: false,
      }),
      this.disableState
    );
    return false;
  };

  repositoryhandler = async () => {
    const { gitUrl, repoCallbackError } = this.state;
    const gitUserName = localStorage.getItem('currentUser') || '';
    if (!this.isURLEmpty()) {
      if (this.isURLValid()) {
        const account = await this.dispatcher.getCurrentAccount(gitUserName);
        this.setState((prevState) => ({
          login: {
            ...prevState.login,
            user_login: account ? account.login : '',
            avatar: account ? account.avatarURL : '',
            user_email: account ? account.emails : '',
          },
        }));

        const repository = await this.dispatcher.validateAccountandRepository(
          gitUrl,
          gitUserName,
          (e) => {
            if (e) {
              if (e !== 'OK') {
                this.setState({ repoCallbackError: true });
                log.info('[git-setting.ts] repositoryhandler() Error:', e);
                this.showErrormessages(e, true);
              }
            }
          }
        );

        if (repository) {
          this.setState(
            {
              branches: [],
              inputError: '',
              authenticationFailed: false,
              // authentication: {
              //   ...prevState.authentication,
              //   failed: false,
              //   message: ''
              // },
              //  loadingInput: false,
              repoCallbackError: false,
            },
            () => {
              Analytics.getInstance().eventTracking(
                EVENT.Dashboard,
                ACTION.Authentic,
                LABEL.Success
              );
              this.getBranchesFromRepository(repository);
            }
          );
        } else if (!repoCallbackError) {
          this.showErrormessages('returned a 404', true);
        }
      }
    }
    this.setState({
      repoCallbackError: false,
    });
  };

  onNextStepClickListener = () => {
    const {
      currentStep,
      basicProjectEnded,
      gitUrl,
      login,
      projectBranchName,
    } = this.state;
    const { endAt, submit, changeVal } = this.props;
    // send data to parent
    if (currentStep === 5) {
      submit({
        ...this.blankState,
        login,
        gitUrl,
        gitLogin: login.user_login,
        projectBranchName,
        projectType: ProjectEnumType.CLONEFROMGITHUB,
      });
    }
    if (currentStep < endAt && basicProjectEnded) {
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
  };

  onPrevStepClickListener = () => {
    const { currentStep, basicProjectEnded } = this.state;
    const { startAt, changeVal } = this.props;
    if (currentStep !== startAt && currentStep > startAt && basicProjectEnded) {
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
  };

  onBasicProjectEnded = async (blankState: BlankProjectState) => {
    this.blankState = blankState;
    this.dispatcher = new Dispatcher();
    // ipcRenderer.on('url-action', this.url_action);
    // this.dispatcher.initialiseGithubSignIn();
    const gitUserName = localStorage.getItem('currentUer') || '';
    const account = await this.dispatcher.getCurrentAccount(gitUserName);
    this.setState((prevState) => ({
      ...prevState,
      login: {
        ...prevState.login,
        user_login: account ? account.login : '',
        avatar: account ? account.avatarURL : '',
        // user_email: email || ''
      },
      isGitInitialized: true,
      gitAccount: account,
      basicProjectEnded: true,
    }));
  };

  toggleVisibility = (conditon: boolean) => {
    return conditon ? Style.visibility_on : Style.visibility_hidden;
  };

  togglePrevSlideTransition = (condition: boolean) => {
    return condition ? Style.slide_prev : '';
  };

  onChangeGitUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      gitUrl: e.target.value,
    });
  };

  onClearProjectToken = () => {
    this.setState({
      gitUrl: '',
    });
  };

  isGitBranchListRemoved = (islistRemoved: boolean) => {
    this.setState({
      renderGitBranchList: islistRemoved,
    });
  };

  onClickSelectBranchName = (item: ListType) => {
    this.setState({
      projectBranchName: item.name,
    });
    const sortList: ListType[] = this.selectBranchList.map(
      (version: ListType) => {
        let el = version;
        el = { ...version, selected: version.name === item.name };
        return el;
      }
    );
    this.selectBranchList = sortList;
  };

  render() {
    const {
      currentStep,
      prevStep,
      basicProjectEnded,
      goBackToBasicProject,
      showLoginSuccessBox,
      gitUrl,
      branches,
      authenticationFailed,
      inputError,
      login,
      loadingInput,
      projectBranchName,
      renderGitBranchList,
    } = this.state;
    log.info(
      this.blankState,
      // this.blankState ? disableStep({ ...this.blankState, currentStep }) : {},
      'blankstate'
    );
    const {
      startAt,
      theme,
      changeVal,
      history,
      option,
      changeOption,
    } = this.props;
    return (
      <>
        {/* <!============== Basic Project step 1 to 3 start here ============== !> */}

        <BasicProject
          theme={theme}
          startAt={1}
          endAt={3}
          changeVal={changeVal}
          option={option}
          changeOption={changeOption}
          onNextStepEnded={this.onBasicProjectEnded}
          reverseSteps={goBackToBasicProject}
          submit={() => {}}
        />
        {/* <!============== Basic Project step 1 to 3 end here ============== !> */}
        {/* <!============== Clone from github step 4 start here ============== !> */}

        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt &&
                basicProjectEnded &&
                prevStep === (startAt > 1 ? startAt - 1 : 0)
            ),
            this.togglePrevSlideTransition(prevStep === startAt),
            Style.create_new_project_clone_from_github_container
          )}
        >
          {!login.user_login && gitUrl === '' && (
            <div
              className={classNames(Style.create_new_project_clone_from_github)}
            >
              <IconBox
                customClass={classNames(
                  Style.create_new_project_clone_github_icon
                )}
                tooltip={false}
                icon={getIcon('GITHUB_CLONE', theme.theme_mode)}
              />
              <h2>Sign in to your Github.com account.</h2>
              <Button
                customClass={classNames(Style.account_login_button)}
                text="Login Using Browser"
                alignIcon={Button.getPosition.RIGHT}
                icon={GoTo}
                variant={Button.getVariant.CONTAINED}
                onClickListener={() => this.onClickLoginUsingBrowser()}
              />
            </div>
          )}

          {(login.user_login && gitUrl !== '') ||
          login.user_login ||
          gitUrl !== '' ? (
            <div
              className={classNames(Style.create_new_project_github_clone_form)}
            >
              <Input
                type="text"
                id="github_https_url"
                labelText="Please enter GitHub HTTPS URL"
                value={gitUrl}
                disableFocus
                cancelIcon={getIcon('CLEAR', theme.theme_mode)}
                onChangeListener={this.onChangeGitUrl}
                onClearTextListener={this.onClearProjectToken}
                customClass={classNames(
                  Style.create_new_project_project_token_input
                )}
                loaderIcon={loadingInput && gitUrl !== '' ? ButtonLoader : ''}
                onSubmitListener={this.onSubmitInputListener}
                errorCustomClass={classNames(Style.git_hub_url_error)}
                disable={loadingInput && gitUrl !== ''}
                errorMessage={
                  authenticationFailed ? (
                    <>
                      {inputError}
                      <span
                        role="presentation"
                        onClick={() => {
                          history.push(routes.DASHBOARD + routes.SETTINGS);
                          // this.onClickLoginUsingBrowser(
                          //   'Git Settings',
                          //   'Git sign in with a different account',
                          //   ''
                          // );
                        }}
                        className={classNames(
                          Style.git_hub_url_error_sing_in_different
                        )}
                      >
                        Go to settings
                      </span>
                    </>
                  ) : (
                    inputError
                  )
                }
                // Input icon for press enter uncomment the code inputIcon  and inputTooltip, onInputIconClickListener
                inputIcon={getIcon('ENTER', theme.theme_mode)}
                inputTooltip="Press Enter"
                // onInputIconClickListener={() => this.onSubmitInputListener()}
                // For error message uncomment
                errorTextPlacement={Input.getPlacement.TOP}
              >
                <div className={classNames(Style.press_enter_container)}>
                  <Button
                    text="OK"
                    icon={Tick}
                    alignIcon={Button.getPosition.RIGHT}
                    variant={Button.getVariant.CONTAINED}
                    customClass={classNames(Style.enter_ok_btn)}
                    onClickListener={this.onSubmitInputListener}
                    // disable button using prop
                  />
                  <div
                    className={classNames(
                      Style.create_new_project_token_enter_info
                      // disable it when needed
                      // Style.disable_text
                    )}
                  >
                    press
                    <strong> Enter</strong>
                  </div>
                  <IconBox
                    customClass={classNames(Style.enter_icon)}
                    tooltip={false}
                    icon={getIcon('ENTER', theme.theme_mode)}
                    name="enter"
                  />
                </div>
              </Input>
              {showLoginSuccessBox && (
                <div className={classNames(Style.login_success_msg_container)}>
                  <img src={Success} alt="success" />
                  <span>Login Successful!</span>
                </div>
              )}
              {authenticationFailed && (
                <div
                  className={classNames(Style.github_go_to_setting_link)}
                  role="presentation"
                  // onClick={() => {
                  //   history.push(routes.DASHBOARD + routes.SETTINGS);
                  // }}
                >
                  <IconBox
                    customClass={classNames(
                      Style.github_go_to_setting_link_icon
                    )}
                    icon={GoToSetting}
                    tooltip={false}
                  />
                  <span>Go to settings</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
        {/* <!============== Clone from github step 4 end here ============== !> */}
        {/* <!============== Clone from github step 5 start here ============== !> */}
        <div
          className={classNames(
            this.toggleVisibility(
              currentStep === startAt + 1 &&
                prevStep === currentStep - 1 &&
                basicProjectEnded
            ),
            this.togglePrevSlideTransition(prevStep === startAt + 1),
            Style.create_new_project_select_github_branch_container
          )}
        >
          <div
            className={classNames(
              Style.create_new_project_select_github_branch
            )}
          >
            <SelectOptions
              id="git_branch_select_option"
              placeholder="Select Branch Name"
              customClass={classNames(Style.create_new_project_select_branch)}
              listOuterClass={Style.select_list_outer}
              value={projectBranchName}
              width="100%"
              icon={getIcon('DROPDOWN', theme.theme_mode)}
              selectIcon={Tick}
              selectList={renderGitBranchList ? branches : []}
              selectedItem={(item) => {
                this.onClickSelectBranchName(item);
              }}
              isOptionsRemoved={(isListRemoved) => {
                this.isGitBranchListRemoved(isListRemoved);
              }}
            />
          </div>
        </div>
        {/* <!============== Clone from github end 5 end here ============== !> */}
        {/* <!============== Clone from github step bottom button bar Start here ============== !> */}
        {basicProjectEnded && (
          <div
            id="button_container_github"
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
                text={currentStep === 5 ? 'create Project' : 'continue'}
                customClass={classNames(
                  Style.create_new_project_button_continue
                )}
                variant={Button.getVariant.CONTAINED}
                disable={
                  this.blankState &&
                  !!disableGithubProject({
                    ...this.blankState,
                    branches,
                    currentStep,
                    gitUrl,
                    inputError,
                    projectBranchName,
                  })
                }
                onClickListener={this.onNextStepClickListener}
                alignIcon={Button.getPosition.LEFT}
                // Enable buttton loader whenever you want loading process
                loader={loadingInput && gitUrl !== '' ? ButtonLoader : ''}
              />
            </div>
          </div>
        )}
        {/* <!============== Clone from github step bottom button bar Start here ============== !> */}
      </>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(CloneFromGithub));
