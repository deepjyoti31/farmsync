/** Rules for profile pictures; they mirror the `avatars` storage bucket settings. */

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const AVATAR_ACCEPT = Object.keys(EXTENSIONS).join(',');

/** A user-facing error message, or null when the file is acceptable. */
export function validateAvatarFile(file: { type: string; size: number }): string | null {
  if (!EXTENSIONS[file.type]) return 'Please choose a JPG, PNG or WebP image.';
  if (file.size > AVATAR_MAX_BYTES) return 'Images must be 2 MB or smaller.';
  return null;
}

/**
 * Storage path for a new avatar. The first folder must be the user's id:
 * storage policies only allow writes inside that folder. A timestamp in the
 * name avoids stale cached images after a change.
 */
export function avatarPath(userId: string, mimeType: string, now: Date = new Date()): string {
  return `${userId}/avatar-${now.getTime()}.${EXTENSIONS[mimeType] ?? 'img'}`;
}

/** Path inside the avatars bucket for a public URL we issued, or null for other URLs. */
export function avatarPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}
