import React from 'react';

import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';

import { IconBox, Modal, CheckBox } from '@stackabl/ui';

import { InitialThemeState } from '../../reducers/theme';
import { InitialModalState } from '../../reducers/modal';
import ModalAction, { ModalDataType } from '../../actions/modal';
import { RootState } from '../../reducers/types';
import routes from '../../constants/routes.json';
import { getIcon } from '../../utils/themes/icons';
import Tick from '../../resources/Icons/Common/check.svg';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import db from '@stackabl/core/render/Database';

import Style from './index.scss';
import request from '@stackabl/core/render/api/index';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
}

interface DispatchProps {
  showLogOutModal: (payload: ModalDataType) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class LogOutModal extends React.PureComponent<Props> {
  db!: db;
  constructor(props: Props) {
    super(props);
    this.actionOnClick = this.actionOnClick.bind(this);
  }

  actionOnClick = async (parameter: string) => {
    const { showLogOutModal, modalData } = this.props;
    switch (parameter) {
      case 'No':
        showLogOutModal({
          ...modalData,
          show: !modalData.logOut_data.show,
          yes: false,
          no: true,
          dont_show_again: modalData.logOut_data.dont_show_again,
        });
        break;
      case 'Yes':
        showLogOutModal({
          ...modalData,
          show: !modalData.logOut_data.show,
          yes: true,
          no: false,
          dont_show_again: modalData.logOut_data.dont_show_again,
        });
        await request(EndPoint.LOGOUT, RegisterPackages.skip,['logout']);
        localStorage.removeItem('UserToken');
        localStorage.removeItem('UserEmail');
        localStorage.removeItem('UserId');
        localStorage.removeItem('UserName');
        localStorage.removeItem('gitUsers');
        // localStorage.clear();
        this.props.history.push(routes.LANDING + routes.LOGIN);
        break;
      case 'Warn Again':
        this.db = await db.getInstance();

        showLogOutModal({
          ...modalData.logOut_data,
          dont_show_again: !modalData.logOut_data.dont_show_again,
        });
        const appSettings = this.db.getAppSettings();
        /* whenever user check the box for dont warn me again on logut modal, user id for that user
         is added to database in signed_in_user_ids array . So when user again clicks on logout ,
         signed_in_user_ids array is checked .If it contains the userid then logout modal is not shown again
         */
        if(appSettings.signed_in_user_ids && !modalData.logOut_data.dont_show_again ){
          appSettings.signed_in_user_ids.push(localStorage.getItem('UserId')||'');
          this.db.updateAppSetting(appSettings);
        }
        else if(appSettings.signed_in_user_ids && modalData.logOut_data.dont_show_again ){
          const index = appSettings.signed_in_user_ids.indexOf(
            localStorage.getItem('UserId') || ''
          );
          appSettings.signed_in_user_ids.splice(index, 1);
          this.db.updateAppSetting(appSettings);
        }

        break;
      default:
        break;
    }
  };

  render() {
    const { theme, modalData } = this.props;

    return (
      <>
        <Modal
          id={1}
          // enable loader by adding props loader={iconpath} with icon path and loaderTitle={title}
          ConfirmationText="Yes"
          cancelText="Cancel"
          onYesClickListener={() => {
            this.actionOnClick('Yes');
          }}
          onCancelClickListener={() => {
            this.actionOnClick('No');
          }}
          parentClass={classNames(Style.logout_main_modal)}
          customClass={classNames(Style.logout_modal)}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.logout_modal_btn)}
          footer={
            <CheckBox
              rightLabel="Don’t show me again."
              id="check1"
              name="dontwarn"
              value="check"
              radius="3px"
              icon={Tick}
              checked={modalData.logOut_data.dont_show_again}
              onChangeListener={() => {
                this.actionOnClick('Warn Again');
              }}
              customClass={classNames(Style.logout_modal_checkbox)}
            />
          }
        >
          <div className={classNames(Style.logout_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.logout_modal_icon)}
              icon={getIcon('ACCOUNT_LOGOUT_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>
              Are you sure you want
              <br />
              to logout?
            </h1>
            <ul className={classNames(Style.logout_modal_list)}>
              <li>All sites will be shut down.</li>
              <li>GitHub will be signed out.</li>
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
  connect(mapStateToProps, mapDispatchToAction)(LogOutModal)
);
