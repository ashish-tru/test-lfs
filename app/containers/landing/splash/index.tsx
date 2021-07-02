/* eslint-disable react/destructuring-assignment */
import React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { Footer, IconBox } from '@stackabl/ui';
import { connect } from 'react-redux';
import Style from './index.scss';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import routes from '../../../constants/routes.json';
import { getIcon } from '../../../utils/themes/icons';

interface StateProps {
  theme: InitialThemeState;
}

type Props = StateProps & RouteComponentProps;

class Splash extends React.PureComponent<Props> {
  componentDidMount() {
    setTimeout(() => {
      this.props.history.push(routes.LANDING + routes.LOGIN);
    }, 1000);
  }

  render() {
    const { theme, } = this.props;
    return (
      <div className={classNames(Style.splash_landing)}>
        <div
          className={classNames(Style.splash_container)}
          style={{
            background: `url(${getIcon(
              'SPLASH_BG_LEFT',
              theme.theme_mode
            )}) left center/40%  no-repeat, url(${getIcon(
              'SPLASH_BG_RIGHT',
              theme.theme_mode
            )}) right center/40% no-repeat`,
          }}
        >
          <IconBox
            icon={getIcon('LOGO', theme.theme_mode)}
            customClass={classNames(Style.splash_logo)}
            name="logo"
            tooltip={false}
          />
        </div>
        <Footer>
          <div>
            <span>&copy; </span>
            <strong>Stackabl. </strong>
            All Rights Reserved.
          </div>
        </Footer>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(Splash));
