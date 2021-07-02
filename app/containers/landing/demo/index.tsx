import React from 'react';
import classNames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import {
  Button,
  Tag,
  IconBox,
  Tooltip,
  Switch,
  Input,
  TextArea,
  ProgressBar,
  Modal,
  Grid,
  Card,
  Col,
  TextHighlighter,
  CheckBox,
  BottomNotification,
  Tab,
  TabPanel,
  SelectOptions,
  Menu,
  Accordion,
} from '@stackabl/ui';
import { connect } from 'react-redux';
import Style from './index.scss';
import { RootState } from '../../../reducers/types';
import { InitialThemeState } from '../../../reducers/theme';
import { getIcon } from '../../../utils/themes/icons';
import { THEME_COLOR } from '../../../constants/index';

import Tick from '../../../resources/Icons/Common/add.svg';

const variables = require('../../../global.scss');

interface StateProps {
  theme: InitialThemeState;
}

interface TabList {
  id: number;
  name: string;
}
interface SelectList {
  id: number;
  name: string;
}
interface MenuList {
  id: number;
  name: string;
}

interface State {
  projectName: string;
  textInput: string;
  showModal: boolean;
  showModal2: boolean;
  showNotification: boolean;
  tabId: number;
  sortBy: string;
  menuId: number;
  selectCheckbox: { [label: string]: boolean };
}
export interface TypeProps {
  tabList: ({ [label: string]: string } | unknown)[];
  selectList: ({ [label: string]: string } | unknown)[];
  list: ({ [label: string]: string } | unknown)[];
}

type Props = StateProps & TypeProps & RouteComponentProps;

class Demo extends React.Component<Props, State> {
  tabList = [
    { id: 0, name: 'tab1', disable: false },
    { id: 1, name: 'tab2', disable: false },
    { id: 2, name: 'tab3', disable: true },
  ];

  selectList = [
    { id: 0, name: 'Select A' },
    { id: 1, name: 'Select B' },
    { id: 2, name: 'Select Lorem Ipsum c' },
  ];

  list = [
    { id: 0, name: 'Select A' },
    { id: 1, name: 'Select B' },
    { id: 2, name: 'Select Lorem Ipsum c' },
  ];

