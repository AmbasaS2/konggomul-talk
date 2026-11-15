/*
 * Konggomul Talk server-file room storage (experimental).
 * Uses only SillyTavern's built-in /api/files endpoints. No browser-local
 * storage, server plugin, or direct filesystem access is required.
 * All paths are per-user because the core files endpoint uses request.user.
 */
export const ROOM_FILE_FORMAT = 'konggomul-room-snapshot-v1';
export const ROOM_INDEX_FORMAT = 'konggomul-room-index-v1';
export const ROOM_BACKUP_FORMAT = 'konggomul-settings-legacy-backup-v1';
export const ROOM_INDEX_PATH = '/user/files/konggomul-room-index-v1.json';

// The built-in file API rejects Hangul filenames. Use a stable ASCII slug
// where one exists, and keep the exact character name in index labels and JSON.
function readableOwnerSlug(ownerKey) {
  if (ownerKey === '__konggomul_guest_ooc__') return 'guest-talk';
  if (ownerKey === '__konggomul_group_talk__') return 'group-talk';
  return String(ownerKey).replace(/\.(png|jpe?g|webp|gif)$/i, '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 55) || 'character';
}

function keyHash(value) {
  const str = String(value);
  let a = 0x811c9dc5;
  let b = 0x85ebca6b;
  for (const point of str) {
    const number = point.codePointAt(0);
    a = Math.imul(a ^ number, 0x01000193) >>> 0;
    b = Math.imul(b ^ (number & 65535), 0x27d4eb2d) >>> 0;
    b = Math.imul(b ^ (number >>> 16), 0x27d4eb2d) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

export function legacyRoomFilePath(ownerKey) {
  const key = String(ownerKey || '');
  if (!key) throw new Error('Missing room owner key');
  return '/user/files/konggomul-room-' + keyHash(key) + '.json';
}

export function roomFilePath(ownerKey) {
  const key = String(ownerKey || '');
  if (!key) throw new Error('Missing room owner key');
  return '/user/files/konggomul-room-' + readableOwnerSlug(key) + '-' + keyHash(key) + '.json';
}

function apiHeaders(context) {
  const headers = context?.getRequestHeaders?.();
  if (!headers) throw new Error('SillyTavern request headers are unavailable');
  return headers;
}

async function postJson(url, body, context) {
  const response = await fetch(url, {
    method: 'POST',
    headers: apiHeaders(context),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Room file request failed (' + response.status + ', ' + url + ')');
  return response.json();
}

async function fileExists(path, context) {
  const result = await postJson('/api/files/verify', { urls: [path] }, context);
  return result && result[path] === true;
}

async function fileDelete(path, context) {
  if (!/^\/user\/files\/konggomul-[A-Za-z0-9_-]+\.json$/.test(path)) {
    throw new Error('Invalid Konggomul file deletion path');
  }
  if (!await fileExists(path, context)) return false;
  const response = await fetch('/api/files/delete', {
    method: 'POST', headers: apiHeaders(context),
    body: JSON.stringify({ path }), cache: 'no-store',
  });
  if (!response.ok) throw new Error('Could not delete room file (' + response.status + ', ' + path + ')');
  if (await fileExists(path, context)) throw new Error('Room file still exists after deletion: ' + path);
  return true;
}

async function fileRead(path, context) {
  if (!await fileExists(path, context)) return null;
  const result = await fetch(path, { method: 'GET', cache: 'no-store', headers: apiHeaders(context) });
  if (!result.ok) throw new Error('Could not read stored room data (' + result.status + ')');
  let parsed;
  try { parsed = await result.json(); }
  catch { throw new Error('Stored room data is not valid JSON: ' + path); }
  return parsed;
}

function jsonEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function toBase64(value) {
  const json = JSON.stringify(value);
  if (typeof json !== 'string') throw new Error('Cannot serialize room data');
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Could not encode room data'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const comma = dataUrl.indexOf(',');
      if (comma < 0) return reject(new Error('Invalid encoded room file'));
      resolve(dataUrl.slice(comma + 1));
    };
    reader.readAsDataURL(new Blob([json], { type: 'application/json' }));
  });
}

async function fileWrite(path, value, context) {
  const filename = path.split('/').at(-1);
  if (!/^konggomul-[A-Za-z0-9_-]+\.json$/.test(filename)) throw new Error('Invalid Konggomul storage filename');
  const saved = await postJson('/api/files/upload', { name: filename, data: await toBase64(value) }, context);
  if (saved?.path !== path) throw new Error('Room file was saved to an unexpected location');
  const verified = await fileRead(path, context);
  if (!jsonEquals(value, verified)) throw new Error('Saved room data failed read-back verification');
  return path;
}

function validateIndex(index) {
  if (!index || index.format !== ROOM_INDEX_FORMAT || !Array.isArray(index.keys) ||
      index.keys.some(key => typeof key !== 'string' || !key) ||
      new Set(index.keys).size !== index.keys.length ||
      (index.pendingDeletes !== undefined && (!Array.isArray(index.pendingDeletes) ||
        index.pendingDeletes.some(key => typeof key !== 'string' || !key) ||
        new Set(index.pendingDeletes).size !== index.pendingDeletes.length ||
        index.pendingDeletes.some(key => index.keys.includes(key))))) {
    throw new Error('Invalid Konggomul room storage index');
  }
  return {
    format: ROOM_INDEX_FORMAT,
    keys: [...index.keys],
    pendingDeletes: Array.isArray(index.pendingDeletes) ? [...index.pendingDeletes] : [],
    labels: Object.fromEntries(index.keys.map(key => [key, String(index.labels?.[key] || key).slice(0, 160)])),
    legacyBackup: typeof index.legacyBackup === 'string' ? index.legacyBackup : '',
  };
}

export async function readRoomIndex(context) {
  const payload = await fileRead(ROOM_INDEX_PATH, context);
  return payload === null ? null : validateIndex(payload);
}

export async function writeRoomIndex(keys, legacyBackup, context, pendingDeletes = [], labels = {}) {
  const payload = validateIndex({ format: ROOM_INDEX_FORMAT, keys: [...new Set(keys)].sort(),
    legacyBackup, pendingDeletes: [...new Set(pendingDeletes)], labels });
  await fileWrite(ROOM_INDEX_PATH, payload, context);
  return payload;
}

function validateRoomSnapshot(ownerKey, saved) {
  if (saved === null) return null;
  if (saved.format !== ROOM_FILE_FORMAT || saved.ownerKey !== ownerKey ||
      !saved.data || typeof saved.data !== 'object' || Array.isArray(saved.data) ||
      !Number.isSafeInteger(saved.revision) || saved.revision < 1) {
    throw new Error('Invalid or mismatched room snapshot: ' + ownerKey);
  }
  return saved;
}

export async function readRoomSnapshot(ownerKey, context) {
  const named = validateRoomSnapshot(ownerKey, await fileRead(roomFilePath(ownerKey), context));
  const old = validateRoomSnapshot(ownerKey, await fileRead(legacyRoomFilePath(ownerKey), context));
  if (named && old) {
    throw new Error('Duplicate old and new room files for one character; inspect before writing: ' + ownerKey);
  }
  const saved = named || old;
  return saved ? { data: saved.data, revision: saved.revision } : null;
}


export async function deleteRoomSnapshot(ownerKey, context) {
  // Include the obsolete filename in case an earlier migration was interrupted.
  await fileDelete(roomFilePath(ownerKey), context);
  await fileDelete(legacyRoomFilePath(ownerKey), context);
}

export async function deleteRoomIndex(context) {
  await fileDelete(ROOM_INDEX_PATH, context);
}

export async function writeRoomSnapshot(ownerKey, data, expectedRevision, context, ownerLabel = '') {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid room snapshot data');
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('Invalid room snapshot revision');
  const current = await readRoomSnapshot(ownerKey, context);
  if ((current?.revision || 0) !== expectedRevision) {
    throw new Error('Room data changed on another device. Changes were not overwritten: ' + ownerKey);
  }
  const payload = {
    format: ROOM_FILE_FORMAT,
    ownerKey,
    revision: expectedRevision + 1,
    ownerLabel: String(ownerLabel || ownerKey).slice(0, 160),
    savedAt: new Date().toISOString(),
    data,
  };
  // Existing hash-only filenames remain untouched; only newly created owner
  // files receive the new readable ASCII prefix.
  const oldPath = legacyRoomFilePath(ownerKey);
  const path = await fileExists(oldPath, context) ? oldPath : roomFilePath(ownerKey);
  await fileWrite(path, payload, context);
  return payload.revision;
}

export async function backupLegacyRooms(legacyRooms, context) {
  if (!legacyRooms || typeof legacyRooms !== 'object' || Array.isArray(legacyRooms)) {
    throw new Error('Invalid legacy room store');
  }
  const filename = 'konggomul-legacy-' + Date.now() + '-' + Math.floor(Math.random() * 1e9).toString(36) + '.json';
  const path = '/user/files/' + filename;
  const data = { format: ROOM_BACKUP_FORMAT, createdAt: new Date().toISOString(), characterRooms: legacyRooms };
  await fileWrite(path, data, context);
  return path;
}

export async function readLegacyRoomBackup(path, context) {
  if (!/^\/user\/files\/konggomul-legacy-[A-Za-z0-9_-]+\.json$/.test(String(path || ''))) {
    throw new Error('Invalid legacy backup path');
  }
  const payload = await fileRead(path, context);
  if (!payload || payload.format !== ROOM_BACKUP_FORMAT ||
      !payload.characterRooms || typeof payload.characterRooms !== 'object' ||
      Array.isArray(payload.characterRooms)) {
    throw new Error('Legacy room backup is missing or invalid');
  }
  return payload.characterRooms;
}

