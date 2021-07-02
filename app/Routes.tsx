import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import routes from './constants/routes.json';
import App from './containers/App';
import Landing from './pages/landing';
import Dashboard from './pages/dashboard';

export default function Routes() {
  return (
    <App>
      <Switch>
        <Route
          exact
          path={routes.ROOT}
          render={() => <Redirect to={routes.LANDING} />}
        />
        <Route path={routes.LANDING} component={Landing} />
        <Route path={routes.DASHBOARD} component={Dashboard} />
      </Switch>
    </App>
  );
}
