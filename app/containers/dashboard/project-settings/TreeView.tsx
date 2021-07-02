import * as React from 'react';
import classNames from 'classnames';

import _ from 'lodash';
import electronlog from '@stackabl/core/shared/logger';
import TreeView from 'deni-react-treeview';
import { WebsyncFile } from '@stackabl/core/render/Database/schema';
import Style from './treeView.scss';

const log = electronlog.scope('tree-view');
interface Props {
  id?: number;
  deleteIcon?: string;
  filesList: Array<WebsyncFile>;
  updateTreeListHandler: (selectedPath: string, isSelected: boolean) => void;
}

interface State {
  // option?: string;
  loading?: boolean;
  filesList: Array<WebsyncFile>;
  tempPath: string;
}

interface TreeItem {
  text: string;
  id: number;
  state: number;
  expanded: boolean;
}

export default class TreeViewUI extends React.Component<Props, State> {
  filePaths: Array<string> = [
    'project-subscribe-new.zip',
    'wp-content/mysql.sql',
    'wp-content/wflogs/.htaccess',
    'wp-admin/css/colors/_mixins.scss',
    'wp-admin/css/colors/_admin.scss',
    'wp-admin/css/colors/colors.scss',
    'wp-admin/js/common.min.js',
    'wp-content/index.php',
    'wp-content/mysql.sql',
    'Wp-content/plugins/akismet/akismet.php',
    'wp-content/abc.sql',
    'mp-content/wflogs/.htaccess/mvp',
    'sp-admin/css/colors/abc/def/_mixins.scss',
    'wp-admin/css/colors/_admin.scss',
    'vf-admin/css/colors/abc/def/fgh/colors.scss',
    'wp-admin/js/common.min.js',
    'wp-content/index.php/bh.scss',
    'ww-content/mysql.sql',
    'Wp-content/plugins/akismet/akismet.php/abc.scss',
    'wrp-content/mysql.sql',
    'wrp-content/wflogs/.htaccess',
    'wrp-admin/css/colors/_mixins.scss',
    'wrp-admin/css/colors/_admin.scss',
    'wrp-admin/css/colors/colors.scss',
    'wrp-admin/js/common.min.js',
    'wrp-content/index.php',
    'wrp-content/mysql.sql',
    'wrp-content/plugins/akismet/akismet.php',
    'wrp-content/abc.sql',
    'mp-content/wflogs/.htaccess/mvp',
    'sp-admin/css/colors/abc/def/_mixins.scss',
    'wrp-admin/css/colors/_admin.scss',
    'vf-admin/css/colors/abc/def/fgh/colors.scss',
    'wrp-admin/js/common.min.js',
    'wrp-content/index.php/bh.scss',
    'ww-content/mysql.sql',
    'wrp-content/plugins/akismet/akismet.php/abc.scss',
  ];

  treeData: { title: string }[] = [];

