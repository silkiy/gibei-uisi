import type { CollectionConfig } from 'payload';
import { SettingsAudit } from './SettingsAudit';

export const OrganizationStateAudit: CollectionConfig = { ...SettingsAudit, slug: 'organization-state-audit' };
