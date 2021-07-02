import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { Modal, Button, Grid, Input, IconBox } from '@stackabl/ui';
import request from '@stackabl/core/render/api';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import functionlist from '@stackabl/core/shared/constants/functionlist';
import log from 'electron-log';
import ModalAction, { SearchReplaceDataType } from '../../actions/modal';
import { InitialProjectState } from '../../reducers/projects';
import { InitialModalState } from '../../reducers/modal';
import { InitialThemeState } from '../../reducers/theme';
import { RootState } from '../../reducers/types';

import { getIcon } from '../../utils/themes/icons';

import Style from './index.scss';
import {
  NotificationContentType,
  NotificationKeys,
} from '../../actions/notification';
import displayNotification from '../../utils/common/notification';

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
  projectsData: InitialProjectState;
}

interface State {
  // searchAndReplaceModal: boolean;
  findText: string;
  replaceText: string;
  rows: Array<IList>;
  loader: boolean;
  incrementForId: number;
  numberOfInputs: number;
  inputValue: { [k: string]: string };
  disableReplaceButton: boolean;
}

interface IList {
  id: number;
}

interface DispatchProps {
  showSearchAndReplaceModal: (payload: SearchReplaceDataType) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class SearchAndReplaceModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      // searchAndReplaceModal: false,
      findText: '',
      replaceText: '',
      loader: false,
      rows: [{ id: 1 }],
      incrementForId: 1,
      numberOfInputs: 2,
      inputValue: {},
      disableReplaceButton: true,
    };
    this.actionOnClick = this.actionOnClick.bind(this);
  }

  clearText = (id: string) => {
    const { inputValue } = this.state;
    const tempInputValue = inputValue;

    tempInputValue[id] = '';
    this.setState({ inputValue: tempInputValue, disableReplaceButton: true });
  };

  addNewRowData = (item: IList) => {
    const { theme } = this.props;
    const { inputValue, findText, replaceText, rows } = this.state;

    return [
      <div
        id={`${item.id}`}
        key={item.id}
        className={classNames(
          Style.search_and_replace_modal_content_input_container
        )}
      >
        <Grid
          customClass={classNames(
            Style.search_and_replace_modal_content_input_row
          )}
        >
          <div className={classNames(Style.search_and_replace_input_col)}>
            <Input
              id={findText}
              type="text"
              name={`findText_${item.id}`}
              value={inputValue[`findText_${item.id}`]}
              customClass={classNames(Style.search_and_replace_input)}
              labelText="Find"
              onChangeListener={this.onInputChangeListener}
              cancelIcon={getIcon('CLEAR', theme.theme_mode)}
              onClearTextListener={() => {
                this.clearText(`findText_${item.id}`);
              }}
              disableFocus

              // labelCustomClass={classNames(Style.search_and_replace_input_label)}
            />
            <IconBox
              icon={getIcon('ARROW_RIGHT', theme.theme_mode)}
              customClass={classNames(Style.search_and_replace_arrow_right)}
              name="Arrow Right "
              tooltip={false}
            />
          </div>
          <div className={classNames(Style.search_and_replace_input_col)}>
            <Input
              id={replaceText}
              type="text"
              name={`replaceText_${item.id}`}
              value={inputValue[`replaceText_${item.id}`]}
              customClass={classNames(Style.search_and_replace_input)}
              labelText="Replace"
              onChangeListener={this.onInputChangeListener}
              labelCustomClass={classNames(
                Style.search_and_replace_input_label
              )}
              cancelIcon={getIcon('CLEAR', theme.theme_mode)}
              onClearTextListener={() => {
                this.clearText(`replaceText_${item.id}`);
              }}
              disableFocus
            />
            {/* Icon for cross will only show when you add new row, for this uncomment below and add you condition */}
            <IconBox
              icon={
                rows.length === 1
                  ? getIcon('ROUND_CROSS_DISABLE', theme.theme_mode)
                  : getIcon('ROUND_CROSS', theme.theme_mode)
              }
              customClass={classNames(
                Style.search_and_replace_cross,
                rows.length === 1
                  ? Style.search_and_replace_cross_disable
                  : Style.search_and_replace_cross_enable
              )}
              name="Cross Icon"
              tooltip={false}
              onClickListener={() => {
                if (rows.length !== 1) {
                  this.removeItem(item.id);
                }
              }}
            />
          </div>
        </Grid>
      </div>,
    ];
  };

  actionOnClick = async (which: string) => {
    const { showSearchAndReplaceModal, modalData, projectsData } = this.props;
    const {
      search_and_replace: { project },
    } = modalData;
    const { inputValue, rows } = this.state;

    try {
      this.setState({ loader: true });
      // console.log('actionClick', which, inputValue);
      const obj: Record<string, string> = {};
      // console.log('Row value is ',rows)
      for (let i = 0; i < rows.length; i += 1) {
        const findValue = `findText_${rows[i].id}`;
        const replaceValue = `replaceText_${rows[i].id}`;

        obj[`${inputValue[findValue]}`] = inputValue[replaceValue];
      }
      if (which === 'Yes') {
        const result = await request(EndPoint.SEARCH_REPLACE, project.type, [
          functionlist.FIND_REPLACE,
          [project.subTitle, project.title],
          [obj],
        ]);

        /**
         * discuss if replaced string is 0 then treat as error or sucess
         * currently it's sucess
         */

        log.info(result, 'search replace');
        // ipcRenderer.send('notification', {
        //   title: 'Info',
        //   body: `Replaced ${result} strings.`,
        // });
        const payload: NotificationContentType = {
          id: 'DATABASE',
          message: `Replaced ${result} strings.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Info',
        };
        displayNotification(payload);
      }
      switch (which) {
        case 'Yes':
          showSearchAndReplaceModal({
            ...modalData.search_and_replace,
            show: !modalData.search_and_replace.show,
            yes: true,
            no: false,
          });

          break;
        case 'No':
          // this.onClickshowsearchAndReplace();
          showSearchAndReplaceModal({
            ...modalData.search_and_replace,
            show: !modalData.search_and_replace.show,
            yes: false,
            no: true,
          });
          break;
        default:
          showSearchAndReplaceModal({
            ...modalData.search_and_replace,
            show: false,
          });
          break;
      }
    } catch (e) {
      showSearchAndReplaceModal({
        ...modalData.search_and_replace,
        show: !modalData.search_and_replace.show,
        yes: true,
        no: false,
      });

      log.error('Some error in search replace', e);
      // ipcRenderer.send('notification', {
      //   title: 'Failed',
      //   body: `Some error occured in find and replace.`,
      // });
      const payload: NotificationContentType = {
        id: 'DATABASE',
        message: `Some error occured in find and replace.`,
        type: NotificationKeys.ADD_NOTIFICATION,
        title: 'Failed',
      };
      displayNotification(payload);
    }
  };

  // onClickshowsearchAndReplace = () => {
  //   this.setState((prevState) => ({
  //     searchAndReplaceModal: !prevState.searchAndReplaceModal,
  //   }));
  // };

  onInputChangeListener = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const { inputValue, numberOfInputs } = this.state;
    const newValue = {
      ...inputValue,
      [event.target.name]: event.target.value,
    };
    const numberOfInputsLocal = numberOfInputs;
    this.setState(
      {
        inputValue: newValue,
      },
      () => {
        const valArray = Object.values(newValue);
        let numOfNonEmtyInp = 0;
        for (let iter = 0; iter < valArray.length; iter += 1) {
          if (valArray[iter] !== '') {
            numOfNonEmtyInp += 1;
          }
        }

        if (numOfNonEmtyInp !== numberOfInputsLocal) {
          this.setState({ disableReplaceButton: true });
        } else {
          this.setState({ disableReplaceButton: false });
        }
      }
    );
  };

  addNewRow = () => {
    this.setState((prevState) => ({
      numberOfInputs: prevState.numberOfInputs + 2,
      disableReplaceButton: true,
      incrementForId: prevState.incrementForId + 1,
    }));
    const { rows, incrementForId } = this.state;
    rows.push({ id: incrementForId + 1 });
    this.setState({ rows });

    return rows;
  };

  removeItem = (id: number) => {
    const { inputValue, numberOfInputs } = this.state;
    const inputObj = inputValue;
    let numberOfInputsLocal = numberOfInputs;
    delete inputObj[`replaceText_${id}`];
    delete inputObj[`findText_${id}`];
    numberOfInputsLocal -= 2;
    this.setState(
      (prevState) => ({
        numberOfInputs: prevState.numberOfInputs - 2,
      }),
      () => {
        this.setState(
          (state) => {
            const rows = state.rows.filter((item) => item.id !== id);
            return {
              rows,
            };
          },
          () => {
            log.log(`value of inputs${JSON.stringify(inputObj)}`);
            const valArray = Object.values(inputObj);
            let numOfNonEmtyInp = 0;

            for (let i = 0; i < valArray.length; i += 1) {
              if (valArray[i] !== '') {
                numOfNonEmtyInp += 1;
              }
            }

            log.info(
              `[Search and Replace]  Number of nonEmtpy inoputs are ${numberOfInputsLocal}Number of inputs${numberOfInputs}`
            );

            if (numOfNonEmtyInp !== numberOfInputsLocal) {
              this.setState({
                disableReplaceButton: true,
                inputValue: inputObj,
              });
            } else if (numberOfInputsLocal === 0) {
              this.setState({
                disableReplaceButton: true,
                inputValue: inputObj,
              });
            } else {
              this.setState({
                disableReplaceButton: false,
                inputValue: inputObj,
              });
            }
          }
        );
      }
    );
  };

  findListInfo = () => {
    const { rows } = this.state;
    return rows.map((item) => this.addNewRowData(item));
  };

  render() {
    const {
      theme,
      modalData: {
        search_and_replace: { cancel_btn_text: cancelBtnText },
      },
    } = this.props;
    const { disableReplaceButton, loader } = this.state;
    return (
      <Modal
        id={1}
        parentClass={classNames(Style.search_and_replace_main_modal)}
        ConfirmationText="Replace"
        cancelVariant="text"
        buttongGroupClass={classNames(
          Style.search_and_replace_main_modal_footer
        )}
        loader={loader ? getIcon('LOADER', theme.theme_mode) : ''}
        loaderTitle="Loading..."
        cancelText={cancelBtnText}
        onYesClickListener={() => {
          this.actionOnClick('Yes');
        }}
        onCancelClickListener={() => {
          this.actionOnClick('No');
        }}
        customClass={classNames(Style.search_and_replace_modal)}
        disableYesButton={disableReplaceButton || loader}
        customFooterClass={classNames(Style.search_and_replace_modal_buttons)}
        yesButtonVariant="contained"
        size={Modal.Size.XTRA_LARGE}
        footer={
          <Button
            id="project_setting_add_new_button"
            alignIcon={Button.getPosition.LEFT}
            text="Add New"
            size={Button.Size.MEDIUM}
            customClass={classNames(
              Style.search_and_replace_clone_setting_button
            )}
            onClickListener={this.addNewRow}
          />
        }
      >
        <div className={classNames(Style.search_and_replace_container)}>
          <h1 className={classNames(Style.search_and_replace_heading)}>
            Find &amp; Replace
          </h1>
          <p className={classNames(Style.search_and_replace_modal_content)}>
            This will help you to find and replace text in your database.
          </p>
          <div className={classNames(Style.search_and_replace_multirows)}>
            {this.findListInfo()}
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    theme: state.theme_attributes,
    modalData: state.modal_attributes,
    projectsData: state.project_attributes,
  };
};

const mapDispatchToAction = (dispatch: Dispatch): DispatchProps => {
  return bindActionCreators(ModalAction, dispatch);
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToAction)(SearchAndReplaceModal)
);
