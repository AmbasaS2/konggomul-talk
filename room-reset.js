/* Conversation cleanup counters. No message-date deletion is performed. */
export function countRoomData(state) {
  const rooms = Array.isArray(state?.rooms) ? state.rooms : [];
  return {
    rooms: rooms.length,
    messages: rooms.reduce((sum, room) =>
      sum + (Array.isArray(room?.messages) ? room.messages.length : 0), 0),
  };
}
