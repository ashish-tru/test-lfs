import React from 'react';

import log from 'electron-log';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import classNames from 'classnames';
import { ToastNotification, Notification } from '@stackabl/ui';
import { InitialThemeState } from '../reducers/theme';
import { InitialToastState } from '../reducers/toast';
import { InitialNotificationState } from '../reducers/notification';
import { RootState } from '../reducers/types';
import ToastActions from '../actions/toast';
import NotificationActions from '../actions/notification';
import ModalView from '../modals';
import { getIcon } from '../utils/themes/icons';

import Success from '../resources/Icons/Common/success.svg';
// import Error from '../resources/Icons/Common/error.svg';
// import Warning from '../resources/Icons/Common/warning.svg';

const Style = require('../global.scss');

interface PropsFromParent {
  children: React.ReactNode;
}

interface DispatchProps {
  removeToast: (payload: string) => void;
  removeNotification: (payload: string) => void;
}

interface StateProps {
  theme: InitialThemeState;
  toast: InitialToastState;
  notification: InitialNotificationState;
}

type Props = PropsFromParent & StateProps & RouteComponentProps & DispatchProps;

class App extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);
    this.changeThemeOnPropChange = this.changeThemeOnPropChange.bind(this);
  }

  componentDidMount() {
    this.changeThemeOnPropChange();
  }

  componentDidUpdate(prevProps: Props) {
    const { theme } = this.props;
    if (
      prevProps.theme.theme_mode !== theme.theme_mode ||
      prevProps.theme.theme_color !== theme.theme_color
    ) {
      this.changeThemeOnPropChange();
    }
  }

  changeThemeOnPropChange = () => {
    const { theme } = this.props;
    if (theme) {
      log.info(
        '[App.tsx] Change in theme mode and color: ',
        theme.theme_mode.concat('-'.concat(theme.theme_color))
      );

      document
        .getElementsByTagName('body')[0]
        .setAttribute('data-theme', theme.theme_mode);
      document
        .getElementsByTagName('body')[0]
        .setAttribute('theme-color', theme.theme_color);

      localStorage.setItem('theme-mode', theme.theme_mode);
      localStorage.setItem('theme-color', theme.theme_color);
    }
  };

  render() {
    const {
      children,
      toast,
      removeToast,
      theme,
      notification,
      removeNotification,
    } = this.props;
    return (
      <>
        <div className={classNames(Style.draggable_bar)} />
        <ModalView />
        {toast.show && toast.id !== '' ? (
          <ToastNotification
            autoRemove
            title={toast.message}
            onAutoRemoveListener={() => removeToast(toast.id)}
          />
        ) : (
          ''
        )}

        {notification.show && notification.id !== '' ? (
          <Notification
            id={notification.id}
            // type={notification.type}
            title={notification.title}
            type={Notification.Type}
            icon={Success}
            autoRemove={notification.autoRemove}
            closeIcon={getIcon('CLOSE_NOTIFICATION', theme.theme_mode)}
            message={notification.message}
            onCloseClickListner={() => {
              removeNotification(notification.id);
            }}
            // autoRemove
            onAutoRemoveListener={() => removeToast(notification.id)}
            overlay={false}
          />
        ) : (
          ''
        )}

        {/* {notification.show && notification.id !== '' ? (
          <BottomNotification
            floating
            autoRemove
            id={notification.id}
            customClass={Style.project_setting_bottom_notification}
            onAutoRemoveListener={() => removeNotification(notification.id)}
            // eslint-disable-next-line no-underscore-dangle
            bottom={BottomNotification.bottom._15}
          >
            <div
              className={classNames(
                Style.project_setting_bottom_notification_content
              )}
            >
              <IconBox
                tooltip={false}
                icon={getIcon('INFORMATION', theme.theme_mode)}
              />
              <div
                className={classNames(
                  Style.project_setting_bottom_notification_title
                )}
              >
                {notification.message}
              </div>
            </div>
          </BottomNotification>
        ) : (
          ''
        )} */}

        {children}
      </>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    toast: state.toast_attributes,
    notification: state.notification_attributes,
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(
    { ...ToastActions, ...NotificationActions },
    dispatch
  );
};

export default withRouter(connect(mapStateToProps, mapDispatchToAction)(App));
