/* eslint-disable @typescript-eslint/naming-convention */
import RegisterPackages from '@stackabl/core/shared/api/register-packges';

// import ua from 'universal-analytics';
// import { config } from "dotenv";
// const result = config();
// if (result.error) {
//   throw result.error;
// }

// export default result.parsed;
// let g_a = 'UA-166524711-1'; // / Not working
// if (process.env.NODE_ENV !== 'development') {
//   g_a = 'UA-156524711-1';
// }
const stackablSite = process.env.STACKABL_WEBSITE;
const env_variable = {
  // visitor: ua(g_a),
  DOCKER_MACHINE_DARWIN:
    'https://github.com/docker/machine/releases/download/v0.16.0',
  DOCKER_MACHINE_LOCATION_DARWIN: '/usr/local/bin/docker-machine',
  NEXUS: 'nexus',
  PORT: '3000',
  PROJECTS_FOLDER_DARWIN: 'Documents/Stackabl',
  PROJECTS_FOLDER: 'Documents/Stackabl',
  USERFOLDER_DARWIN: '/Library/Preferences/Stackabl/',
  PROJECTS_FOLDER_WINDOWS: '\\Documents\\Stackabl',
  PROJECTS_FOLDER_WINDOWS_SHARED: 'Documents/Stackabl',
  USERFOLDER_WINDOWS: '\\AppData\\Local\\Stackabl\\',
  USERFOLDER_WINDOWS_SHARED: 'AppData/Local/Stackabl/',
  TRAEFIK: 'traefik:v1.7',
  VM_NAME: 'stackablMachine',
  VM_PORT: '2376',
  CDN_LINK: 'https://cdn.stackabl.io/resources/',
  DEPENDENCIES_LINK: 'https://cdn.stackabl.io/resources/dependencies.zip',
  LAMP: 'lamp:1.0.0',
  JLAMP: 'jlamp:1.0.0',
  LAMP_LINK: 'https://cdn.stackabl.io/resources/lamp_1_0_0.zip',
  ISO: 'boot2docker.iso',
  VIRTUAL_BOX: 'VirtualBox.pkg',
  VIRTUAL_BOX_WINDOWS: 'VirtualBox.exe',
  DOCKER_MCHINE: 'docker-machine-Darwin-x86_64',
  DOCKER_MACHINE_URL:
    'https://github.com/docker/machine/releases/download/v0.16.0',
  VBOX_DEFAULT_PATH: 'C:\\Program Files\\Oracle\\VirtualBox\\',
  STACKABL_SITE: stackablSite,
  STACKABL_SUPPORT_MAIL: 'support@stackabl.io',
  API_KEY: 'vqtai2bj3hq4g7i2u81ondttdp',
  API_KEY_ERROR_LOGS: 'k53520cdvudsu9db06r6gogi04',
  VS_CODE: 'codercom/code-server:latest',
  VS_PORT: '8080',
  VS_NAME: 'nstackablvscode111qwertyrandom',
  HELP_CENTER: `${stackablSite}/expert-support/`,
  STACKABL_DOCUMENTATION: `${stackablSite}/documentation/`,
  STACKABL_LEARN_MORE: `${stackablSite}/features/`,
  REQUEST_A_FEATURE: `${stackablSite}/request-a-feature/`,
  STACKABL_FAQ: `${stackablSite}/faq/`,
  STACKABL_CONTACT_US: `${stackablSite}/contact-us/`,
  STACKABL_RELEASE: `${stackablSite}/documentation/stackabl-release-1-0-0/?cat=stackabl-updates`,

  STACKABL_VERSION: '1.2.5',

  RELEASE_URL: `${stackablSite}/stackabl-releases/stackabl-release-0-32-5/?utm_source=Stackabl_App&utm_medium=Release_Log&utm_campaign=Update_32.5`,
  RELEASE_LOGS_IMAGE: `${stackablSite}/wp-content/uploads/2020/05/release_log.svg`, // this path is relative to constans file
  RELEASE_LOG_ARRAY: [
    'Drupal CMS Integration',
    'PHP Hot Swap',
    'Change Project Location',
    'Import Database After Git Clone',
    'Bug Fixes',
  ],
  CONTACT_US: `${stackablSite}/contact-us/`,
  GIT_HELP_CENTER:
    'https://docs.github.com/en/github/using-git/which-remote-url-should-i-use',
  FAQ: `${stackablSite}/faq/`,
  REQUEST_FEATURE: `${stackablSite}/request-a-feature/`,
  HELP_PLUGIN_CENTER: `${stackablSite}/article/how-to-clone-a-wordpress-website-using-the-stackabl-plugin`,
  LOGIN_URL: `${stackablSite}/login/?login-via=c3RhY2thYmxlLWFwcA=`,
  VERIFY_TOKEN_END_POINT: `${stackablSite}/wp-json/stackabl/auth2/verifytoken/api`,
  USER_INFO_END_POINT: `${stackablSite}/wp-json/stackabl/auth2/validate/api`,
  ERROR_LOG_API_END_POINT: `${stackablSite}/wp-json/api`,
  STACKABL_FOLDER: 'Stackabl',
  FACEBOOK_URL: 'https://www.facebook.com/stackabl',
  TWITTER_URL: 'https://twitter.com/stackabl',
  LINKEDIN_URL:
    'https://www.linkedin.com/company/stackabl/?originalSubdomain=in',
  YOUTUBE_URL:
    'https://www.youtube.com/channel/UCuyt80J-8USxdChGv0Es0mQ/videos',
  INSTAGRAM_URL: 'https://www.instagram.com/stackabl',
};

