import React from 'react';

import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { InitialModalState } from '../reducers/modal';
import { RootState } from '../reducers/types';

import LogoutModal from './logoutModal';
import AddPRojectDescriptionModal from './addProjectDescriptionModal';
import SearchAndReplaceModal from './searchAndReplace';
import DeleteProjectModal from './deleteProjectModal';
import QuitModal from './quitModal';
import UpdateProjectModal from './updateProjectModal';
import NoSignalModal from './noSignalModal';
import WarningModal from './warningModal';
import ReleaseUpdate from './releaseUpdateModal';
import SwitchAccountInGitModal from './switchAccountInGit';
import ImportDatabaseModal from './importDatabaseModal';
import WebsiteCloneStepsModal from './websiteCloneStepsModal';
import CreateSshKeyModal from './addSSHKeyModal';
import AttachExistingProjectModal from './attachExistingProjectModal';
import ShhKeyDetailModal from './sshKeyDetailModal';

interface StateProps {
  modalData?: InitialModalState;
}

type Props = StateProps & RouteComponentProps;

// add funcitons in a  common file for modals, import it in the respctive file and call them in respective functions.

class ModalView extends React.PureComponent<Props> {
  render() {
    const { modalData } = this.props;
    return (
      <>
        {modalData?.logOut_data.show && <LogoutModal />}
        {modalData?.add_description.show && <AddPRojectDescriptionModal />}
        {modalData?.search_and_replace.show && <SearchAndReplaceModal />}
        {modalData?.no_signal_data.show && <NoSignalModal />}
        {modalData?.error_data.show && <WarningModal />}
        {modalData?.delete_data.show && <DeleteProjectModal />}
        {modalData?.update_data.show && <UpdateProjectModal />}
        {modalData?.release_update.show && <ReleaseUpdate />}
        {modalData?.import_database.show && <ImportDatabaseModal />}
        {modalData?.gitSwitchModal.show && <SwitchAccountInGitModal />}
        {modalData?.quit_data.show && <QuitModal />}
        {/* {modalData?.quit_data.show && <syncErrorModal />} */}
        {/* <SwitchAccountInGitModal/> */}
        {/* <SyncErrorModal /> */}
        {/* <SyncSuccessModal /> */}
        {modalData?.website_clone_data.show && <WebsiteCloneStepsModal />}
        {modalData?.ssh_key_data.show && <CreateSshKeyModal />}
        {modalData?.attach_existing_project.show && (
          <AttachExistingProjectModal />
        )}
        {modalData?.ssh_key_detail_data.show && <ShhKeyDetailModal />}
      </>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    modalData: state.modal_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(ModalView));