  treeviewRef: React.RefObject<TreeView>;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      filesList: [],
      tempPath: '',
    };

    this.treeviewRef = React.createRef();
  }

  componentDidMount() {
    this.prepareTreeFiles();
  }

  componentDidUpdate() {
    const { filesList: newList } = this.props;
    const { filesList: oldList } = this.state;
    log.info('update request');
    if (!_.isEqual(newList, oldList)) {
      this.updateTreeFiles(newList);
    }
  }

  updateTreeFiles = (newList: Array<WebsyncFile>) => {
    log.info('updating list');
    this.setState(
      {
        filesList: [...newList],
        loading: true,
      },
      () => {
        // log.info('updatedList', this.state.filesList);
        this.prepareTreeFiles();
      }
    );
  };

  prepareTreeFiles = () => {
    const tree = {};
    const { filesList } = this.state;
    let path;
    filesList.forEach((file) => {
      let currentNode: any = tree;
      path = file.filePath;
      path.split('/').forEach((segment) => {
        if (currentNode[segment] === undefined) {
          currentNode[segment] = {};
        }
        currentNode = currentNode[segment];
      });
    });
    this.treeData = this.toTreeData(tree);
    setTimeout(() => {
      this.setState({ loading: false });
    }, 100);
  };

  // state:1 --> check the item
  // state:2 --> uncheck the item

  toTreeData = (tree: any) => {
    return Object.keys(tree).map((title, index) => {
      let o = { text: title, id: Math.random(), state: 1, expanded: false };
      if (Object.keys(tree[title]).length > 0) {
        const newInput = {
          ...o,
          children: this.toTreeData(tree[title]),
          key: index,

          // id: index,
          // text: title,
          // label: title,
          // icon: Question,
        };
        o = newInput;
      }

      return o;
    });
  };

  clearPath = async () => {
    this.setState({
      tempPath: '',
    });
  };

  checkedItem = async (item: TreeItem) => {
    log.info('checkedItem', item);
    await this.clearPath();
    this.generateNodePath(item, item);
  };

  generateNodePath = (item: TreeItem, selectedNodeItem: TreeItem) => {
    try {
      const api = this.treeviewRef.current?.api;
      if (item) {
        const parentNode = api.getParentNode(item);
        if (parentNode && parentNode.text !== 'root') {
          this.setState(
            (prevState) => ({
              tempPath: `${parentNode.text}/${prevState.tempPath}`,
            }),
            () => {
              this.generateNodePath(parentNode, selectedNodeItem);
            }
          );
        } else {
          this.setState(
            (prevState) => ({
              tempPath: prevState.tempPath.concat(`${selectedNodeItem.text}`),
              loading: false,
            }),
            () => {
              const { tempPath } = this.state;
              const { updateTreeListHandler } = this.props;
              // state:1 --> item checked
              // state:2 --> item unchecked
              updateTreeListHandler(tempPath, selectedNodeItem.state === 1);
              this.updateFilesList(tempPath, selectedNodeItem.state === 1);
            }
          );
        }
      }
    } catch (err) {
      log.error('[generateNodePath]', err);
    }
  };

  updateFilesList = (tempPath: string, isSelected: boolean) => {
    this.setState((prevState) => {
      return {
        filesList: prevState.filesList.map((file) => {
          if (file.filePath.includes(tempPath)) {
            file.isSelected = isSelected;
          }
          return file;
        }),
      };
    });
  };

  removeSelectedItem = () => {
    const api = this.treeviewRef.current?.api;
    const selectedItem = api.getSelectedItem();
    log.info(
      '🚀 ~ file: index.tsx ~ line 109 ~ CreateNewProject ~ selectedItem',
      selectedItem
    );
    if (selectedItem) {
      api.removeItem(selectedItem.id);
    } else {
      // alert('You have to select a item to remove it');
    }
  };

  onActionButtonClick = (item: TreeItem, actionButton) => {
    const buttonKey = actionButton.key;
    const api = this.treeviewRef.current?.api;

    switch (buttonKey) {
      case 'delete':
        if (item.id) {
          api.removeItem(item.id);
        }

        break;

      default:
    }
  };

  onRenderItem = (item: TreeItem, treeview) => {
    log.info(item);
    log.info(treeview);
  };

  render() {
    const { loading } = this.state;
    const { deleteIcon } = this.props;
    return (
      <>
        {/* <TreeView id={1} data={this.treeData} /> */}
        {/* <div role="presentation" onClick={this.removeSelectedItem}>
          Click to remove the select item
        </div> */}
        <div
          id="theme-customization"
          className={classNames('tree-view-theme-customization-stackabl')}
        >
          {!loading && (
            <TreeView
              items={this.treeData}
              showCheckbox
              onCheckItem={(item: TreeItem) => {
                this.checkedItem(item);
              }}
              ref={this.treeviewRef}
              autoload
              className={classNames(Style['treeview-teste'])}
              actionButtons={[
                <img src={deleteIcon} key="delete" alt="delete_icon" />,
              ]}
              onActionButtonClick={this.onActionButtonClick}
            />
          )}
        </div>
      </>
    );
  }
}
