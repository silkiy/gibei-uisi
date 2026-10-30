type Identity = { id?: number | string; role?: string; status?: string } | null | undefined;

export const bootstrapCapability = Symbol('local-admin-bootstrap');

export function isActiveAdmin(user: Identity): boolean {
  return user?.role === 'admin' && user.status === 'active';
}

export function isActiveUser(user: Identity): boolean {
  return !!user && user.status === 'active' && ['admin', 'media'].includes(user.role || '');
}

export function canCreateAccount(user: Identity, context: unknown): boolean {
  return isActiveAdmin(user) || !!(context && typeof context === 'object' &&
    (context as { [bootstrapCapability]?: boolean })[bootstrapCapability] === true);
}
