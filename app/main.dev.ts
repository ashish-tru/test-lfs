/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import dotenv from 'dotenv';
import logger from '@stackabl/core/shared/logger';
import Constant from '@stackabl/core/shared/constants';
import { Api, Login, GitLogin, AppUpdater } from '@stackabl/core';
import os from 'os';
// import Platform, {
//   currentPlatform,
// } from '@stackabl/core/shared/dependencies/platform';

import MenuBuilder from './menu';

const log = logger.scope('main.dev.ts');
const currentAppVersion = app.getVersion();

process.on('uncaughtException', (err) => {
  log.error(`Uncaught error from main ${err}`);
});

if (process.env.NODE_ENV === 'development') {
  dotenv.config({
    path: path.join(app.getAppPath(), '../configs/development.env'),
  });
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

log.info('SYSTEM INFO', {
  currentAppVersion,
  os: os.type(),
  version: os.release(),
  ram: `${Math.ceil(os.totalmem() / 1073741824)} GB`,
});

const frameType = true;
// if (Platform.Darwin === currentPlatform) {
//   frameType = false;
// }

let mainWindow: BrowserWindow | null = null;

ipcMain.on('notification', (event, data) => {
  if (Notification.isSupported()) {
    const notification = new Notification(data);
    notification.show();
  } else {
    log.info('[main.dev.ts] Notification not Supported');
  }
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  log.info('requestSingleInstanceLock', gotTheLock);
  app.quit();
} else {
  app.on('second-instance', (event, args, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    log.log('In secomnd instance');
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
    log.log(`Args are ${args}`);
    if (args.includes('--protocol-launcher-git')) {
      log.log('Only for git ');
      GitLogin.getInstance().handlePossibleProtocolLauncherArgs(
        args,
        mainWindow
      );
    } else {
      Login.getInstance().handlePossibleProtocolLauncherArgs(args, mainWindow);
    }
  });
}

/**
 * @description required for mac os, as second-instance event will not work in macOS
 */
app.on('will-finish-launching', () => {
  // macOS only

  // code depreciated
  app.allowRendererProcessReuse = false;

  app.on('open-url', (event, url) => {
    event.preventDefault();
    log.log(`Url is ss${url}`);
    if (url.includes('x-stackabl-client')) {
      log.log('Only for git ');
      GitLogin.getInstance().handleAppURL(url, mainWindow);
    } else {
      Login.getInstance().handleAppURL(url, mainWindow);
    }
  });
});

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch(() => {
    // log.warn(err);
  });
};

let macOSForceQuit = false;
ipcMain.on(Constant.event.Quit_APP, (e, arg) => {
  log.info('[main.dev.ts] quit the application', arg);
  if (arg === 'no') {
    // event.sender.send("quit_application_event", { quit: false });
    log.info('[main.dev.ts] quit the application selected no');
    macOSForceQuit = false;
  } else {
    log.info(`[main.dev.ts] Quit application${e}`);
    macOSForceQuit = true;
    if (mainWindow != null) {
      log.info('Calling yes Quit function');
      app.quit();
    }
  }
});

const createWindow = async () => {
  app.setAppUserModelId('io.Stackabl');
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    minHeight: 728,
    minWidth: 1024,
    frame: frameType,
    titleBarStyle: 'hidden',
    webPreferences:
      (process.env.NODE_ENV === 'development' ||
        process.env.E2E_BUILD === 'true') &&
      process.env.ERB_SECURE !== 'true'
        ? {
            nodeIntegration: true,
          }
        : {
            preload: path.join(__dirname, 'dist/renderer.prod.js'),
          },
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  if (process.argv.indexOf('--developerTools') !== -1) {
    mainWindow.webContents.openDevTools();
  }

  // @TODO: Use 'ready-to-show' event
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', async () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('close', function fun(event) {
    event.preventDefault();
    const { isAppUdate } = AppUpdater.getInstance();
    log.info('mainWindow close listener', isAppUdate);
    if (!isAppUdate) {
      if (mainWindow != null) {
        try {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.webContents.send(Constant.event.Quit_APP, { quit: true });
        } catch (e) {
          log.error(`[main.dev.ts] Error while sending requestr ${e}`);
        }
      }
    } else {
      app.quit();
    }
  });

  app.on('before-quit', (event) => {
    log.info('before-quit listener');
    if (process.platform === 'darwin') {
      const { isAppUdate } = AppUpdater.getInstance();
      log.info('isAppUdate ', isAppUdate);
      log.info('macOSForceQuit ', macOSForceQuit);
      if (!isAppUdate && !macOSForceQuit) {
        event.preventDefault();
        if (mainWindow != null) {
          try {
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.webContents.send(Constant.event.Quit_APP, {
              quit: true,
            });
            app.focus();
          } catch (e) {
            log.error(`[main.dev.ts] Error while sending requestr ${e}`);
          }
        }
      } else if (mainWindow != null) {
        mainWindow.removeAllListeners('close');
      }
    } else if (mainWindow != null) {
      mainWindow.removeAllListeners('close');
    }
  });

  mainWindow.on('closed', async () => {
    log.info('main window closed');
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // eslint-disable-next-line
  new Api();
  Login.getInstance();
  GitLogin.getInstance();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', async () => {
  log.info('window-all-closed');
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  //  await quitApplication()
  // if (process.platform !== 'darwin') {
  // app.quit();
  // }
});

if (process.env.E2E_BUILD === 'true') {
  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(createWindow);
} else {
  app.on('ready', createWindow);
}

app.on('activate', () => {
  log.info('mainWindow activate');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
