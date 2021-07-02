import React from 'react';

import { bindActionCreators, Dispatch } from 'redux';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { InitialModalState } from '../../reducers/modal';
import ModalAction, { UpdateStackablType } from '../../actions/modal';
import { Button, IconBox, Modal, ProgressBar } from '@stackabl/ui';
import { InitialThemeState } from '../../reducers/theme';
import { RootState } from '../../reducers/types';
import { getIcon } from '../../utils/themes/icons';

import Style from './index.scss';

import { THEME_COLOR } from '../../constants/index';

const variables = require('../../global.scss');

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  showUpdateModal: (payload: UpdateStackablType) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class UpdateProjectModal extends React.PureComponent<Props> {
  getKeyByValue = (
    object: { [label: string]: string },
    value: string
  ): string => {
    return (
      Object.keys(object).find((key) => object[key] === value) ||
      'THEME_COLOR_0'
    );
  };

  OnCancelClickListener = () => {
    const {
      showUpdateModal,
      modalData,
      modalData: { update_data },
    } = this.props;
    showUpdateModal({
      ...modalData.update_data,
      show: !update_data.show,
      cancel: true,
      percentage: 0,
      text: '',
    });
  };

  render() {
    const { theme, modalData } = this.props;

    return (
      <>
        {/* <Modal
          id={1}
          ConfirmationText="Update"
          cancelText="Not right now"
          // onCancelClickListener={() => {}}
          // onYesClickListener={() => {}}
          parentClass={classNames(
            Style.update_project_main_modal,
            Style.update_project_new_version_main_modal
          )}
          customClass={classNames(Style.update_project_modal)}
          yesButtonVariant={Button.getVariant.CONTAINED}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.update_project_modal_btn)}
        >
          <div className={classNames(Style.update_project_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.update_project_modal_icon)}
              icon={getIcon('UPDATE_PROJECT_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>
              A new version of
              <br />
              Stackabl is available!
            </h1>
            <p className={Style.update_project_modal_content}>
              The version of stackabl installed is outdated. Please update to
              the new version
            </p>
          </div>
        </Modal> */}

        <Modal
          id={2}
          parentClass={classNames(
            Style.update_project_main_modal,
            Style.upate_download_main_modal
          )}
          cancelText="Cancel"
          onCancelClickListener={this.OnCancelClickListener}
          customClass={classNames(Style.update_project_modal)}
          cancelVariant={Button.getVariant.TEXT}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.update_project_modal_btn)}
        >
          <div className={classNames(Style.update_project_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.update_project_modal_icon)}
              icon={getIcon('UPDATE_DOWNLAOD_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>Downloading update...</h1>
            <ProgressBar
              customClass={classNames(Style.update_download_modal_progress_bar)}
              innerClass={classNames(Style.update_download_progress_bar)}
              showSteps={false}
              segments={[
                [
                  modalData.update_data.percentage,
                  `${modalData.update_data.text}`,
                ],
              ]}
              secondaryColor={`${
                variables[this.getKeyByValue(THEME_COLOR, theme.theme_color)]
              }`}
              primaryColor={theme.theme_mode === 'dark' ? `#373737` : `#cecece`}
              children={
                <div className={Style.text}>{modalData.update_data.text}</div>
              }
            />
          </div>
        </Modal>
        {/* <Modal
          id={3}
          parentClass={classNames(
            Style.update_project_main_modal,
            Style.update_project_success_modal_main
          )}
          customClass={classNames(Style.update_project_modal)}
          size={Modal.Size.SMALL}
          ConfirmationText="Launch"
          yesButtonVariant={Button.getVariant.CONTAINED}
          buttongGroupClass={classNames(Style.update_project_modal_btn)}
        >
          <div className={classNames(Style.update_project_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.update_project_modal_icon)}
              icon={getIcon('UPDATE_SUCCESS_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>
              Update completed
              <br />
              successfully!
            </h1>
          </div>
        </Modal> */}
        {/* <Modal
          id={4}
          parentClass={classNames(
            Style.update_project_main_modal,
            Style.update_project_unable_modal_main
          )}
          customClass={classNames(Style.update_project_modal)}
          size={Modal.Size.SMALL}
          ConfirmationText="Skip"
          buttongGroupClass={classNames(Style.update_project_modal_btn)}
        >
          <div className={classNames(Style.update_project_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.update_project_modal_icon)}
              icon={getIcon('UPDATE_UNABLE_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>Uh oh! Update failed to install</h1>
            <p className={Style.update_project_modal_content}>
              Please try again.
            </p>
          </div>
        </Modal> */}
      </>
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
  connect(mapStateToProps, mapDispatchToAction)(UpdateProjectModal)
);
