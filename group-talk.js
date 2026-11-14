/* Group-only data helpers: no sentence splitting, token-based history or context gate. */
export const GROUP_MEMORY_DEFAULT = 80;
export const GROUP_OUTPUT_DEFAULT = 1000;

function boundedInteger(value, min, max, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.floor(number))) : fallback;
}

export function groupRoomFields(room, memoryDefault = GROUP_MEMORY_DEFAULT) {
  const keys = Array.isArray(room?.groupCharacterKeys) ? room.groupCharacterKeys : [];
  const snapshot = room?.groupSnapshot && typeof room.groupSnapshot === 'object' ? room.groupSnapshot : {};
  return {
    groupCharacterKeys: [...new Set(keys.filter(key => typeof key === 'string' && key.trim()))],
    groupOptions: {
      recentRp: room?.groupOptions?.recentRp === true,
      lorebook: room?.groupOptions?.lorebook === true,
      extensionMemory: room?.groupOptions?.extensionMemory === true,
    },
    groupMemoryMessages: boundedInteger(room?.groupMemoryMessages, 20, 320, boundedInteger(memoryDefault, 20, 320, GROUP_MEMORY_DEFAULT)),
    groupOutputTokens: boundedInteger(room?.groupOutputTokens, 100, 8000, GROUP_OUTPUT_DEFAULT),
    groupSeenContext: String(room?.groupSeenContext || ''),
    groupSnapshot: {
      persona: String(snapshot.persona || ''),
      recent: String(snapshot.recent || ''),
      lorebook: String(snapshot.lorebook || ''),
      extensionMemory: String(snapshot.extensionMemory || ''),
    },
  };
}

export function getGroupHistory(messages, requestedLimit, latestUserText = '') {
  const limit = boundedInteger(requestedLimit, 20, 320, GROUP_MEMORY_DEFAULT);
  const valid = (Array.isArray(messages) ? messages : []).filter(message => {
    if (!message || message.loading || message.error || !String(message.content || '').trim()) return false;
    if (message.role === 'assistant' && !message.speakerKey) return false;
    // Preserve old preview data on disk but exclude accidentally stored transport JSON from prompts.
    if (message.role === 'assistant' && /^\s*\{\s*["'](?:messages|speaker)["']\s*:/u.test(String(message.content))) return false;
    return message.role === 'user' || message.role === 'assistant';
  });
  if (latestUserText && valid.at(-1)?.role === 'user' &&
      String(valid.at(-1).content || '').trim() === String(latestUserText).trim()) valid.pop();
  return valid.slice(-limit);
}

export function extractGroupResponse(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value?.messages) || Array.isArray(value) || Object.hasOwn(value, 'speaker')) return JSON.stringify(value);
  const wrapped = value?.choices?.[0]?.message?.content ?? value?.choices?.[0]?.text
    ?? value?.message?.content ?? value?.data?.content ?? value?.data?.text
    ?? value?.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || '').join('')
    ?? value?.assistantText ?? value?.content ?? value?.text ?? value?.response ?? value?.output;
  return wrapped !== undefined && wrapped !== value ? extractGroupResponse(wrapped) : JSON.stringify(value);
}

export function parseGroupCompletion(raw, participants) {
  const source = extractGroupResponse(raw).replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '').trim();
  const ids = new Map((participants || []).map((person, index) => [String(index + 1), person]));
  const result = [];
  const add = (id, content) => {
    const key = String(id ?? '').trim();
    if (!/^[1-9]\d*$/u.test(key)) return;
    const person = ids.get(key);
    const text = typeof content === 'string' ? content.trim() : '';
    if (!person || !text) return;
    const previous = result.at(-1);
    // Adjacent fragments by one speaker are still one complete speaking turn.
    if (previous?.speakerKey === person.key) previous.text += '\n\n' + text;
    else result.push({ speakerKey: person.key, speakerName: person.name, text });
  };
  const parse = text => {
    try {
      const value = JSON.parse(text);
      return Array.isArray(value) ? value : Array.isArray(value?.messages) ? value.messages : null;
    } catch { return null; }
  };
  const objectStart = source.indexOf('{'), objectEnd = source.lastIndexOf('}');
  const arrayStart = source.indexOf('['), arrayEnd = source.lastIndexOf(']');
  const items = parse(source)
    || (objectStart >= 0 && objectEnd > objectStart ? parse(source.slice(objectStart, objectEnd + 1)) : null)
    || (arrayStart >= 0 && arrayEnd > arrayStart ? parse(source.slice(arrayStart, arrayEnd + 1)) : null);
  if (items) {
    for (const item of items) if (item && typeof item === 'object') add(item.speaker ?? item.id, item.text ?? item.message ?? item.content);
    return result;
  }
  // Salvage complete turns from a truncated container. Braces inside dialogue
  // are characters, not JSON boundaries; preserve order and avoid duplicates.
  const recovered = new Map();
  const stack = [];
  let inString = false, escaped = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{') stack.push(index);
    else if (character === '}' && stack.length) {
      const start = stack.pop();
      try {
        const item = JSON.parse(source.slice(start, index + 1));
        if (Object.hasOwn(item, 'speaker')) recovered.set(start, [item.speaker, item.text ?? item.message ?? item.content]);
      } catch { /* incomplete object */ }
    }
  }
  const completePair = /\{\s*"speaker"\s*:\s*("[1-9]\d*"|[1-9]\d*)\s*,\s*"(?:text|message|content)"\s*:\s*("(?:\\.|[^"\\])*")/gu;
  for (const match of source.matchAll(completePair)) {
    if (recovered.has(match.index)) continue;
    try { recovered.set(match.index, [JSON.parse(match[1]), JSON.parse(match[2])]); } catch { /* no complete string */ }
  }
  for (const [, [id, text]] of [...recovered].sort((a, b) => a[0] - b[0])) add(id, text);
  if (!result.length) {
    const numbered = /(?:^|\n)\s*\[([1-9]\d*)\]\s*:\s*([\s\S]*?)(?=\n\s*\[[1-9]\d*\]\s*:|$)/gu;
    for (const match of source.matchAll(numbered)) add(match[1], match[2]);
  }
  return result;
}
