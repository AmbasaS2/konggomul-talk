/* Group Talk helpers; no changes to existing one-to-one room semantics. */
export const GROUP_MEMORY_DEFAULT = 8000;
export const GROUP_AMOUNTS = Object.freeze({ light: [6, 10], normal: [12, 20], chatty: [20, 30] });
export function groupOptions(raw) {
  return { recentRp: raw?.recentRp === true, lorebook: raw?.lorebook === true, extensionMemory: raw?.extensionMemory === true };
}
export function groupRoomFields(room) {
  const clamp = (v, lo, hi, fallback) => Number.isFinite(Number(v)) ? Math.max(lo, Math.min(hi, Math.floor(Number(v)))) : fallback;
  const keys = Array.isArray(room?.groupCharacterKeys) ? [...new Set(room.groupCharacterKeys.filter(x => typeof x === 'string' && x))] : [];
  const mode = ['light', 'normal', 'chatty', 'custom'].includes(room?.groupAmountMode) ? room.groupAmountMode : 'chatty';
  const min = clamp(room?.groupAmountMin, 1, 100, 20);
  const snapshot = room?.groupSnapshot && typeof room.groupSnapshot === 'object' ? room.groupSnapshot : {};
  return {
    groupCharacterKeys: keys, groupOptions: groupOptions(room?.groupOptions),
    groupMemoryTokens: clamp(room?.groupMemoryTokens, 1000, 64000, GROUP_MEMORY_DEFAULT),
    groupMemoryMode: room?.groupMemoryMode === 'custom' ? 'custom' : 'preset',
    groupAmountMode: mode, groupAmountMin: min, groupAmountMax: clamp(room?.groupAmountMax, min, 100, 30),
    groupSnapshot: {
      persona: String(snapshot.persona || '').slice(0, 16000),
      recent: String(snapshot.recent || '').slice(0, 32000),
      lorebook: String(snapshot.lorebook || '').slice(0, 36000),
      extensionMemory: String(snapshot.extensionMemory || '').slice(0, 6000)
    }
  };
}
export function groupAmount(room) {
  return room?.groupAmountMode === 'custom'
    ? [Number(room.groupAmountMin) || 20, Number(room.groupAmountMax) || 30]
    : GROUP_AMOUNTS[room?.groupAmountMode] || GROUP_AMOUNTS.chatty;
}
export function estimateGroupTokens(text) {
  const str = String(text || '');
  const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(str).length : str.length * 2;
  return Math.ceil(bytes / 2.7);
}
/**
 * Reserve room for recent group history before deciding the output allowance.
 * An inadequate context window returns an explicit failure, never 0 history.
 * This is a request budget, not a change to the stored message history.
 */
export function planGroupRequestBudget({
  contextWindow, fixedTokens, requestedOutputTokens, maxHistoryTokens,
  minimumHistoryTokens = 0, reservedTokens = 512, minimumOutputTokens = 1200
}) {
  const safe = (x, fallback) => Number.isFinite(Number(x)) ? Math.max(0, Math.floor(Number(x))) : fallback;
  const outputTarget = Math.max(100, Math.min(8000, safe(requestedOutputTokens, 3600)));
  const historyCap = safe(maxHistoryTokens, 8000);
  const historyRequired = safe(minimumHistoryTokens, 0);
  const window = safe(contextWindow, 0);
  if (!window) return {
    ok: true, outputTokens: outputTarget, historyTokens: historyCap, constrained: false
  };
  const available = window - safe(fixedTokens, 0) - safe(reservedTokens, 512);
  const outputFloor = Math.min(outputTarget, Math.max(100, safe(minimumOutputTokens, 1200)));
  if (historyRequired > historyCap || available < outputFloor + historyRequired) {
    return {
      ok: false, reason: 'context-too-small', availableTokens: available,
      requiredTokens: outputFloor + historyRequired
    };
  }
  const outputTokens = Math.min(outputTarget, available - historyRequired);
  const historyTokens = Math.min(historyCap, Math.max(0, available - outputTokens));
  return {
    ok: true, outputTokens, historyTokens,
    constrained: outputTokens < outputTarget || historyTokens < historyCap
  };
}

