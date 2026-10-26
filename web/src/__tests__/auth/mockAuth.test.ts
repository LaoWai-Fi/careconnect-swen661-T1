import {
  signUp,
  signIn,
  signOut,
  getSession,
  persistSession,
  clearSession,
} from '../../auth/mockAuth';

describe('mockAuth', () => {
  it('creates an account and normalises the name and email', async () => {
    const result = await signUp('  Joyce Adeyemi ', 'Joyce@Example.COM', 'demo');
    expect(result.error).toBeUndefined();
    expect(result.user).toMatchObject({ name: 'Joyce Adeyemi', email: 'joyce@example.com' });
  });

  it('rejects a duplicate email regardless of letter case', async () => {
    await signUp('Joyce', 'joyce@example.com', 'demo');
    const duplicate = await signUp('Another Joyce', 'JOYCE@example.com', 'demo');
    expect(duplicate.user).toBeUndefined();
    expect(duplicate.error).toMatch(/already exists/i);
  });

  it('signs in an existing account and rejects an unknown email', async () => {
    await signUp('Joyce', 'joyce@example.com', 'demo');
    const ok = await signIn(' Joyce@Example.com ', 'anything');
    expect(ok.user?.email).toBe('joyce@example.com');
    const missing = await signIn('nobody@example.com', 'demo');
    expect(missing.error).toMatch(/sign up first/i);
  });

  it('treats a corrupt stored user list as empty', async () => {
    localStorage.setItem('careconnect_users', 'not json');
    const result = await signIn('joyce@example.com', 'demo');
    expect(result.error).toBeDefined();
  });

  it('persists, reads and clears the session', () => {
    expect(getSession()).toBeNull();
    persistSession({ user: { id: 'u1', name: 'Joyce', email: 'joyce@example.com' } });
    expect(getSession()?.user.name).toBe('Joyce');
    clearSession();
    expect(getSession()).toBeNull();
  });

  it('returns no session when the stored value is corrupt', () => {
    localStorage.setItem('careconnect_session', '{broken');
    expect(getSession()).toBeNull();
  });

  it('signOut removes the session', () => {
    persistSession({ user: { id: 'u1', name: 'Joyce', email: 'joyce@example.com' } });
    signOut();
    expect(getSession()).toBeNull();
  });
});
