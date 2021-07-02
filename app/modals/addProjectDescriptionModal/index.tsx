import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import db from '@stackabl/core/render/Database';
// import { bindActionCreators, Dispatch } from 'redux';
import { Modal, TextArea } from '@stackabl/ui';
import ModalActions, { EditProjectDataType } from '../../actions/modal';
import routes from '../../constants/routes.json';
import { InitialModalState } from '../../reducers/modal';
import projectActions from '../../actions/projects';
import { InitialThemeState } from '../../reducers/theme';
import { RootState } from '../../reducers/types';

import Style from './index.scss';
import { IList } from '../../utils/ListSchema';
import { routerActions } from 'connected-react-router';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface State {
  value: string;
}

interface DispatchProps {
  addDescriptionModal: (payload: EditProjectDataType) => void;
  updateProject: (payload: IList) => void;
  currentProject: (payload: IList) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class AddDescriptionModal extends React.Component<Props, State> {
  db!: db;
  constructor(props: Props) {
    super(props);
    this.onButtonClickListener = this.onButtonClickListener.bind(this);
    this.state = {
      value: '',
    };
  }
  componentDidMount() {
    this.init();
  }
  init = async () => {
    this.db = await db.getInstance();
    const {
      modalData: {
        add_description: {
          project: { descritption },
        },
      },
    } = this.props;
    this.setState({ value: descritption });
  };

  updateDescription = (project: IList) => {
    const { value } = this.state;
    const {
      updateProject,
      currentProject,
      location: { pathname },
    } = this.props;
    const projectDetail = this.db.getProjectByParam({
      name: project.title,
      container_name: project.subTitle,
    });
    this.db.updateProject({
      ...projectDetail,
      meta: [...projectDetail.meta],
      description: value,
    });
    updateProject({ ...project, descritption: value });
    if (pathname === routes.DASHBOARD + routes.PROJECT_SETTINGS) {
      currentProject({ ...project, descritption: value });
    }
  };

  onButtonClickListener = (which: string) => {
    const {
      modalData: models,
      modalData: {
        add_description: { project },
      },
      addDescriptionModal,
    } = this.props;

    switch (which) {
      case 'Yes':
        this.updateDescription(project);

        break;
      case 'No':
        break;

      default:
        break;
    }
    addDescriptionModal({
      show: false,
      project: models.add_description.project,
    });
  };

  onChangeListener = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    this.setState({
      value: e.target.value,
    });
  };

  render() {
    const { value } = this.state;
    return (
      <Modal
        id={1}
        radius="5px"
        ConfirmationText="Save"
        cancelVariant="text"
        cancelText="Cancel"
        onCancelClickListener={() => {
          this.onButtonClickListener('No');
        }}
        onYesClickListener={() => {
          this.onButtonClickListener('Yes');
        }}
        customClass={classNames(Style.add_project_description_modal)}
        size={Modal.Size.XTRA_LARGE}
        yesButtonVariant="contained"
        customFooterClass={Style.add_project_description_modal_footer}
        buttongGroupClass={Style.add_project_description_modal_btn}
        header={<h2 className={classNames(Style.heading)}>Add Description</h2>}
      >
        <TextArea
          placeholder="A few words for your project."
          value={value}
          onChangeListener={this.onChangeListener}
          maxLength={200}
        />
      </Modal>
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
  return bindActionCreators({ ...ModalActions, ...projectActions }, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AddDescriptionModal)
);