export async function groupHistoryWithinBudget(messages, budget, format, count) {
  const list = (Array.isArray(messages) ? messages : []).filter(m => m && !m.loading && !m.error && String(m.content || '').trim());
  const limit = Math.max(0, Number(budget) || 0);
  if (!limit || !list.length) return [];
  let low = 0, high = list.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const text = list.slice(-mid).map(format).join('\n');
    let tokens;
    try { tokens = Number(await count(text)); } catch { tokens = NaN; }
    if (!Number.isFinite(tokens)) tokens = estimateGroupTokens(text);
    if (tokens <= limit) low = mid;
    else high = mid - 1;
  }
  return low ? list.slice(-low) : [];
}
function splitBubble(text) {
  const paragraphs = String(text || '').trim().split(/\n+/).filter(Boolean);
  const output = [];
  for (const p of paragraphs) {
    let part = '', sentences = 0;
    for (const s of p.split(/(?<=[.!?。！？])\s+(?=\S)/u).filter(Boolean)) {
      if (part && (sentences >= 2 || part.length + s.length > 350)) {
        output.push(part); part = ''; sentences = 0;
      }
      part = part ? part + ' ' + s : s;
      sentences++;
    }
    if (part) output.push(part);
  }
  return output.length ? output : [String(text || '').trim()];
}
export function parseGroupCompletion(raw, participants, limit = 100) {
  const text = String(raw || '').trim();
  const ids = new Map(participants.map((p,i) => [String(i+1), p]));
  const names = new Map(participants.map(p => [String(p.name).trim().toLowerCase(),p]));
  const parse = s => { try { const x = JSON.parse(s); return Array.isArray(x) ? x : Array.isArray(x?.messages) ? x.messages : null; } catch { return null; } };
  const objStart = text.indexOf('{'), objEnd = text.lastIndexOf('}');
  const arrStart = text.indexOf('['), arrEnd = text.lastIndexOf(']');
  const items = parse(text) || (objStart >= 0 && objEnd > objStart ? parse(text.slice(objStart, objEnd+1)) : null)
    || (arrStart >= 0 && arrEnd > arrStart ? parse(text.slice(arrStart, arrEnd+1)) : null);
  const output = [];
  const add = (id, value) => {
    const speaker = String(id ?? '').trim();
    // USER is an input-only identity, never a model-generated speaker.
    if (/^(?:user|\{\{user\}\}|human|0)$/iu.test(speaker)) return;
    const who = ids.get(speaker) || names.get(speaker.toLowerCase());
    if (!who || !String(value || '').trim()) return;
    for (const bubble of splitBubble(value)) {
      if (output.length >= limit) break;
      output.push({ speakerKey: who.key, speakerName: who.name, text: bubble.trim() });
    }
  };
  if (items) {
    for (const x of items) {
      if (x && typeof x === 'object') add(x.speaker ?? x.id ?? x.character, x.text ?? x.message ?? x.content);
      if (output.length >= limit) break;
    }
  } else {
    // A provider can stop in the middle of the outer JSON object. Salvage the
    // *complete* speaker/text strings without attributing the raw JSON to speaker 1.
    // The format requested in buildGroupTalkSystemPrompt is speaker then text.
    const pairs = /\{\s*"speaker"\s*:\s*("(?:\\.|[^"\\])*"|-?\d+)\s*,\s*"(?:text|message|content)"\s*:\s*("(?:\\.|[^"\\])*")/gu;
    for (const match of text.matchAll(pairs)) {
      if (output.length >= limit) break;
      let who = match[1];
      let value = match[2];
      try {
        if (who.startsWith('"')) who = JSON.parse(who);
        value = JSON.parse(value);
      } catch {
        // Some models put literal newlines inside their quoted message strings.
        // Repair that *single string*, not the whole response.
        try { value = JSON.parse(match[2].replace(/\r?\n/g, '\\n')); }
        catch { continue; }
      }
      add(who, value);
    }
    if (!output.length) {
      // Also accept line-oriented numbered answers when JSON was not produced.
      for (const line of text.split(/\n+/)) {
        const match = line.match(/^\s*\[?(\d+)\]?\s*[:：|.)-]\s*(.+)$/u);
        if (match) add(match[1], match[2]);
        if (output.length >= limit) break;
      }
    }
  }
  // Never show raw JSON or assign an unparsed batch to the first participant.
  // An empty result becomes a visible *error* through the Group Talk caller.
  return output;
}
