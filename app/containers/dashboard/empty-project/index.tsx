import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, IconBox } from '@stackabl/ui';
import Analytics, {
  EVENT,
  LABEL,
  ACTION,
} from '@stackabl/core/render/analytics';

import Style from './index.scss';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import routes from '../../../constants/routes.json';

import add from '../../../resources/Icons/Common/add.svg';
import { getIcon } from '../../../utils/themes/icons';

interface StateProps {
  theme: InitialThemeState;
}
type Props = StateProps & RouteComponentProps;
class EmptyProject extends React.PureComponent<Props> {
  componentDidMount() {
    Analytics.getInstance().screenView('Empty Project');
  }

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
    const { history, theme } = this.props;
    return (
      <div className={classNames(Style.empty_project_dashboard)}>
        <div className={classNames(Style.empty_project_wraper)}>
          <IconBox
            icon={getIcon('EMPTY_PROJECT', theme.theme_mode)}
            name="Folder Icon"
            tooltip={false}
            customClass={classNames(Style.empty_project_icon)}
          />
          <h1 className={classNames(Style.empty_project_heading)}>
            Let’s setup your very first website!
          </h1>
          <p className={classNames(Style.empty_project_sub_heading)}>
            Click on the icon below to get started.
          </p>
          <Button
            text="Create New Project"
            icon={add}
            variant={Button.getVariant.CONTAINED}
            alignIcon={Button.getPosition.LEFT}
            customClass={classNames(Style.empty_project_create_project_btn)}
            onClickListener={() => {
              Analytics.getInstance().eventTracking(
                EVENT.Dashboard,
                ACTION.Create,
                LABEL.Screen
              );
              history.push(routes.DASHBOARD + routes.CREATE_NEW_PROJECT);
            }}
          />
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

export default withRouter(connect(mapStateToProps, null)(EmptyProject));
