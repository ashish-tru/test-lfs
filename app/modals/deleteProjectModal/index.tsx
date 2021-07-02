import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';

import { IconBox, Modal } from '@stackabl/ui';
import electronlog from '@stackabl/core/shared/logger';
import removeproject, { runningSites } from '@stackabl/core/render/common';
import db from '@stackabl/core/render/Database';

import { InitialThemeState } from '../../reducers/theme';
import { InitialModalState } from '../../reducers/modal';
import { InitialProjectState, initialState } from '../../reducers/projects';
import ProjectActions from '../../actions/projects';
import ModalAction, { DeleteProjectType } from '../../actions/modal';
import { RootState } from '../../reducers/types';
import { getIcon } from '../../utils/themes/icons';
import { IList } from '../../utils/ListSchema';
import { contentAdaptar } from '../../utils/common';
import routes from '../../constants/routes.json';
import Style from './index.scss';

interface StateProps {
  projectsData: InitialProjectState;
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  currentProject: (payload: IList) => void;
  getAllProjects: (payload: IList[]) => void;
  showDeleteModal: (payload: DeleteProjectType) => void;
  filterProjects: (payload: IList) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

const log = electronlog.scope('DeleteProjectModal');
type State = {
  loader: boolean;
};
class DeleteProjectModal extends React.Component<Props, State> {
  db!: db;

  constructor(props: Props) {
    super(props);
    this.state = {
      loader: false,
    };
  }

  componentDidMount() {
    this.init();
  }

  init = async () => {
    this.db = await db.getInstance();
  };

  onCancelClickListener = () => {
    const { modalData, showDeleteModal } = this.props;
    if (!this.state.loader) {
      showDeleteModal({
        ...modalData.delete_data,
        show: !modalData.delete_data.show,
      });
    }
  };

  onYesClickListener = async () => {
    this.setState({ loader: true });
    const {
      history,
      modalData: modelState,
      modalData: {
        delete_data: { project },
      },
      currentProject,
      projectsData: { allProjects },
      getAllProjects,
      showDeleteModal,
    } = this.props;
    try {
      if (project.length) {
        const actions = project.map((each: IList) =>
          this.deleteprojectHandler(each)
        );
        const result = await Promise.allSettled(actions);
        log.info(result);
      }
      const runningSiteList = await runningSites();
      const userId = localStorage.getItem('UserId');
      const ilist = contentAdaptar(
        this.db.getAllProject(userId || '', true, 'update_date'),
        allProjects,
        initialState.currentProject,
        runningSiteList
      );
      getAllProjects(ilist);
      currentProject(initialState.currentProject);
      if (
        history.location.pathname ===
        routes.DASHBOARD + routes.PROJECT_SETTINGS
      ) {
        history.push(routes.DASHBOARD);
      }
      showDeleteModal({
        ...modelState.delete_data,
        show: !modelState.delete_data.show,
      });
    } catch (err) {
      history.push({
        pathname: `${routes.LANDING}${routes.ERROR}`,
        state: {
          error: err,
          origin: routes.PROJECT_SETTINGS,
          parent: routes.DASHBOARD + routes.ALL_PROJECTS,
        },
      });
    }
  };

  deleteprojectHandler = async (project: IList) => {
    log.info('deleteprojectHandler');
    /**
     * @todo pass Id as first argument
     */
    const { title, subTitle } = project;
    try {
      const allProject = await removeproject(subTitle, title);
      console.log(allProject, 'deletealllist');
      return true;
      // currentProject(initialState.currentProject);
    } catch (err) {
      throw err;
    }
  };

  render() {
    const {
      theme,
      modalData: {
        delete_data: { project },
      },
    } = this.props;
    const { loader } = this.state;
    return (
      <Modal
        id={1}
        radius="5px"
        ConfirmationText="Delete"
        cancelText="Cancel"
        onCancelClickListener={this.onCancelClickListener}
        onYesClickListener={this.onYesClickListener}
        parentClass={classNames(Style.delete_project_main_modal)}
        customClass={classNames(Style.delete_project_modal)}
        size={Modal.Size.SMALL}
        buttongGroupClass={Style.delete_project_modal_btn}
        // For enable loader uncomment code
        loader={loader ? getIcon('LOADER', theme.theme_mode) : ''}
        loaderTitle="Deleting..."
        header={
          <div className={classNames(Style.delete_project_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.delete_project_modal_icon)}
              icon={getIcon('ERROR_ICON', theme.theme_mode)}
            />
            <h1 className={Style.heading}>
              {project.length > 1
                ? 'Are you sure you want to delete the selected projects?'
                : 'Are you sure you want to delete this project?'}
            </h1>
            <p className={Style.sub_heading}>
              {project.length > 1
                ? 'This will delete all the selected projects permanently, you cannot undo this action.'
                : 'This will delete the project permanently, you cannot undo this action.'}
            </p>
          </div>
        }
      />
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    modalData: state.modal_attributes,
    projectsData: state.project_attributes,
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators({ ...ModalAction, ...ProjectActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToAction)(DeleteProjectModal)
);
