import * as React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { Modal, Grid, Col, Accordion, CheckBox, Button } from '@stackabl/ui';
import Database from '@stackabl/core/render/Database';
import { RootState } from '../../reducers/types';
import { InitialModalState } from '../../reducers/modal';
import { InitialThemeState } from '../../reducers/theme';
import ModalAction, { ModalDataType } from '../../actions/modal';
import Style from './index.scss';
import Tick from '../../resources/Icons/Common/check.svg';
import routes from '../../constants/routes.json';
import { getIcon } from '../../utils/themes/icons';
import { IList } from '../../utils/ListSchema';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
  currentProject: IList;
}
interface ListType {
  id: number;
  name: string;
  icon: string;

  selected: boolean;
}

interface DispatchProps {
  showAttachExistingProjectModal: (payload: ModalDataType) => void;
}

interface State {
  selectedId: number;
  projectList: ListType[];
}
type Props = StateProps & RouteComponentProps & DispatchProps;

class AttachExistingProjectModal extends React.Component<Props, State> {
  projectList: ListType[] = [];
  // [
  //   {
  //     id: 0,
  //     name: 'Project 1',
  //     icon: '',
  //     selected: false,
  //   },
  //   {
  //     id: 1,
  //     name: 'Project 2',
  //     icon: '',
  //     selected: true,
  //   },
  //   {
  //     id: 2,
  //     name: 'Project 3',
  //     icon: '',
  //     selected: false,
  //   },
  //   {
  //     id: 3,
  //     name: 'Project 4',
  //     icon: '',
  //     selected: false,
  //   },
  // ];

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedId: -1,
      projectList: this.projectList,
    };
  }

  componentDidMount() {
    // debugger;
    this.init();
  }

  init = async () => {
    const db = await Database.getInstance();
    const list = db.websyncList();
    this.projectList = list.map((each, i) => ({
      id: each.$loki,
      name: `${each.serverFields[0].value || ''}`,
      serviceProvider: each.serviceProvider,
      serverFields: each.serverFields || [],
      databaseFields: each.databaseFields || [],
      icon: '',
      selected: false,
    }));
    this.setState({ projectList: this.projectList });
  };

  togglePopup = () => {
    console.log('test');
  };

  // handleCheckboxClick = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   e.stopPropagation();
  // };

  onAttachProject = async () => {
    const {
      showAttachExistingProjectModal,
      modalData,
      currentProject: { subTitle },
      history,
    } = this.props;
    const { selectedId } = this.state;
    const db = await Database.getInstance();
    const syncObj = db.findWebSync({ $loki: selectedId });
    const project = db.getProjectByParam({ container_name: subTitle });
    if (project.webSync) {
      project.webSync = {
        ...project.webSync,
        syncId: selectedId,
        firstRunAfterAttach: true,
      };
    } else {
      project.webSync = {
        ...(project.webSync || {}),
        syncId: selectedId,
        sshKeyId: syncObj.sshKeyId,
        firstRunAfterAttach: true,
      };
    }
    db.updateProject(project);
    showAttachExistingProjectModal({
      ...modalData.attach_existing_project,
      show: !modalData.attach_existing_project.show,
    });
    history.push(routes.DASHBOARD + routes.REDIRECT);
  };

  onCancelModal = () => {
    const { showAttachExistingProjectModal, modalData } = this.props;
    showAttachExistingProjectModal({
      ...modalData.attach_existing_project,
      show: !modalData.attach_existing_project.show,
    });
  };

  handleCheckboxClick = (project: ListType) => {
    console.log(project.id);
    console.log('current clicked');
    this.setState({ selectedId: project.id });
  };

  render() {
    const { theme } = this.props;
    const { selectedId, projectList } = this.state;
    return (
      <Modal
        parentClass={Style.select_options_modal}
        customClass={Style.select_options_modal_container}
        // buttongGroupClass={Style.select_option_modal_btn_group}
        // ConfirmationText="Attach"
        // cancelText="Cancel"
        // onCancelClickListener={this.onCancelModal}
        // onYesClickListener={this.onAttachProject}
        // yesButtonVariant="contained"
      >
        <div className={Style.select_options_modal_content}>
          <div className={Style.select_options_modal_body_content}>
            <h2 className={Style.select_options_modal_title}>
              Attach from existing projects
            </h2>
            {projectList.map((project: ListType) => (
              <div
                key={`accordion_select_options_container_${project.id}`}
                className={Style.select_option_modal_accordion_container}
              >
                <CheckBox
                  customClass={Style.select_options_modal_checkbox}
                  radius="50%"
                  id={`checkbox_select_options_modal${project.id}`}
                  // name={`checkbox select options modal${project.id}`}
                  checked={selectedId === project.id}
                  icon={Tick}
                  onChangeListener={() => {
                    this.handleCheckboxClick(project);
                  }}
                />
                <Accordion
                  key={`accordion_select_options_${project.id}`}
                  title={project.name}
                  id={`accordion_select_options_${project.id}`}
                  variant={Accordion.getVariant.OUTLINED}
                  customClass={classNames(Style.select_option_accordion_list)}
                  CustomToggleIcon={classNames(
                    Style.select_option_accordion_toggle_icon
                  )}
                  toggleIcon={getIcon('DROPDOWN', theme.theme_mode)}
                >
                  <div
                    className={Style.select_option_accordion_list_description}
                  >
                    {/* <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(
                        Style.select_option_accordion_list_item
                      )}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={
                          Style.select_option_accordion_list_item_col
                        }
                      >
                        <strong> Project Name </strong>
                      </Col>
                      <Col
                        customClass={
                          Style.select_option_accordion_list_item_col
                        }
                      >
                        {project.name}
                      </Col>
                    </Grid> */}
                    <Grid
                      variant={Grid.getVariant.FLEX}
                      placement={Grid.Placement.MIDDLE}
                      customClass={classNames(
                        Style.select_option_accordion_list_item
                      )}
                    >
                      <Col
                        xs={3}
                        md={3}
                        lg={3}
                        customClass={
                          Style.select_option_accordion_list_item_col
                        }
                      >
                        <strong> Service Provider </strong>
                      </Col>
                      <Col
                        customClass={
                          Style.select_option_accordion_list_item_col
                        }
                      >
                        {project.serviceProvider}
                      </Col>
                    </Grid>

                    {project.serverFields.map((each) => (
                      <Grid
                        key={each.key}
                        variant={Grid.getVariant.FLEX}
                        placement={Grid.Placement.MIDDLE}
                        customClass={classNames(
                          Style.select_option_accordion_list_item
                        )}
                      >
                        <Col
                          xs={3}
                          md={3}
                          lg={3}
                          customClass={
                            Style.select_option_accordion_list_item_col
                          }
                        >
                          <strong> {each.label} </strong>
                        </Col>
                        <Col
                          customClass={
                            Style.select_option_accordion_list_item_col
                          }
                        >
                          {each.value}
                        </Col>
                      </Grid>
                    ))}
                    {project.databaseFields.map((each) => (
                      <Grid
                        key={each.key}
                        variant={Grid.getVariant.FLEX}
                        placement={Grid.Placement.MIDDLE}
                        customClass={classNames(
                          Style.select_option_accordion_list_item
                        )}
                      >
                        <Col
                          xs={3}
                          md={3}
                          lg={3}
                          customClass={
                            Style.select_option_accordion_list_item_col
                          }
                        >
                          <strong> {each.label} </strong>
                        </Col>
                        <Col
                          customClass={
                            Style.select_option_accordion_list_item_col
                          }
                        >
                          {each.value}
                        </Col>
                      </Grid>
                    ))}
                  </div>
                </Accordion>
              </div>
            ))}
          </div>
          <div className={Style.select_options_modal_footer}>
            <Button
              text="Cancel"
              size={Button.Size.MEDIUM}
              onClickListener={this.onCancelModal}
            />
            <Button
              text="Attach"
              variant={Button.getVariant.CONTAINED}
              size={Button.Size.MEDIUM}
              onClickListener={this.onAttachProject}
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

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ModalAction }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AttachExistingProjectModal)
);
