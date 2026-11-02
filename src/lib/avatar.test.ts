import { describe, expect, it } from 'vitest';
import { avatarPath, avatarPathFromUrl, validateAvatarFile } from './avatar';

describe('validateAvatarFile', () => {
  it('accepts small JPG, PNG and WebP images', () => {
    expect(validateAvatarFile({ type: 'image/jpeg', size: 500_000 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/png', size: 2 * 1024 * 1024 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/webp', size: 1 })).toBeNull();
  });

  it('rejects other types and files over 2 MB', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: 1000 })).toMatch(/JPG, PNG or WebP/);
    expect(validateAvatarFile({ type: 'application/pdf', size: 1000 })).toMatch(/JPG, PNG or WebP/);
    expect(validateAvatarFile({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toMatch(/2 MB/);
  });
});

describe('avatarPath', () => {
  it('puts the file in the user folder with a unique name', () => {
    expect(avatarPath('user-1', 'image/png', new Date(1_700_000_000_000))).toBe('user-1/avatar-1700000000000.png');
  });
});

describe('avatarPathFromUrl', () => {
  it('extracts the object path from a public avatar URL', () => {
    expect(
      avatarPathFromUrl('https://abc.supabase.co/storage/v1/object/public/avatars/user-1/avatar-1.png?t=1'),
    ).toBe('user-1/avatar-1.png');
  });

  it('ignores URLs that are not in the avatars bucket', () => {
    expect(avatarPathFromUrl('https://example.com/me.png')).toBeNull();
    expect(avatarPathFromUrl(null)).toBeNull();
  });
});
