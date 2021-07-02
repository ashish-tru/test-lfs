import * as React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Loader, IconBox } from '@stackabl/ui';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import Style from './index.scss';
import { getIcon } from '../../../utils/themes/icons';
import routes from '../../../constants/routes.json';

interface StateProps {
  theme: InitialThemeState;
}
type Props = StateProps & RouteComponentProps;
class Loading extends React.PureComponent<Props> {
  render() {
    const { theme, history } = this.props;

    return (
      <Loader>
        <div>
          <IconBox
            icon={getIcon('LOADER', theme.theme_mode)}
            tooltip={false}
            width="10%"
          />
          <div
            role="presentation"
            className={classNames(Style.emptylink)}
            onClick={() => {
              history.push(routes.DASHBOARD + routes.EMPTY_PROJECT);
            }}
          />
        </div>
      </Loader>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(Loading));
