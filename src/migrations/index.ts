import * as migration_20261030_093751_cms_auth from './20261030_093751_cms_auth';
import * as migration_20261030_153435_account_controls from './20261030_153435_account_controls';
import * as migration_20261030_180255_article_drafts from './20261030_180255_article_drafts';
import * as migration_20261031_021413_private_media from './20261031_021413_private_media';
import * as migration_20261031_030604_editorial_submissions from './20261031_030604_editorial_submissions';
import * as migration_20261031_061247_public_relations from './20261031_061247_public_relations';
import * as migration_20261031_063346_working_revision_guard from './20261031_063346_working_revision_guard';
import * as migration_20261031_070403_safe_deletion from './20261031_070403_safe_deletion';
import * as migration_20261031_112626_pages_editorial from './20261031_112626_pages_editorial';

export const migrations = [
  {
    up: migration_20261030_093751_cms_auth.up,
    down: migration_20261030_093751_cms_auth.down,
    name: '20261030_093751_cms_auth',
  },
  {
    up: migration_20261030_153435_account_controls.up,
    down: migration_20261030_153435_account_controls.down,
    name: '20261030_153435_account_controls',
  },
  {
    up: migration_20261030_180255_article_drafts.up,
    down: migration_20261030_180255_article_drafts.down,
    name: '20261030_180255_article_drafts',
  },
  {
    up: migration_20261031_021413_private_media.up,
    down: migration_20261031_021413_private_media.down,
    name: '20261031_021413_private_media',
  },
  {
    up: migration_20261031_030604_editorial_submissions.up,
    down: migration_20261031_030604_editorial_submissions.down,
    name: '20261031_030604_editorial_submissions',
  },
  {
    up: migration_20261031_061247_public_relations.up,
    down: migration_20261031_061247_public_relations.down,
    name: '20261031_061247_public_relations',
  },
  {
    up: migration_20261031_063346_working_revision_guard.up,
    down: migration_20261031_063346_working_revision_guard.down,
    name: '20261031_063346_working_revision_guard',
  },
  {
    up: migration_20261031_070403_safe_deletion.up,
    down: migration_20261031_070403_safe_deletion.down,
    name: '20261031_070403_safe_deletion',
  },
  {
    up: migration_20261031_112626_pages_editorial.up,
    down: migration_20261031_112626_pages_editorial.down,
    name: '20261031_112626_pages_editorial'
  },
];
