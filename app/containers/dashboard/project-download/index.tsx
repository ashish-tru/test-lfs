import React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { IconBox } from '@stackabl/ui';
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

class Download extends React.PureComponent<Props> {
  render() {
    const { theme, history } = this.props;
    return (
      <div className={classNames(Style.project_download_dashboard)}>
        <div
          className={classNames(Style.project_download_container)}
          style={{
            background: `url(${getIcon(
              'ERROR_BACKGROUND_LEFT',
              theme.theme_mode
            )}) left center/33%  no-repeat  , url(${getIcon(
              'ERROR_BACKGROUND_RIGHT',
              theme.theme_mode
            )}) right center/33% no-repeat `,
          }}
        >
          <IconBox
            icon={getIcon('PROJECT_DOWNLOAD', theme.theme_mode)}
            customClass={classNames(Style.project_download_logo)}
            name="logo"
            tooltip={false}
            onClickListener={() => {
              history.push(routes.DASHBOARD + routes.PROJECT_SETTINGS);
            }}
          />

          <div className={classNames(Style.project_download_container_content)}>
            <hr
              className={classNames(
                Style.project_download_container_divider_top
              )}
            />
            <h1 className={classNames(Style.project_download_container_title)}>
              Project name
            </h1>
            <p className={classNames(Style.project_download_sub_headings)}>
              Download in progress...
            </p>
            <p className={classNames(Style.project_download_sub_headings)}>
              (Click on the icon for the nxt screen)
            </p>

            <hr
              className={classNames(
                Style.project_download_container_divider_bottom
              )}
            />
          </div>
        </div>
      </div>
    );
  }
}
//
const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(Download));
