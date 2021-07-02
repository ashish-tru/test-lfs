import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { RootState } from '../../../reducers/types';
import { IList } from '../../../utils/ListSchema';
import db from '@stackabl/core/render/Database';
import routes from '../../../constants/routes.json';

interface StateProps {
  currentProject: IList;
}

type Props = StateProps & RouteComponentProps;

class Redirect extends Component<Props> {
  componentDidMount() {
    setTimeout(async () => {
      const metaDb = await db.getInstance();
      const { title, subTitle } = this.props.currentProject;
      const projectDetail = metaDb.getProjectByParam({
        name: title,
        container_name: subTitle,
      });
      this.props.history.push({
        pathname: routes.DASHBOARD + routes.PROJECT_SETTINGS,
        state: { ...projectDetail },
      });
      this.props.currentProject;
    }, 2000);
  }

  render() {
    console.log(this.props);
    return <></>;
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    currentProject: state.project_attributes.currentProject,
  };
};
export default withRouter(connect(mapStateToProps, null)(Redirect));
