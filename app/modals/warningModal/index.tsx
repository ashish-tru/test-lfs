import React from 'react';

import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { IconBox, Modal, Button } from '@stackabl/ui';
// import { bindActionCreators, Dispatch } from 'redux';
import { InitialThemeState } from '../../reducers/theme';
import { RootState } from '../../reducers/types';
import { getIcon } from '../../utils/themes/icons';

import Style from './index.scss';

interface StateProps {
  theme: InitialThemeState;
}

type Props = StateProps & RouteComponentProps;

class WarningModal extends React.PureComponent<Props> {
  render() {
    const { theme } = this.props;

    return (
      <>
        <Modal
          id={1}
          ConfirmationText="Try again"
          cancelText=" Dismiss"
          // onCancelClickListener={() => {}}
          // onYesClickListener={() => {}}
          parentClass={classNames(Style.warning_main_modal)}
          customClass={classNames(Style.warning_modal)}
          yesButtonVariant={Button.getVariant.CONTAINED}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.warning_modal_btn)}
        >
          <div className={classNames(Style.warning_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.warning_modal_icon)}
              icon={getIcon('WARNING_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>Uh oh! Something went wrong</h1>
            <p className={Style.warning_modal_content}>
              Please try again or
              <span className={classNames(Style.warning_modal_link)}>
                contact us
              </span>
            </p>
          </div>
        </Modal>
      </>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps)(WarningModal));
