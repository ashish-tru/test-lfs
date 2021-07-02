import * as React from 'react';
import classNames from 'classnames';
import { Button } from '@stackabl/ui';

import TreeView from 'deni-react-treeview';

import Style from './test123.scss';

import BasicProject from '../../container-components/create-new-project-forms/basic-project';

import CloneFromWebsite from '../../container-components/create-new-project-forms/clone-from-website';
import CloneFromGithub from '../../container-components/create-new-project-forms/clone-from-github';

interface Props {
  id: number;
}

interface State {
  option?: string;
}

export default class CreateNewProject extends React.Component<Props, State> {
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
      option: 'basic',
    };

    this.treeviewRef = React.createRef();
  }

  componentDidMount() {
    const tree = {};

    this.filePaths.forEach(function (path) {
      let currentNode: any = tree;
      path.split('/').forEach(function (segment) {
        if (currentNode[segment] === undefined) {
          currentNode[segment] = {};
        }
        currentNode = currentNode[segment];
      });
    });
    this.treeData = this.toTreeData(tree);
  }

  //state:1 --> check the item
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

  changeOption = (str: string) => {
    this.setState({
      option: str,
    });
  };

  checkedItem = (item) => {
    console.log(
      '🚀 ~ file: index.tsx ~ line 96 ~ CreateNewProject ~ item',
      item
    );
  };

  removeSelectedItem = () => {
    const api = this.treeviewRef.current?.api;
    const selectedItem = api.getSelectedItem();
    console.log(
      '🚀 ~ file: index.tsx ~ line 109 ~ CreateNewProject ~ selectedItem',
      selectedItem
    );

    if (selectedItem) {
      api.removeItem(selectedItem.id);
    } else {
      alert('You have to select a item to remove it');
    }
  };

  onRenderItem = (item, treeview) => {
    alert(item);
    console.log(treeview);

    // return (
    //   <div className="treeview-item-example">
    //     <span className="treeview-item-example-text">{item.text}</span>
    //     <span
    //       className="actionButton trash"
    //       onClick={() => deleteItemClick(item.id)}
    //     >
    //       <FaTrash size="15" />
    //     </span>
    //     <span className="actionButton edit" onClick={() => editItemClick(item)}>
    //       <FaEdit size="15" />
    //     </span>
    //   </div>
    // );
  };

  render() {
    const { option } = this.state;
    return (
      <>
        <div>test</div>
        <Button
          text="Git Project"
          onClickListener={() => {
            this.changeOption('git');
          }}
        />

        {/* <TreeView id={1} data={this.treeData} /> */}
        <div role="presentation" onClick={this.removeSelectedItem}>
          Click to remove the select item
        </div>
        <div
          id="theme-customization"
          className={classNames(Style[`theme-customization`], 'background')}
        >
          <TreeView
            items={this.treeData}
            showCheckbox
            onCheckItem={(item) => {
              this.checkedItem(item);
            }}
            ref={this.treeviewRef}
            autoload
            className={classNames(Style['treeview-teste'])}
          />
        </div>
        <Button
          text="Basic Project"
          onClickListener={() => {
            this.changeOption('basic');
          }}
        />

        <Button
          text="Website Project"
          onClickListener={() => {
            this.changeOption('website');
          }}
        />
        {option === 'basic' && <BasicProject startAt={1} endAt={3} />}
        {option === 'git' && <CloneFromGithub startAt={4} endAt={6} />}
        {option === 'website' && <CloneFromWebsite startAt={4} endAt={6} />}
      </>
    );
  }
}
