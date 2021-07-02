/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import * as React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Grid, Col, Card, IconBox, Button } from '@stackabl/ui';
import Analytics, {
  EVENT,
  ACTION,
  LABEL,
} from '@stackabl/core/render/analytics';

import { shell } from 'electron';
import { RootState } from '../../../reducers/types';
import Style from './index.scss';
import { InitialThemeState } from '../../../reducers/theme';
import { getIcon } from '../../../utils/themes/icons';
import constant from '../../../constants';
// import routes from '../../../constants/routes.json';

enum Link {
  TWITTER = 'Twitter',
  LINKEDIN = 'Linkedin',
  YOUTUBE = 'Youtube',
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
  DOCUMENTATION = 'Documentation',
  FAQ = 'Faq',
  CONTACT_US = 'Contactus',
  REQUESTFEATURE = 'RequestFeature',
}
interface StateProps {
  theme: InitialThemeState;
}
type Props = StateProps & RouteComponentProps;
class HelpCenter extends React.PureComponent<Props> {
  componentDidMount() {
    Analytics.getInstance().screenView('Help Center');
  }

  OpenUrl = (url: Link) => {
    Analytics.getInstance().eventTracking(EVENT.Help, url, LABEL.Link);
    shell.openExternal(this.getUrl(url));
  };

  getUrl = (linkof: Link): string => {
    switch (linkof) {
      case Link.TWITTER:
        return constant.TWITTER_URL;
      case Link.FACEBOOK:
        return constant.FACEBOOK_URL;
      case Link.DOCUMENTATION:
        return constant.STACKABL_DOCUMENTATION;
      case Link.CONTACT_US:
        return constant.CONTACT_US;
      case Link.FAQ:
        return constant.FAQ;
      case Link.REQUESTFEATURE:
        return constant.REQUEST_FEATURE;
      case Link.LINKEDIN:
        return constant.LINKEDIN_URL;
      case Link.YOUTUBE:
        return constant.YOUTUBE_URL;
      case Link.INSTAGRAM:
        return constant.INSTAGRAM_URL;
      default:
        return '';
    }
  };

  render() {
    const { theme } = this.props;
    return (
      <div className={classNames(Style.help_center_dashboard)}>
        <h1 className={classNames(Style.help_center_heading)}>Help Center</h1>
        <h3 className={classNames(Style.help_center_subtitle)}>
          Choose the category to find the help you need.
        </h3>
        <Grid
          customClass={classNames(Style.help_center_grid)}
          variant={Grid.getVariant.FLEX}
        >
          <Col xs={3} sm={3} lg={3}>
            <Card customClass={classNames(Style.help_center_card)}>
              <IconBox
                customClass={classNames(Style.help_center_icon)}
                icon={getIcon('DOCUMENTATION', theme.theme_mode)}
                tooltip={false}
              />
              <h2>Documentation</h2>
              <p>
                Find answers quickly from our comprehensive documentation
                covering account questions, features, functions, and more.
              </p>

              <Button
                text="Learn More"
                onClickListener={() => this.OpenUrl(Link.DOCUMENTATION)}
              />
            </Card>
          </Col>
          <Col xs={3} sm={3} lg={3}>
            <Card customClass={classNames(Style.help_center_card)}>
              <IconBox
                customClass={classNames(Style.help_center_icon)}
                icon={getIcon('CONTACT', theme.theme_mode)}
                tooltip={false}
              />
              <h2>Contact Us</h2>
              <p>
                Submit a support ticket for answers on technical issues, bugs,
                or any other questions you may have.
              </p>
              <Button
                text="Learn More"
                onClickListener={() => this.OpenUrl(Link.CONTACT_US)}
              />
            </Card>
          </Col>
          <Col xs={3} sm={3} lg={3}>
            <Card customClass={classNames(Style.help_center_card)}>
              <IconBox
                customClass={classNames(Style.help_center_icon)}
                icon={getIcon('FEATURE', theme.theme_mode)}
                tooltip={false}
              />
              <h2>Request a Feature</h2>
              <p>
                From integrations, enhancements, to new functionality - tell us
                what you want and will add it to our roadmap.
              </p>
              <Button
                text="Learn More"
                onClickListener={() => this.OpenUrl(Link.REQUESTFEATURE)}
              />
            </Card>
          </Col>
          <Col xs={3} sm={3} lg={3}>
            <Card customClass={classNames(Style.help_center_card)}>
              <IconBox
                customClass={classNames(Style.help_center_icon)}
                icon={getIcon('FAQ', theme.theme_mode)}
                tooltip={false}
              />
              <h2>FAQ</h2>
              <p>
                Can&apos;t find the answer you&apos;re looking for? We&apos;ve
                shared some of our most frequently asked questions to help you
                out!
              </p>
              <Button
                text="Learn More"
                onClickListener={() => this.OpenUrl(Link.FAQ)}
              />
            </Card>
          </Col>
        </Grid>
        <div className={classNames(Style.help_center_divider)}>Follow Us</div>
        <div className={classNames(Style.help_center_social_link)}>
          <div
            onClick={() => {
              this.OpenUrl(Link.FACEBOOK);
            }}
            className={classNames(Style.help_center_social_grid)}
          >
            <IconBox
              width="14px"
              icon={getIcon('FACEBOOK', theme.theme_mode)}
              tooltip={false}
            />
            <span>Facebook</span>
          </div>

          <div
            onClick={() => this.OpenUrl(Link.TWITTER)}
            className={classNames(Style.help_center_social_grid)}
          >
            <IconBox
              width="14px"
              icon={getIcon('TWITTER', theme.theme_mode)}
              tooltip={false}
            />
            <span>Twitter</span>
          </div>

          <div
            onClick={() => this.OpenUrl(Link.INSTAGRAM)}
            className={classNames(Style.help_center_social_grid)}
          >
            <IconBox
              width="14px"
              icon={getIcon('INSTAGRAM', theme.theme_mode)}
              tooltip={false}
            />
            <span>Instagram</span>
          </div>

          <div
            onClick={() => this.OpenUrl(Link.LINKEDIN)}
            className={classNames(Style.help_center_social_grid)}
          >
            <IconBox
              width="14px"
              icon={getIcon('LINKEDIN', theme.theme_mode)}
              tooltip={false}
            />
            <span>LinkedIn</span>
          </div>
          <div
            onClick={() => this.OpenUrl(Link.YOUTUBE)}
            className={classNames(Style.help_center_social_grid)}
          >
            <IconBox
              width="14px"
              icon={getIcon('YOUTUBE', theme.theme_mode)}
              tooltip={false}
            />
            <span>YouTube</span>
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

export default withRouter(connect(mapStateToProps, null)(HelpCenter));