export const THEME_COLOR = {
  THEME_COLOR_0: 'Blue',
  THEME_COLOR_1: 'RoyalBlue',
  THEME_COLOR_2: 'Purple',
  THEME_COLOR_3: 'LightBlue',
  THEME_COLOR_4: 'Teal',
  THEME_COLOR_5: 'Green',
  THEME_COLOR_6: 'Pink',
  THEME_COLOR_7: 'Red',
  THEME_COLOR_8: 'Orange',
  THEME_COLOR_9: 'Yellow',
};

export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const CMS = {
  WORDPRESS: RegisterPackages.WORDPRESS,
  JOOMLA: RegisterPackages.JOOMLA,
  DRUPAL: RegisterPackages.DRUPAL,
  CUSTOM: RegisterPackages.CUSTOM,
};

export const FLAGS = {
  ALL_FLAGGED: 'All Flagged',
  RED: 'Red',
  ORANGE: 'Orange',
  PURPLE: 'Purple',
  BLUE: 'Blue',
  GREEN: 'Green',
  NONE_SELECTED: 'No Filter',
};
export const getCmsValidnames = (cms: string) => {
  switch (cms.toLowerCase()) {
    case CMS.WORDPRESS.toLowerCase():
      return CMS.WORDPRESS;
    case CMS.JOOMLA.toLowerCase():
      return CMS.JOOMLA;
    case CMS.CUSTOM.toLowerCase():
      return CMS.CUSTOM;
    case CMS.DRUPAL.toLowerCase():
      return CMS.DRUPAL;
    default:
      return CMS.WORDPRESS;
  }
};

export const getCmsenumType = (cms: string) => {
  switch (cms.toLowerCase()) {
    case CMS.WORDPRESS.toLowerCase():
      return RegisterPackages.WORDPRESS;
    case CMS.JOOMLA.toLowerCase():
      return RegisterPackages.JOOMLA;
    case CMS.DRUPAL.toLowerCase():
      return RegisterPackages.DRUPAL;
    case CMS.CUSTOM:
      return RegisterPackages.CUSTOM;
    default:
      return RegisterPackages.WORDPRESS;
  }
};

export const SearchFilter = {
  LOCATION: 'LOCATION',
  PROJECT: CMS.JOOMLA || CMS.WORDPRESS || CMS.DRUPAL || CMS.CUSTOM,
};
export const MapScreenToCode: { [key: string]: string } = {
  demo: 'DE',
  splash: 'SP',
  startup: 'ST',
  download: 'DO',
  restart: 'RE',
  login: 'LO',
  error: 'ER',
  settings_permisision: 'SN',
  update: 'UP',
  logout: 'LT',
  all_projects: 'AL',
  create_new_project: 'CE',
  project_download: 'PR',
  empty_project: 'EM',
  project_settings: 'PR',
  setting_up_site: 'SE',
  loader: 'LR',
  settings: 'SS',
  git_settings: 'GI',
  import_database: 'IM',
  website_cloning: 'WE',
  help_center: 'HE',
};

export const convertFormatedDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
export default env_variable;
