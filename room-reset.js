/*
 * Konggomul Talk conversation-reset helpers.
 * Date-only cleanup is intentionally conservative: unknown timestamps survive.
 * Keep UI confirmation and server backups in index.js, not inside this helper.
 */
export const PRE_261115_CUTOFF_MS = Date.parse('2026-11-15T00:00:00+09:00');

function timestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function countRoomData(state) {
  const rooms = Array.isArray(state?.rooms) ? state.rooms : [];
  return {
    rooms: rooms.length,
    messages: rooms.reduce((sum, room) => sum + (Array.isArray(room?.messages) ? room.messages.length : 0), 0),
  };
}

export function stripBefore261115(source, cutoff = PRE_261115_CUTOFF_MS) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('Invalid conversation state for date cleanup');
  }
  if (!Number.isFinite(cutoff) || cutoff <= 0) throw new Error('Invalid date cutoff');

  let removedMessages = 0;
  let removedRooms = 0;
  const kept = [];
  for (const room of Array.isArray(source.rooms) ? source.rooms : []) {
    // Do not infer dates from the text or from an unknown message timestamp.
    const originalMessages = Array.isArray(room?.messages) ? room.messages : [];
    const messages = originalMessages.filter(message => {
      const at = timestamp(message?.at ?? message?.createdAt);
      const remove = at !== null && at < cutoff;
      if (remove) removedMessages++;
      return !remove;
    });
    const created = timestamp(room?.createdAt);
    // A room created before the cutoff with no surviving messages is old data.
    // Keep undated rooms rather than risk discarding newer/unknown content.
    if (created !== null && created < cutoff && messages.length === 0) {
      removedRooms++;
      continue;
    }
    kept.push({ ...room, messages });
  }
  return {
    data: { ...source, rooms: kept },
    removedMessages,
    removedRooms,
  };
}
