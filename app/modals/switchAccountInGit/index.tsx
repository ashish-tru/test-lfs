import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { IconBox, Modal } from '@stackabl/ui';
import { Dispatcher } from '@stackabl/git';
import { InitialThemeState } from '../../reducers/theme';
import { InitialModalState } from '../../reducers/modal';
import ModalAction, { GithubAccount } from '../../actions/modal';
import { RootState } from '../../reducers/types';
// import routes from '../../constants/routes.json';
import { getIcon } from '../../utils/themes/icons';
// import EndPoint from '@stackabl/core/shared/api/endpoint';
// import RegisterPackages from '@stackabl/core/shared/api/register-packges';
// import db from '@stackabl/core/render/Database';
import Style from './index.scss';

// import request from '@stackabl/core/render/api/index';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  showGitSwitchModal: (payload: GithubAccount) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class SwitchAccountInGitModal extends React.PureComponent<Props> {
  private readonly dispatcher: Dispatcher;

  constructor(props: Props) {
    super(props);
    this.dispatcher = new Dispatcher();
    // this.state = {
    //   isGitLogin: false,
    //   isLoginOnceClicked: false,
    // };
  }

  actionOnClick = async (parameter: string) => {
    const {
      modalData,
      showGitSwitchModal,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      modalData: { gitSwitchModal },
    } = this.props;
    switch (parameter) {
      case 'No':
        showGitSwitchModal({
          ...modalData.gitSwitchModal,
          show: !gitSwitchModal.show,
          yes: false,
          no: true,
        });
        break;
      case 'Yes': {
        showGitSwitchModal({
          ...modalData.gitSwitchModal,
          show: false,
          yes: true,
        });
        break;
      }
      default:
        break;
    }
  };

  render() {
    const { theme } = this.props;

    return (
      <>
        <Modal
          id={1}
          // enable loader by adding props loader={iconpath} with icon path and loaderTitle={title}
          ConfirmationText="Switch Account"
          cancelText="Cancel"
          onYesClickListener={() => {
            this.actionOnClick('Yes');
          }}
          onCancelClickListener={() => {
            this.actionOnClick('No');
          }}
          parentClass={classNames(Style.switch_account_in_git_main_modal)}
          customClass={classNames(Style.switch_account_in_git_modal)}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.switch_account_in_git_modal_btn)}
        >
          <div className={classNames(Style.switch_account_in_git_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.switch_account_in_git_modal_icon)}
              icon={getIcon('SWITCH_ACCOUNT_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>
              Are you sure you want to
              <br />
              switch accounts?
            </h1>
            <ul className={classNames(Style.switch_account_in_git_modal_list)}>
              <li>This will logout your GitHub Account.</li>
              <li>
                To switch accounts, you should be logged in to the browser with
                the account you want to switch to.
              </li>
            </ul>
          </div>
        </Modal>
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
  connect(mapStateToProps, mapDispatchToAction)(SwitchAccountInGitModal)
);
