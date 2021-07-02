import path from 'path';
import NginxService from '../src/index';
import { Helper, HelperProps, HelperRole, Site, SiteState } from '@stackabl/core';
import {currentPlatform, Location} from '@stackabl/core/shared/dependencies'
import fs from 'fs';

describe('Ngnix 1-16', () => {
  let ngnix: NginxService;
  beforeAll(() => {
    const site = new Site({
      id: 'unittestngnix',
      name: 'unittestngnix',
      domain: 'unittestngnix',
      state: SiteState.CREATE,
      adminUser: 'admin',
      adminEmail: 'admin@gmail.com',
      ssl:false,
      adminPassword: 'admin',
    });
    const pathlink = path.join(__dirname,'unittestngnix');
    const location  = new Location(pathlink, pathlink, pathlink);
    const helper:Helper[] = []
    const getHelperByRole = (): Helper => {
      const role: HelperRole = HelperRole.DATABASE
      const helperObj = helper.find((obj) => {
        return obj.role === role;
      });
      if (helperObj) {
        return helperObj;
      }
      throw new Error('service not found');
    };
    const role:(role: HelperRole) => Helper  = getHelperByRole;

    const arg: HelperProps = {
      port: 9000,
      serviceName:'ngnix',
      site,
      location,
      role
    }
    ngnix = new NginxService(arg);
  })
  test('Binary Locations ngnix', () => {
    expect(fs.existsSync(ngnix.bins[currentPlatform].nginx)).toBe(true);
  });
  test('Binary Locations PhpMyAdmin', () => {
    expect(fs.existsSync(ngnix.bins[currentPlatform].phpmyadmin)).toBe(true);
  });
  test('Config Path', () => {
    expect(fs.existsSync(ngnix.configTemplate)).toBe(true);
})
});