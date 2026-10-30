import * as migration_20261030_093751_cms_auth from './20261030_093751_cms_auth';

export const migrations = [
  {
    up: migration_20261030_093751_cms_auth.up,
    down: migration_20261030_093751_cms_auth.down,
    name: '20261030_093751_cms_auth'
  },
];
