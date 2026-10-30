type Account = { name?: string; email?: string; role?: string; status?: string };

export function removesActiveAdmin(before: Account, change: Account): boolean {
  const after = { ...before, ...change };
  return before.role === 'admin' && before.status === 'active' &&
    (after.role !== 'admin' || after.status !== 'active');
}

export function validateAccountInput(data: Record<string, unknown>): void {
  const protectedFields = ['sessions', 'hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'enableAPIKey', 'apiKey', 'loginAttempts', 'lockUntil'];
  if (protectedFields.some(key => Object.hasOwn(data, key))) throw new Error('Credential internals cannot be supplied');
  if (data.password !== undefined && (typeof data.password !== 'string' || data.password.length < 16 || data.password.length > 256)) {
    throw new Error('Use a password between 16 and 256 characters');
  }
}

export function accountSnapshot(account: Account) {
  return { name: account.name, email: account.email, role: account.role, status: account.status };
}
