import React from 'react';

import classNames from 'classnames';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { IconBox, Modal } from '@stackabl/ui';
import { ipcRenderer, remote } from 'electron';
import request from '@stackabl/core/render/api';
import EndPoint from '@stackabl/core/shared/api/endpoint';
import RegisterPackages from '@stackabl/core/shared/api/register-packges';
import functionlist from '@stackabl/core/shared/constants/functionlist';
import { InitialThemeState } from '../../reducers/theme';
import { InitialModalState } from '../../reducers/modal';
import ModalAction, {
  ImportDataType,
  SearchReplace,
} from '../../actions/modal';
import { RootState } from '../../reducers/types';
// import routes from '../../constants/routes.json';
import { getIcon } from '../../utils/themes/icons';
// import EndPoint from '@stackabl/core/shared/api/endpoint';
// import RegisterPackages from '@stackabl/core/shared/api/register-packges';
// import db from '@stackabl/core/render/Database';
import Style from './index.scss';
import { InitialProjectState } from '../../reducers/projects';
import {
  NotificationContentType,
  NotificationKeys,
} from '../../actions/notification';
import displayNotification from '../../utils/common/notification';
// import request from '@stackabl/core/render/api/index';
const { dialog } = remote;

interface StateProps {
  theme: InitialThemeState;
  modalData: InitialModalState;
  projectsData: InitialProjectState;
}

interface State {
  loader: boolean;
}

interface DispatchProps {
  showImportDatabaseModal: (payload: ImportDataType) => void;
  showSearchAndReplaceModal: (payload: SearchReplace) => void;
}

type Props = StateProps & RouteComponentProps & DispatchProps;

class ImportDatabaseModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loader: false,
    };
    this.actionOnClick = this.actionOnClick.bind(this);
  }

  importDatabase = async () => {
    const {
      showImportDatabaseModal,
      showSearchAndReplaceModal,
      projectsData: { currentProject },
      projectsData: {
        currentProject: { type },
      },
      modalData: {
        import_database: {
          project: { title, subTitle },
        },
      },
      modalData,
      modalData: {
        import_database: { project },
      },
    } = this.props;

    const sqlFilePath = dialog.showOpenDialogSync({
      title: 'Please select SQL file to import',
      filters: [{ name: 'sqlfiles', extensions: ['sql'] }],
      properties: ['openFile'],
    });

    if (sqlFilePath !== undefined) {
      try {
        this.setState({ loader: true });
        //  this.setState({ is_disabled: Disable.IMPORT });
        await request(EndPoint.SERVICE_FUNCTION, RegisterPackages.WORDPRESS, [
          functionlist.IMPORT_DATABASE,
          [subTitle, title],
          [sqlFilePath[0]],
        ]);

        this.setState({ loader: false });

        // ipcRenderer.send('notification', {
        //   title: 'Success',
        //   body: 'Database has been imported.',
        // });
        const payload: NotificationContentType = {
          id: 'DATABASE',
          message: `Database has been imported.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Success',
        };
        displayNotification(payload);
        showImportDatabaseModal({
          show: false,
          yes: false,
          no: false,
          project,
        });
        if (type === RegisterPackages.WORDPRESS) {
          showSearchAndReplaceModal({
            ...modalData.logOut_data,
            yes: false,
            no: false,
            project: currentProject,
            show: true,
            cancel_btn_text: 'Skip',
          });
        }
      } catch (e) {
        // log.error('[project-settings/index.ts]  importExportLink catch error');
        // log.error(err);
        this.setState({ loader: false });
        showImportDatabaseModal({
          show: false,
          yes: false,
          no: false,
          project,
        });
        // ipcRenderer.send('notification', {
        //   title: 'Error',
        //   body: 'Something went wrong while importing the database.',
        // });
        const payload: NotificationContentType = {
          id: 'DATABASE',
          message: `Something went wrong while importing the database.`,
          type: NotificationKeys.ADD_NOTIFICATION,
          title: 'Error',
        };
        displayNotification(payload);
      }
    }
  };

  actionOnClick = (action: string) => {
    const {
      showImportDatabaseModal,
      modalData: {
        import_database: { project },
      },
    } = this.props;

    switch (action) {
      case 'yes':
        this.importDatabase();

        break;
      case 'skip':
        showImportDatabaseModal({
          show: false,
          yes: false,
          no: false,
          project,
        });

        // if (type === RegisterPackages.WORDPRESS) {
        //   showSearchAndReplaceModal({
        //     ...modalData.logOut_data,
        //     yes: false,
        //     no: false,
        //     project: currentProject,
        //     show: ,
        //   });
        // }

        break;
      default:
        console.log('Do nothing ');
    }
  };

  render() {
    const { theme } = this.props;
    const { loader } = this.state;

    return (
      <>
        <Modal
          id={1}
          // enable loader by adding props loader={iconpath} with icon path and loaderTitle={title}
          ConfirmationText="Import database"
          yesButtonVariant="contained"
          cancelVariant="text"
          cancelText="Skip"
          loader={loader ? getIcon('LOADER', theme.theme_mode) : ''}
          onYesClickListener={() => {
            this.actionOnClick('yes');
          }}
          onCancelClickListener={() => {
            this.actionOnClick('skip');
          }}
          parentClass={classNames(Style.import_database_main_modal)}
          customClass={classNames(Style.import_database_modal)}
          size={Modal.Size.SMALL}
          buttongGroupClass={classNames(Style.import_database_modal_btn)}
        >
          <div className={classNames(Style.import_database_modal_header)}>
            <IconBox
              tooltip={false}
              customClass={classNames(Style.import_database_modal_icon)}
              icon={getIcon('IMPORT_DATABASE', theme.theme_mode)}
            />
            <h1 className={Style.heading}>Import your database</h1>
          </div>
          <p className={classNames(Style.import_database_modal_content)}>
            {' '}
            Select your database to import.
          </p>
        </Modal>
      </>
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
  connect(mapStateToProps, mapDispatchToAction)(ImportDatabaseModal)
);
