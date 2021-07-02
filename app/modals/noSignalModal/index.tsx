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

class NoSignalModal extends React.PureComponent<Props> {
  render() {
    const { theme } = this.props;

    return (
      <>
        <Modal
          id={1}
          ConfirmationText="Yes"
          cancelText="Cancel"
          // onCancelClickListener={() => {}}
          // onYesClickListener={() => {}}
          parentClass={classNames(Style.no_signal_main_modal)}
          customClass={classNames(Style.no_signal_modal)}
          yesButtonVariant={Button.getVariant.CONTAINED}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.no_signal_modal_btn)}
        >
          <div className={classNames(Style.no_signal_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.no_signal_modal_icon)}
              icon={getIcon('NO_SIGNAL_MODAL', theme.theme_mode)}
            />
            <h1 className={Style.heading}>Uh oh! No signal</h1>
            <p className={Style.no_signal_modal_content}>
              Check your connection and try again.
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

export default withRouter(connect(mapStateToProps)(NoSignalModal));
