/* eslint-disable no-underscore-dangle */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-did-update-set-state */
/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';

import {
  IconBox,
  Grid,
  Col,
  Button,
  Tab,
  TabPanel,
  Tooltip,
  ButtonDropdown,
} from '@stackabl/ui';
import { connect } from 'react-redux';
import { ProjectsSchema } from '@stackabl/core/render/Database/schema';
import electronlog from '@stackabl/core/shared/logger';
import Platform, {
  currentPlatform,
} from '@stackabl/core/shared/dependencies/platform';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import db from '@stackabl/core/render/Database';
import { ProjectEnumType } from '@stackabl/core/render/common';
import { PushPullStatus } from '@stackabl/website-push-pull/shared/constants';
import Style from './index.scss';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import ProjectActions from '../../../actions/projects';
import { InitialProjectState } from '../../../reducers/projects';
import { IList } from '../../../utils/ListSchema';
import { getIcon } from '../../../utils/themes/icons';
import routes from '../../../constants/routes.json';

const log = electronlog.scope('project-setting/loading');

const TabId = {
  WEBSITE_SETTINGS: 0,
  DATABASE: 1,
  UTILITIES: 2,
  CLONE_SETTING: 3,
};

interface TabList {
  id: number;
  name: string;
  disable: boolean;
  icon: string;
  type: string;
  tag: string;
}

interface StateProps {
  projectsData: InitialProjectState;
  theme: InitialThemeState;
}

interface DispatchProps {
  currentProject: (payload: IList) => void;
  getAllProjects: (payload: IList[]) => void;
  updateProject: (payload: IList) => void;
}

interface LocationState {
  location: {
    state: ProjectsSchema;
  };
}
interface State {
  activeTabId: string;
  tabId: number;

  currentProject: IList;
  project: ProjectsSchema;

  viewWebsiteValue: string;
}

type Props = StateProps & RouteComponentProps & DispatchProps & LocationState;

class ProjectSettings extends React.Component<Props, State> {
  tabList: TabList[] = [
    {
      id: 0,
      name: 'Website Settings',
      disable: false,
      icon: '',
      type: '',
      tag: '',
    },
    {
      id: 1,
      name: 'Database',
      disable: false,
      icon: '',
      type: '',
      tag: '',
    },
    {
      id: 2,
      name: 'Utilities',
      disable: false,
      icon: '',
      type: '',
      tag: '',
    },
    {
      id: 3,
      name: 'Sync',
      disable: false,
      icon: '',
      type: '',
      tag: 'BETA',
    },
  ];

  constructor(props: Props) {
    super(props);
    const {
      location: { state },
      projectsData: { currentProject },
    } = props;

    /**
     * Need To discuss how to send the value
     * @resolved
     *
     * */
    const project: ProjectsSchema = { ...state };
    this.state = {
      tabId: TabId.WEBSITE_SETTINGS,
      activeTabId: '',
      currentProject, // redux props
      project, // state push from setting up site

      viewWebsiteValue: 'Admin',
    };
  }

  componentDidMount() {
    this.init();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      location: { pathname: prevPath },
    } = prevProps;
    const {
      projectsData: { currentProject }, // redux props
      projectsData: {
        currentProject: { showImportDbModal },
      },
      location: { pathname: currentPath },
      currentProject: currProject,
    } = this.props;

