import * as React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { Modal } from '@stackabl/ui';
import { RefObject } from 'react';
import Database from '@stackabl/core/render/Database';
import { RootState } from '../../reducers/types';
import { InitialModalState } from '../../reducers/modal';
import { InitialThemeState } from '../../reducers/theme';
import ModalAction, { WebsiteCloneDataType } from '../../actions/modal';
import routes from '../../constants/routes.json';

import Style from './index.scss';

import CloneFromWebsite from '../../containers/container-components/create-new-project-forms/clone-from-website';

import { getIcon } from '../../utils/themes/icons';
import { AllProjectState } from '../../utils/common';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  showWebsiteCloneModal: (payload: WebsiteCloneDataType) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class WebsiteCloneStepsModal extends React.Component<Props> {
  currentStep: RefObject<HTMLParagraphElement> = React.createRef();

  /**
   *@description method to open WebsiteCloneStepsModal
   */
  hideWebsiteCloneStepsModal = () => {
    const { showWebsiteCloneModal, modalData } = this.props;

    showWebsiteCloneModal({ ...modalData.website_clone_data, show: false });
  };

  submitWebsiteCloneStepsModal = async ({
    websiteClone,
    projectName,
    projectId,
  }: AllProjectState) => {
    const db = await Database.getInstance();

    const syncObj = db.addWebSync(websiteClone.syncObj);
    // console.log(data);
    const project = db.getProjectByParam({ container_name: projectId });
    if (project) {
      if (project.webSync) {
        project.webSync = { ...project.webSync, syncId: syncObj.$loki };
      } else {
        project.webSync = { syncId: syncObj.$loki, sshKeyId: syncObj.sshKeyId };
      }
    }
    const { showWebsiteCloneModal, modalData, history } = this.props;
    db.updateProject({ ...project });

    showWebsiteCloneModal({ ...modalData.website_clone_data, show: false });
    history.push(routes.DASHBOARD + routes.REDIRECT);
  };

  render() {
    const { theme } = this.props;
    if (this.currentStep.current) {
      this.currentStep.current.innerText = `Step 1  of 4`;
    }
    return (
      <Modal
        header={
          <div
            role="presentation"
            className={classNames(Style.create_new_project_close_icon)}
            onClick={this.hideWebsiteCloneStepsModal}
          >
            <img alt="close" src={getIcon('CLOSE', theme.theme_mode)} />
          </div>
        }
        parentClass={Style.create_new_project_modal}
        customClass={Style.create_new_project_modal_container}
      >
        <div className={Style.create_new_project_dashboard}>
          <div
            id="create_new_project_id"
            className={classNames(Style.create_new_project_outer)}
          >
            <div
              className={classNames(Style.create_new_project_inner_container)}
            >
              <h1 className={classNames(Style.create_new_project_heading)}>
                Create New Project
              </h1>
              <div
                ref={this.currentStep}
                className={classNames(Style.create_new_project_steps)}
              >
                Step 1 of 4
              </div>
              <div className={classNames(Style.create_new_project_container)}>
                <CloneFromWebsite
                  startAt={1}
                  endAt={4}
                  option={3}
                  theme={theme}
                  changeVal={(val) => {
                    if (this.currentStep.current) {
                      this.currentStep.current.innerText = `Step ${val}  of 4`;
                    }
                  }}
                  websiteCloningEnded={() => {
                    this.hideWebsiteCloneStepsModal();
                  }}
                  changeOption={() => {}}
                  submit={(data: AllProjectState) => {
                    this.submitWebsiteCloneStepsModal(data);
                  }}
                />
              </div>
            </div>
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
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(ModalAction, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToAction)(WebsiteCloneStepsModal)
);