  constructor(props: Props) {
    super(props);
    this.state = {
      projectName: '',
      textInput: '',
      showModal: false,
      showModal2: false,
      showNotification: false,
      tabId: 0,
      sortBy: '',
      menuId: 0,
      selectCheckbox: {
        ck1: false,
        ck2: false,
        ck3: false,
      },
    };
    this.toggleRemove = this.toggleRemove.bind(this);
  }

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ projectName: event.target.value });
  };

  onTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ textInput: event.target.value });
  };

  getKeyByValue = (
    object: { [label: string]: string },
    value: string
  ): string => {
    return (
      Object.keys(object).find((key) => object[key] === value) ||
      'THEME_COLOR_0'
    );
  };

  onClickshowModal = () => {
    this.setState((prevState) => ({ showModal: !prevState.showModal }));
  };

  onClickshowModal2 = () => {
    this.setState((prevState) => ({ showModal2: !prevState.showModal2 }));
  };

  onClickshowNotification = () => {
    this.setState((prevState) => ({
      showNotification: !prevState.showNotification,
    }));
  };

  onclickRemove = () => {
    this.setState({
      showNotification: false,
    });
  };

  onTabClick = (item: TabList) => {
    this.setState({
      tabId: item.id,
    });
  };

  onMenuClick = (item: MenuList) => {};

  onClickSortItem = (item: SelectList) => {
    this.setState({
      sortBy: item.name,
    });
  };

  handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const { selectCheckbox } = this.state;

    selectCheckbox[name] = !selectCheckbox[name];
    this.setState({
      selectCheckbox,
    });
  };

  toggleRemove(id: number): void {
    this.setState((prevState) => ({
      menuId: prevState.menuId === id ? 10 : id,
    }));
  }

  render() {
    const {
      projectName,
      textInput,
      showModal,
      showModal2,
      showNotification,
      tabId,
      sortBy,
      menuId,
      selectCheckbox,
    } = this.state;
    const { theme } = this.props;
    return (
      <div className={classNames(Style.demo_landing)}>
        <div>
          <h2>Button:</h2>
          <Button
            customClass={classNames(Style.mr_r)}
            text="Button"
            variant={Button.getVariant.CONTAINED}
            size={Button.Size.SMALL}
          />
          <Button
            customClass={classNames(Style.mr_r)}
            text="Button"
            variant={Button.getVariant.CONTAINED}
            size={Button.Size.MEDIUM}
          />
          <Button
            text="Button"
            variant={Button.getVariant.CONTAINED}
            size={Button.Size.LARGE}
          />
          <h2>Tag:</h2>
          <div className={classNames(Style.tag_inline)}>
            <Tag id={1} active title="Active" />
            <Tag
              id={2}
              active
              variant={Tag.getVariant.OUTLINE}
              title="Active"
            />
            <Tag
              id={3}
              active
              variant={Tag.getVariant.CONTAINED}
              title="Active"
            />
            <Tag id={4} title="tag" />
            <Tag id={5} variant={Tag.getVariant.OUTLINE} title="tag" />
            <Tag id={6} variant={Tag.getVariant.CONTAINED} title="tag" />
          </div>
          <h2>IconBox</h2>
          <IconBox
            customClass={classNames(Style.mr_r)}
            width="20"
            name="box"
            tooltipPlacement="bottom"
            icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
          />
          <IconBox
            customClass={classNames(Style.mr_r)}
            width="20"
            name="icon"
            radius="50%"
            size={IconBox.Size.MEDIUM}
            variant={IconBox.getVariant.FILLED}
            icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
          />
          <IconBox
            width="20"
            name="icon"
            size={IconBox.Size.SMALL}
            variant={IconBox.getVariant.OUTLINED}
            icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
          />
          <h2>Tooltip:</h2>
          <Tooltip
            customClass={classNames(Style.mr_r)}
            title="I am here"
            placement={Tooltip.getPlacement.TOP}
          >
            <img src={getIcon('SECONDARY_LOGO', theme.theme_mode)} alt="icon" />
          </Tooltip>
          <Tooltip
            customClass={classNames(Style.mr_r, Style.tool)}
            title="I am here"
            placement={Tooltip.getPlacement.RIGHT}
          >
            <img src={getIcon('SECONDARY_LOGO', theme.theme_mode)} alt="icon" />
          </Tooltip>
          <h2>Switch:</h2>
          {/* <ThemeProvider>
            <ThemeContext.Consumer>
              {(context) => (
                <Switch
                  // disable={true}
                  size={Switch.Size.MEDIUM}
                  customClass={classNames(Style.custom_switch)}
                  leftTitle="Light"
                  rightTitle="Dark"
                  checked={context.isDark}
                  onClickListener={context.toggleTheme}
                />
              )}
            </ThemeContext.Consumer>
          </ThemeProvider> */}
          <h2>CheckBox:</h2>
          <CheckBox
            leftLabel="checkbox1"
            id="check1"
            name="ck1"
            value="check"
            radius="3px"
            icon={Tick}
            checked={selectCheckbox.ck1}
            outline
            disable
            onChangeListener={this.handleCheckbox}
          />
          <CheckBox
            rightLabel="checkbox2"
            id="check2"
            name="ck2"
            value="check"
            radius="50%"
            outline
            icon={Tick}
            checked={selectCheckbox.ck2}
            onChangeListener={this.handleCheckbox}
          />
          <CheckBox
            id="check3"
            name="ck3"
            value="checked"
            checked={selectCheckbox.ck3}
            onChangeListener={this.handleCheckbox}
            icon={Tick}
          />
          <h2>Menu:</h2>
          <Button
            text="ShowMenu"
            variant={Button.getVariant.CONTAINED}
            size={Button.Size.LARGE}
            onClickListener={() => this.toggleRemove(1)}
          />
          {menuId === 1 ? (
            <Menu
              id="wordpress"
              width="200px"
              radius="10px"
              maxHeight="180"
              header={
                <div className={classNames(Style.menu)}>This is my header</div>
              }
              footer={
                <div className={classNames(Style.menu)}>this is my footer</div>
              }
              onRemoveMenu={() => this.toggleRemove(0)}
              list={this.list}
              onClickItemListener={(item) => this.onMenuClick(item)}
            />
          ) : null}
          <h2>BottomNotification:</h2>
          <Button
            text="Click Here"
            variant={Button.getVariant.CONTAINED}
            size={Button.Size.LARGE}
            onClickListener={this.onClickshowNotification}
          />
          {showNotification ? (
            <BottomNotification
              id={1}
              // closeIcon={getIcon(this.props.theme.theme_mode).CLOSEBAR}
              // title="hello"
              autoRemove
              onAutoRemoveListener={this.onclickRemove}
              placement={BottomNotification.getPlacement.LEFT}
              icon={Tick}
              // onCloseClickListner={this.onCloseClick}
            >
              {'Starting your site '}
            </BottomNotification>
          ) : null}

          <h2>Tab and TabPanel:</h2>
          <Tab
            radius="5px 5px 0 0"
            tabList={this.tabList}
            onTabClickListener={(item) => this.onTabClick(item)}
          >
            {tabId === 0 ? <TabPanel id={1}>test1</TabPanel> : null}
            {tabId === 1 ? <TabPanel id={2}>test2</TabPanel> : null}
            {tabId === 2 ? <TabPanel id={3}>test3</TabPanel> : null}
          </Tab>
        </div>
        <div>
          <h2>Input:</h2>
          <Input
            id={1}
            type="text"
            value={projectName}
            customClass={classNames(Style.input_demo)}
            onChangeListener={this.onInputChange}
          />
          <h2>TextArea:</h2>
          <TextArea
            id={1}
            value={textInput}
            onChangeListener={this.onTextAreaChange}
          />
          <h2>ProgressBar:</h2>
          <ProgressBar
            background
            // showSteps={false}
            status="Completed"
            secondaryColor={`${
              variables[this.getKeyByValue(THEME_COLOR, theme.theme_color)]
            }`}
            primaryColor={theme.theme_mode === 'dark' ? `#333` : `#ddd`}
            segments={[
              [100, `Downloading files`],
              [10, `Installing features`],
              [0, `Configuring settings`],
            ]}
          />
          <h2>Modal:</h2>
          <Button
            text="Click Here"
            variant={Button.getVariant.CONTAINED}
            size={Button.Size.LARGE}
            onClickListener={this.onClickshowModal}
          />
          <Button
            text="Click Here"
            variant={Button.getVariant.CONTAINED}
            size={Button.Size.LARGE}
            onClickListener={this.onClickshowModal2}
          />
          <h2>Grid , Card, TextHighlighter and col</h2>
          <Grid variant={Grid.getVariant.FLEX}>
            <Col xs={6} sm={4} md={3} lg={3}>
              <Card>Cols</Card>
            </Col>
            <Col xs={6} sm={4} md={3} lg={3}>
              <Card>Cols</Card>
            </Col>
            <Col xs={6} sm={4} md={3} lg={3}>
              <Card>
                <TextHighlighter text="Show highlighter text truncate" />
              </Card>
            </Col>
          </Grid>
          <h2>SelectOptions</h2>
          <SelectOptions
            id="sortby"
            label="Sort By"
            placeholder="Sort By"
            value={sortBy}
            selectedItem={(item) => this.onClickSortItem(item)}
            selectList={this.selectList}
            // icon={getIcon('SECONDARY_LOGO', theme.theme_mode)}
            customClass={classNames(Style.select_demo)}
          />
          <h2>Accordion:</h2>
          <Accordion
            id={1}
            title="Accordion 1"
            variant={Accordion.getVariant.OUTLINED}
            // toggleIcon={getIcon(this.props.theme_change.theme_mode).DROPDOWN}
            content={<p>Lorem Ipsum content dummy text 1</p>}
          />
          <Accordion
            id={2}
            title="Accordion 2"
            variant={Accordion.getVariant.OUTLINED}
            // toggleIcon={getIcon(this.props.theme_change.theme_mode).DROPDOWN}
            content={<p>Lorem Ipsum content dummy text 2</p>}
          />
        </div>

        {showModal && (
          <Modal
            id={1}
            ConfirmationText="Yes"
            cancelText="No"
            onCancelClickListener={this.onClickshowModal}
          >
            <h3>Are you sure you want to delete?</h3>
          </Modal>
        )}
        {showModal2 && (
          <Modal
            id={2}
            ConfirmationText="Yes"
            cancelText="No"
            onCancelClickListener={this.onClickshowModal2}
          >
            <h3>Are you sure you want to quit Stackabl?</h3>
          </Modal>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
  };
};

export default withRouter(connect(mapStateToProps, null)(Demo));