    log.info('CompoientnDIdUpdate', prevPath, currentPath);
    if (prevPath === currentPath) {
      log.info('pathComparionsEqual');
      this.init();
    }
  }

  /**
   *@description show skelton click overlay
   */
  enableLoadingSkeleton = () => {
    // alert('skeleton loadding overlay clicked');
  };

  getKeyByValue = (
    object: { [label: string]: string },
    value: string
  ): string => {
    return (
      Object.keys(object).find((key) => object[key] === value) ||
      'THEME_COLOR_0'
    );
  };

  /**
   * @description method to initilise and getting project configration
   */
  async init() {
    const {
      projectsData: {
        currentProject: { title, subTitle },
      },
      history,
    } = this.props;
    const metaDb = await db.getInstance();
    const project = metaDb.getProjectByParam({
      name: title,
      container_name: subTitle,
    });
    log.info('loadingPushPull', project);
    if (
      !(
        project.projectType === ProjectEnumType.CLONEWEBSITE &&
        project.webSync?.pushPullStatus === PushPullStatus.RUNNING
      )
    ) {
      log.info('pushPull not running');
      setTimeout(() => {
        history.push({
          pathname: routes.DASHBOARD + routes.PROJECT_SETTINGS,
          state: JSON.parse(
            JSON.stringify({ ...project, meta: [...project.meta] })
          ),
        });
      }, 2000);
    }
  }

  render() {
    const { theme } = this.props;

    const {
      tabId,
      activeTabId,
      project: { git_clone_url },
      currentProject: { type },
      viewWebsiteValue,
    } = this.state;

    return (
      <div className={classNames(Style.project_setting_dashboard)}>
        <div className={classNames(Style.project_setting_container)}>
          <h1 className={classNames(Style.project_setting_heading)}>
            <SkeletonTheme
              color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
              highlightColor={theme.theme_mode === 'dark' ? `#151515` : `#eee`}
            >
              <Skeleton height={10} width={150} />
            </SkeletonTheme>
          </h1>
          <div
            className={classNames(
              Style.project_setting_info_description_action_main
            )}
          >
            <Grid>
              <SkeletonTheme
                color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                highlightColor={
                  theme.theme_mode === 'dark' ? `#151515` : `#eee`
                }
              >
                <Skeleton height={10} />
              </SkeletonTheme>
            </Grid>

            <div className={classNames(Style.project_setting_actions)}>
              <Grid
                variant={Grid.getVariant.FLEX}
                placement={Grid.Placement.MIDDLE}
                spacing={Grid.Spacing.BETWEEN}
              >
                <Col
                  customClass={classNames(Style.project_setting_actions_col)}
                >
                  <Button
                    id="project_settings_start_stop_button"
                    text="Start Site"
                    size={Button.Size.MEDIUM}
                    icon={getIcon('START_SITE', theme.theme_mode)}
                    // uncomment loader for loading effect on button
                    // for default use below and for colred button import from Icon/common folder
                    // loader={getIcon('BUTTON_LOADER', theme.theme_mode)}
                    // icon={getIcon('START_SITE', theme.theme_mode)}
                    alignIcon={Button.getPosition.LEFT}
                    customClass={classNames(
                      Style.project_setting_actions_icons,
                      Style.project_setting_actions_start_icon
                    )}
                  />
                  {/* {Enable this SelectOption when you need dropdown for view website options } */}
                  <ButtonDropdown
                    customClass={Style.button_dropdown_view_website}
                    id="view_website_select_option"
                    title={viewWebsiteValue}
                    icon={getIcon('VIEW_SITE', theme.theme_mode)}
                    iconDropdown={getIcon('DROPDOWN', theme.theme_mode)}
                    selectIcon={getIcon('TICK', theme.theme_mode)}
                    variant={ButtonDropdown.Size.MEDIUM}
                  />

                  <Button
                    id="project_settings_public_link_button"
                    text="Public Link"
                    size={Button.Size.MEDIUM}
                    icon={getIcon('PUBLIC_LINK', theme.theme_mode)}
                    alignIcon={Button.getPosition.LEFT}
                    customClass={classNames(
                      Style.project_setting_actions_icons,
                      Style.project_setting_action_public_link
                    )}
                  />
                </Col>
                <Col
                  customClass={classNames(
                    Style.project_setting_actions_col,
                    Style.project_setting_actions_col_right
                  )}
                >
                  {/** Open Terminal New design for window system, for use unccoment */}
                  {(Platform.Win32 === currentPlatform ||
                    Platform.Win32x64 === currentPlatform) && (
                    <IconBox
                      radius="4px"
                      tooltip
                      name="Open Terminal"
                      variant={IconBox.getVariant.OUTLINED}
                      icon={getIcon('TERMINAL', theme.theme_mode)}
                      dropdownIcon={getIcon('DROPDOWN', theme.theme_mode)}
                      customClass={classNames(
                        Style.project_settings_open_terminal_dropdown_icon
                      )}
                      listOuterClass={classNames(
                        Style.project_settings_open_terminal_list_outer
                      )}
                    />
                  )}
                  {/* Enable only For mac */}
                  {Platform.Darwin === currentPlatform && (
                    <Tooltip
                      title="Open Terminal"
                      placement={Tooltip.getPlacement.BOTTOM}
                      customClass={classNames(
                        Style.project_setting_actions_copy_link_tooltip,
                        Style.project_setting_icon_gap
                      )}
                    >
                      <Button
                        id="project_settings_terminal_button"
                        icon={getIcon('TERMINAL', theme.theme_mode)}
                        alignIcon={Button.getPosition.LEFT}
                        customClass={classNames(
                          Style.project_setting_actions_terminal
                        )}
                      />
                    </Tooltip>
                  )}
                  <Tooltip
                    title="SL Disabled"
                    placement={Tooltip.getPlacement.BOTTOM}
                    customClass={classNames(
                      Style.project_setting_actions_copy_link_tooltip,
                      Style.project_setting_icon_gap
                    )}
                  >
                    <Button
                      id="project_settings_cert_button"
                      icon={getIcon('DISABLE_CERTIFICATE', theme.theme_mode)}
                      alignIcon={Button.getPosition.LEFT}
                      customClass={classNames(
                        Style.project_setting_actions_cert
                      )}
                    />
                  </Tooltip>

                  <Tooltip
                    title="Delete"
                    placement={Tooltip.getPlacement.BOTTOM}
                    customClass={classNames(
                      Style.project_setting_actions_copy_link_tooltip
                    )}
                  >
                    <Button
                      id="project_settings_delete_button"
                      icon={getIcon('DELETE', theme.theme_mode)}
                      alignIcon={Button.getPosition.LEFT}
                      alignButton="center"
                      customClass={classNames(
                        Style.project_setting_actions_delete
                      )}
                    />
                  </Tooltip>
                </Col>
              </Grid>
            </div>
          </div>
        </div>
        <div className={classNames(Style.project_setting_inner_container)}>
          {/* Uncomment the class "project_setting_terminal_open" when ternimal is enable */}
          <Tab
            activeTabId={activeTabId}
            radius="4px 4px 0 0"
            tabList={this.tabList}
            // onTabClickListener={(item) => this.onTabClickListener(item)}
            customClass={classNames(Style.project_setting_tabs)}
            customTabContent={classNames(Style.project_setting_tabs_content)}
          >
            {tabId === TabId.WEBSITE_SETTINGS ? (
              <div className={classNames(Style.website_setting_outer)}>
                <TabPanel
                  id={TabId.WEBSITE_SETTINGS}
                  customClass={classNames(
                    Style.project_setting_tabs_content_website_settings,
                    Style.project_setting_tabs_content_main
                  )}
                >
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    customClass={classNames(Style.project_setting_list)}
                  >
                    <Col
                      xs={3}
                      md={3}
                      lg={3}
                      customClass={Style.project_settings_col}
                    >
                      <strong> MySQL Version: </strong>
                    </Col>
                    <Col customClass={Style.project_settings_skelton_loading}>
                      <SkeletonTheme
                        color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                        highlightColor={
                          theme.theme_mode === 'dark' ? `#151515` : `#eee`
                        }
                      >
                        <Skeleton height={10} />
                      </SkeletonTheme>
                    </Col>
                  </Grid>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    customClass={classNames(Style.project_setting_list)}
                  >
                    <Col
                      xs={3}
                      md={3}
                      lg={3}
                      customClass={Style.project_settings_col}
                    >
                      <strong> PHP Version: </strong>
                    </Col>
                    <Col customClass={Style.project_settings_skelton_loading}>
                      <SkeletonTheme
                        color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                        highlightColor={
                          theme.theme_mode === 'dark' ? `#151515` : `#eee`
                        }
                      >
                        <Skeleton height={10} />
                      </SkeletonTheme>
                    </Col>
                  </Grid>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    customClass={classNames(Style.project_setting_list)}
                  >
                    <Col
                      xs={3}
                      md={3}
                      lg={3}
                      customClass={Style.project_settings_col}
                    >
                      <strong> Web Sever: </strong>
                    </Col>
                    <Col customClass={Style.project_settings_skelton_loading}>
                      <SkeletonTheme
                        color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                        highlightColor={
                          theme.theme_mode === 'dark' ? `#151515` : `#eee`
                        }
                      >
                        <Skeleton height={10} />
                      </SkeletonTheme>
                    </Col>
                  </Grid>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    customClass={classNames(Style.project_setting_list)}
                  >
                    <Col
                      xs={3}
                      md={3}
                      lg={3}
                      customClass={Style.project_settings_col}
                    >
                      <strong> {`${type} Version:`} </strong>
                    </Col>
                    <Col customClass={Style.project_settings_skelton_loading}>
                      <SkeletonTheme
                        color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                        highlightColor={
                          theme.theme_mode === 'dark' ? `#151515` : `#eee`
                        }
                      >
                        <Skeleton height={10} />
                      </SkeletonTheme>
                    </Col>
                  </Grid>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    customClass={classNames(Style.project_setting_list)}
                  >
                    <Col
                      xs={3}
                      md={3}
                      lg={3}
                      customClass={Style.project_settings_col}
                    >
                      <strong> Site Name: </strong>
                    </Col>
                    <Col customClass={Style.project_settings_skelton_loading}>
                      <SkeletonTheme
                        color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                        highlightColor={
                          theme.theme_mode === 'dark' ? `#151515` : `#eee`
                        }
                      >
                        <Skeleton height={10} />
                      </SkeletonTheme>
                    </Col>
                  </Grid>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    customClass={classNames(Style.project_setting_list)}
                  >
                    <Col
                      xs={3}
                      md={3}
                      lg={3}
                      customClass={Style.project_settings_col}
                    >
                      <strong> Site Domain: </strong>
                    </Col>
                    <Col customClass={Style.project_settings_skelton_loading}>
                      <SkeletonTheme
                        color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                        highlightColor={
                          theme.theme_mode === 'dark' ? `#151515` : `#eee`
                        }
                      >
                        <Skeleton height={10} />
                      </SkeletonTheme>
                    </Col>
                  </Grid>
                  <Grid
                    variant={Grid.getVariant.FLEX}
                    placement={Grid.Placement.MIDDLE}
                    customClass={classNames(Style.project_setting_list)}
                  >
                    <Col
                      xs={3}
                      sm={3}
                      lg={3}
                      customClass={Style.project_settings_col}
                    >
                      <strong> Site Path: </strong>
                    </Col>
                    <Col customClass={Style.project_settings_skelton_loading}>
                      <SkeletonTheme
                        color={theme.theme_mode === 'dark' ? `#232323` : `#ddd`}
                        highlightColor={
                          theme.theme_mode === 'dark' ? `#151515` : `#eee`
                        }
                      >
                        <Skeleton height={10} />
                      </SkeletonTheme>
                    </Col>
                  </Grid>
                  {git_clone_url && git_clone_url !== '' && (
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(Style.project_setting_list)}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={Style.project_settings_col}
                      >
                        <strong> Repository: </strong>
                      </Col>
                      <Col customClass={Style.project_settings_skelton_loading}>
                        <SkeletonTheme
                          color={
                            theme.theme_mode === 'dark' ? `#232323` : `#ddd`
                          }
                          highlightColor={
                            theme.theme_mode === 'dark' ? `#151515` : `#eee`
                          }
                        >
                          <Skeleton height={10} />
                        </SkeletonTheme>
                      </Col>
                    </Grid>
                  )}
                </TabPanel>
              </div>
            ) : null}
          </Tab>
        </div>

        <div
          onClick={() => this.enableLoadingSkeleton()}
          className={classNames(Style.overlay_skeleton)}
          role="presentation"
        />
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    projectsData: state.project_attributes,
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ProjectActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ProjectSettings)
);
