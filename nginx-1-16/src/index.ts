/* eslint-disable class-methods-use-this */
/* eslint-disable import/no-unresolved */
import path from 'path';
import slash from 'slash';
import fsExtra from 'fs-extra';
import { Helper, HelperProps, HelperRole } from '@stackabl/core';
import { Platform } from '@stackabl/core/shared/dependencies';
import logger from '@stackabl/core/shared/logger';
import { app } from 'electron';

const log = logger.scope('Nginx');
class NginxService extends Helper {
  name: string;

  version: string;

  role: HelperRole;

  constructor(arg: HelperProps) {
    super(arg);
    log.info('NginxService init');
    this.name = 'nginx';
    this.version = '1.16';
    this.role = HelperRole.HTTP;
  }

  get configTemplate() {
    return path.join(
      app.getAppPath(),
      process.env.PACKAGE || '',
      `${this.name}-${this.version.replace(/\./gi, '-')}`,
      'conf'
    );
  }

  get bins() {
    return {
      [this.platform.Darwin]: {
        nginx: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin',
          'darwin',
          'nginx'
        ),
        phpmyadmin: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin'
        ),
      },
      [this.platform.Win32]: {
        nginx: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin',
          'win32',
          'nginx.exe'
        ),
        phpmyadmin: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin'
        ),
      },
      [this.platform.Win32x64]: {
        nginx: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin',
          'win32'
        ),
        phpmyadmin: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin'
        ),
      },
      [this.platform.Linux]: {
        nginx: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin',
          'linux',
          'sbin',
          'nginx'
        ),
        phpmyadmin: path.join(
          app.getAppPath(),
          process.env.PACKAGE || '',
          `${this.name}-${this.version.replace(/\./gi, '-')}`,
          'bin'
        ),
      },
    };
  }

  async preProvision() {
    try {
      await fsExtra.ensureDir(path.join(this.location.runPath, 'logs'));
      await fsExtra.ensureDir(path.join(this.location.runPath, 'temp'));
      await fsExtra.ensureDir(path.join(this.location.logs, this.name));
      return true;
    } catch (e) {
      const err = e;
      throw err;
    }
  }

  get configVariables() {
    let fastcgiServers: Array<string> = [];
    let system: { [k: string]: boolean } = { unix: false };
    try {
      if (
        this.currentPlatform === this.platform.Win32 ||
        this.currentPlatform === this.platform.Win32x64
      ) {
        system = { windows: true };
      }

      const phpService = this.getHelperByRole(HelperRole.SCRIPT);
      fastcgiServers = [`"unix:${phpService.socket}"`];

      if (
        this.currentPlatform === Platform.Win32 ||
        this.currentPlatform === Platform.Win32x64
      ) {
        const phpPort = this.getHelperByRole(HelperRole.SCRIPT).port;
        fastcgiServers = [];
        fastcgiServers.push(`127.0.0.1:${phpPort}`);
      }
      return {
        logs: {
          errorLog: slash(
            path.join(this.location.logs, this.name, 'error.log')
          ),
        },
        fastcgi_servers: fastcgiServers,
        root: slash(this.location.code),
        port: this.port,
        os: system,
        phpmyadmin: slash(this.bins[this.currentPlatform].phpmyadmin),
      };
    } catch (e) {
      const err = e;
      throw err;
    }
  }

  provision() {
    return [
      {
        name: 'nginx',
        binPath: this.bins[this.currentPlatform].nginx,
        // binPath:
        //   '/Applications/Local 2.app/Contents/Resources/extraResources/lightning-services/nginx-1.16.0+3/bin/darwin/sbin',
        args: [
          '-g',
          'daemon off;',
          '-c',
          path.join(this.location.config, `nginx.conf`),
          // '/Users/mac/Downloads/wemp3/nginx/conf/nginx.conf',
          '-p',
          // '/Users/mac/Library/Application Support/Local/run/HS8h8U-J1/nginx/'
          this.location.runPath,
        ],
      },
    ];
  }

  async postProvision() {
    try {
      await fsExtra.ensureDir(this.location.logs);
      return true;
    } catch (e) {
      const err = e;
      throw err;
    }
  }
}

export default NginxService;
