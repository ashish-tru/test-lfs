import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { IconBox, Button } from '@stackabl/ui';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import Style from './index.scss';
import { getIcon } from '../../../utils/themes/icons';
import routes from '../../../constants/routes.json';

interface StateProps {
  theme: InitialThemeState;
}
type Props = StateProps & RouteComponentProps;

class Restart extends React.PureComponent<Props> {
  getKeyByValue = (
    object: { [label: string]: string },
    value: string
  ): string => {
    return (
      Object.keys(object).find((key) => object[key] === value) ||
      'THEME_COLOR_0'
    );
  };

  render() {
    const { theme } = this.props;
    return (
      <div className={classNames(Style.restart_landing)}>
        <div
          className={classNames(Style.restart_col_left)}
          style={{
            background: `url(${getIcon('LOGIN_BG', theme.theme_mode)})`,
          }}
        >
          <div className={classNames(Style.restart_inner_wrapper)}>
            <IconBox
              icon={getIcon('LOGO_LARGE', theme.theme_mode)}
              customClass={classNames(Style.restart_icon)}
              name="logo"
              tooltip={false}
            />
            <h1 className={classNames(Style.restart_heading)}>
              Get more done with the
              <br />
              new Stackabl
            </h1>
            <p className={classNames(Style.restart_subheading)}>
              Now more simple, secure, and faster than ever.
            </p>
          </div>
        </div>
        <div className={classNames(Style.restart_col_right)}>
          <div className={classNames(Style.restart_inner_wrapper)}>
            <div className={classNames(Style.restart_message_block)}>
              <h4 className={classNames(Style.restart_message_title)}>
                We are almost done!
              </h4>
              <p className={classNames(Style.restart_message_text)}>
                This computer doesn’t have VT-X?AMD-v enabled. Enabling it in
                the BIOS is mandatory. Please enter system BIOS and enable
                Virtualization Technology
              </p>
              <Button
                text="Restart"
                variant={Button.getVariant.CONTAINED}
                customClass={classNames(Style.restart_restartbtn)}
                onClickListener={() => {
                  // history.push(routes.LANDING + routes.UPDATE);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(Restart));
