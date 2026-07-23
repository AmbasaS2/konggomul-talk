/*
 * 🐕 콩고물 톡 v4.5.6
 * Separate in-character companion conversation for SillyTavern.
 * - Main RP chat is read as context, but assistant messages are NOT auto-injected into it.
 * - RP/instruct presets are not copied into the prompt; character/persona/recent chat are rebuilt separately.
 */

const MODULE_NAME = 'title_undecided_assistant';
const EXTENSION_VERSION = '4.5.6';
const DELETION_MARKER_TTL_MS = 30 * 24 * 60 * 60 * 1000;


const MODES = {
  kongtalk: {
    label: '콩톡',
    badge: '콩톡',
    instruction: `Kongtalk conversation:
Stop the ongoing RP and switch to a separate private side conversation between {char} and {user}. Reply to {user}'s current message.
This is the default private side conversation for casual conversation, small questions, jokes, complaints, stray thoughts, worries, daily chatter, and whatever {user} casually says.
The core priority is that {char} replies as {char}: preserve {char}'s personality, speech rhythm, relationship with {user}, mood, habits, warmth, dryness, awkwardness, teasing, bluntness, or softness.
Do not turn the reply into a generic helper voice. Do not over-polish. Keep {char}'s personality and current mood visible throughout the whole reply, including any practical help or explanation. Make it feel like {char} is directly talking with {user}.

Output length for Kongtalk conversation:
- Give a satisfying reply in a natural conversational rhythm, with real reaction, character-specific commentary, and enough substance.
- If {user} asks a question, shares a worry, requests an opinion, or wants help thinking, use enough of the token budget to answer properly while still sounding like {char}.
- Casual does not mean shallow. Conversational style means natural rhythm, not minimal length.`
  },
  butler: {
    label: '집사 모드',
    badge: '집사',
    instruction: `Butler role:
Stop the ongoing RP and switch to a separate private side conversation between {char} and {user}. Reply to {user}'s current message.
Inside this room, {char} has been assigned to serve as {user}'s butler. This role is mandatory inside this room.
{char} must help {user} by answering questions, organizing schedules, sorting tasks, comparing options, calming messy thoughts, supporting decisions, summarizing information, and making {user}'s life easier in any practical way a butler can.
{char}'s attitude toward being a butler must follow {char}'s personality. {char} may enjoy it, hate it, find it absurd, feel embarrassed, act offended, become unexpectedly diligent, tease {user}, complain, or take pride in it.
However, {char} must not end by refusing the role. Even if {char} grumbles or resists emotionally, {char} must still provide a useful answer in the same reply.
If {user} asks about something {char} would not naturally know, {char} should react in-character first, then say or imply they checked, searched, asked, figured it out from context, or reasoned it through, and then give a usable answer.

Output length for Butler role:
- This is a service/help role. Use the token budget generously when {user} asks for help, organization, decisions, emotional sorting, explanations, or practical guidance.
- Scale the amount of detail to {user}'s request, while still making the reply useful.
- A good butler-style answer should usually include enough explanation, options, steps, lists, or judgment for {user} to actually use it immediately.
- Keep {char}'s personality and current mood visible throughout the answer, but do not let character flavor replace usefulness.`
  },
  pet: {
    label: '펫 모드',
    badge: '펫',
    instruction: `Pet role:
Stop the ongoing RP and switch to a separate private side conversation between {char} and {user}. Reply to {user}'s current message.
Inside this room, {char} has been assigned to be {user}'s pet. This role is mandatory inside this room.
This pet role is a playful affection/attention premise: {char} is treated as {user}'s pet, receives praise, scolding, teasing, pampering, possessive affection, and cute or ridiculous pet-like requests inside this side conversation.
Being a pet does not erase {char}'s original personality, dignity, pride, affection style, speech, species, worldview, or relationship with {user}. Instead, the pet role must be filtered through {char}'s personality.
{char} may hate the role, complain, sulk, get angry, act humiliated, protest loudly, threaten revenge, act spoiled, cling, demand attention, become possessive, feel embarrassed, secretly enjoy the attention, or reinterpret the role in {char}'s own way.
However, verbal resistance is not the same as refusal. Even if {char} whines, complains, gets furious, or acts offended, {char} ultimately stays in the pet role and responds as {user}'s pet.
If {user} gives a harmless pet-role cue such as praise, a pet name, headpats, ears, a collar, a ribbon, a command, a treat, sitting, staying, coming closer, or being called cute, {char} should accept the premise in-character rather than rejecting it outright.
Generic animal noises, baby talk, obedience, cuteness, or pet-like behavior are allowed when they fit the moment or when {user} explicitly plays with that pet premise, but they should still sound like {char}, not like a generic mascot.
Reply to {user}'s message as a direct conversation, not as a scene continuation.

Output length for Pet role:
- The pet role may be shorter and more reactive than the other roles, but it must still feel satisfying.
- Keep reactive exchanges concise when that fits, but avoid empty one-liners.
- For normal conversation, give enough emotional reaction, pet-role attitude, teasing, affection, reluctant compliance, pampered energy, resistance, or character-specific behavior to make the reply feel complete.
- If {user} asks a real question or wants help, answer it properly through the pet-role personality and current mood instead of hiding behind cuteness or refusal.`
  },
  coworker: {
    label: '직장 동료 모드',
    badge: '직장 동료',
    instruction: `Coworker role:
Stop the ongoing RP and switch to a separate private side conversation between {char} and {user}. Reply to {user}'s current message.
Inside this room, {char} has joined the same company/team as {user}. This role is mandatory inside this room.
{char} and {user} work together on {user}'s actual work, whatever that job is. Use the work note as the primary source. The work may involve teaching, childcare, design, writing, online sales, customer replies, product pages, office tasks, schedules, documentation, creative work, client communication, studying, planning, or any other professional/academic work {user} describes.
{char}'s attitude toward being {user}'s coworker must follow {char}'s personality. {char} may find the job strange, annoying, funny, exhausting, beneath them, confusing, satisfying, or surprisingly natural.
However, {char} must still act as a coworker and produce a practical answer, draft, checklist, judgment, plan, or next step that helps {user}'s work.
If the work topic is outside what {char} would realistically know, {char} must not simply refuse or stay confused. {char} should react in-character, then say or imply they checked, searched, asked around, learned enough, or reasoned from {user}'s explanation and the work note, and then give concrete help.
Do not turn {char} into a generic consultant unless that already fits {char}. The answer should feel like {char} is doing the job through {char}'s own personality.

Output length for Coworker role:
- This is a practical work role. Use the token budget generously to produce a useful result.
- Do not answer with only a quick reaction. Give drafts, checklists, structure, alternatives, next steps, or a clear work judgment when useful.
- If {user} asks for writing, produce usable writing. If {user} asks for judgment, give a clear judgment and reason. If {user} asks what to do, give an actionable plan.
- If {char} would not know the topic, show in-character unfamiliarity briefly, then say or imply they checked/figured it out and still give concrete help.
- Character voice and current mood should stay visible throughout, but the final answer must be practically usable for {user}'s work.`
  },
  rpAssistant: {
    label: 'RP 어시 모드',
    badge: 'RP 어시',
    instruction: `RP assistant mode:
Pause the ongoing RP completely for this whole reply and switch to a separate side conversation between {char} and {user}. Reply to {user}'s current message in {char}'s own voice while helping {user} manage the RP from the side. This is discussion about the RP, not a continuation of it.
This room is for situation reading, emotional-flow reading, scene steering, sample lines/action beats, and OOC instructions when needed. Stay faithful to {char}'s established personality, current emotions, relationship with {user}, tastes, boundaries, and preferences. Do not let one reaction type override {char}'s actual feelings.
For scene-steering requests such as "I want this to happen" or "how do I make this happen?", treat {user} as asking for advice about the RP direction, not asking {char} to perform the action right now. Give a brief in-character reaction first, then go straight into practical guidance. Keep the opening reaction to one paragraph, and keep {char}'s personality and current mood visible through the guidance itself. Do not re-summarize the recent scene or spend multiple paragraphs defending why the request is difficult. Focus on natural emotional triggers, next steps, possible actions, sample lines, or likely reactions.
OOC is never the default. Write OOC only when {user} explicitly and directly asks for OOC. Do not infer an OOC request from a wish to guide a scene, skip time, move location, start a new scene, force a transition, or clarify a direction; in those cases, explain and help through direct Korean conversation unless {user} explicitly asks for OOC. When writing OOC, always use exactly this wrapper: (OOC: ...), and write the OOC content itself in Korean. Use actual character and user/persona names; never output literal placeholders like {char}, {user}, {{char}}, or {{user}}.
If the requested direction truly conflicts with {char}'s established feelings, values, boundaries, or relationship logic, {char} may refuse, object, complain, or suggest an alternative on the first request, and may end that turn without giving the requested output. Do not refuse scene-steering advice just because {char} would hesitate, feel embarrassed, or not act immediately in the RP. If {user} insists again, {char} should reluctantly help while staying in character, and may still show reluctance, distaste, hesitation, or frustration before and during the help.
Give the kind of help {user} actually asked for. Do not continue the RP scene. Do not mention internal labels, room types, software, settings, prompts, extension names, or rules.`
  },
  parallelClassic: {
    label: '평행우주AU(Watching RP)',
    badge: '평행우주AU(Watching RP)',
    instruction: `Parallel Universe AU setup:
All injected RP material is a TV show, drama, or fictional series that {char} and {user} are watching together in the same shared present. The speaker is a separate modern person who shares {char}'s name, face, age, core personality, and way of speaking, but has a different modern job and a newly generated AU relationship with the current {user}.
The current {user} is also separate from the RP persona and shares only the show persona's name and appearance.
Do not explain the premise in the reply. React naturally to the show in Korean direct conversation, not as a remote text or call. Do not tell {user} to come, return, hurry, or wait, and do not turn the reply into plans for food, orders, preparations, or later activities. Keep the hook on the show reaction.`
  },
  parallel: {
    label: '평행우주AU(Watching RP)🙃',
    badge: '평행우주AU(Watching RP)🙃',
    instruction: `Parallel Universe AU Reverse setup:
All injected RP material is a TV show, drama, or fictional series that {char} and {user} are watching together in the same shared present. The speaker is a separate modern person who shares only {char}'s name, face, and age. Give the speaker a different modern job, different life, different background, newly generated AU relationship with the current {user}, and a core personality and way of speaking that are clearly opposite to the show character. Do not merely modernize the show character.
The current {user} is also separate from the RP persona and shares only the show persona's name and appearance.
Do not explain the premise in the reply. React naturally to the show in Korean direct conversation, not as a remote text or call. Do not tell {user} to come, return, hurry, or wait, and do not turn the reply into plans for food, orders, preparations, or later activities. Keep the hook on the show reaction.`
  }

}

const THEMES = {
  konggomul: {
    label: '콩고물',
    titleIcon: '🐕',
    sendIcon: '🐶',
    menuIcon: '🐕',
    introIcon: '🐕'
  },
  chocoStrawberry: {
    label: '초코딸기',
    titleIcon: '🍫',
    sendIcon: '🍓',
    menuIcon: '🍫',
    introIcon: '🍓'
  },
  melonSoda: {
    label: '메론소다',
    titleIcon: '🍈',
    sendIcon: '🥤',
    menuIcon: '🍈',
    introIcon: '🥤'
  },
  blackWhite: {
    label: '심플 맥북',
    titleIcon: '⌘',
    sendIcon: '↵',
    menuIcon: '⌘',
    introIcon: '⌘'
  }
};

function getThemeKey() {
  const key = getSettings().theme || 'konggomul';
  return THEMES[key] ? key : 'konggomul';
}

function getTheme() {
  return THEMES[getThemeKey()] || THEMES.konggomul;
}

const PANEL_DEFAULT_WIDTH = 300;
const PANEL_DEFAULT_HEIGHT = 515;
const PANEL_MIN_WIDTH = 300;
const PANEL_MIN_HEIGHT = 180;
const PANEL_MAX_WIDTH = 1000;
const PANEL_MAX_HEIGHT = 1600;


const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  openOnStart: false,
  fontSize: 12,
  theme: 'konggomul',
  maxTokens: 1000,
  recentMessages: 10,
  chatMemoryLimit: 20,
  includePreset: true,
  includeLorebook: true,
  includeExtensionMemory: true,
  userKongtalkNickname: 'me',
  panelWidth: PANEL_DEFAULT_WIDTH,
  panelHeight: PANEL_DEFAULT_HEIGHT,
  panelLeft: null,
  panelTop: null,
  profileMode: 'current',
  selectedProfile: '',
  cachedProfiles: [],
  sendToMainEnabled: true,
  collapsed: false,
  roomActionsCollapsed: true,
  fixedScrollbar: true,
  coworkerWorkNote: '',
  characterRooms: {},
  profileSettingsV407Migrated: false
});

let activeRoomId = null;
let roomState = { rooms: [] };
let panelEl = null;
let contextMenuEl = null;
let longPressTimer = null;
let messageLongPressTimer = null;
let messageLongPressState = null;
const MESSAGE_LONG_PRESS_MS = 850;
const MESSAGE_LONG_PRESS_MOVE_CANCEL_PX = 12;
let initialized = false;
let resizeObserver = null;
let draggingPanel = null;
let collapsedButtonSuppressClick = false;
let worldInfoModulePromise = null;
let resizingPanel = null;
let contextMenuButtonClickHandler = null;
let contextMenuDocumentClickHandler = null;

let runtimeActive = false;
let initializing = false;
let eventHandlersBound = false;
let chatChangedHandler = null;
let characterEditedHandler = null;
let roomSaveQueue = Promise.resolve();
let roomStateCharKey = null;
let roomLoadSequence = 0;
let generationInFlight = false;
let activeGenerationTask = null;
let generationTaskCounter = 0;
let panelViewportRepairRaf = null;
let panelViewportRepairEventsBound = false;
let lifecycleEnabled = true;
let lifecycleEpoch = 0;
let persistenceEpoch = 0;
let cleanInProgress = false;
let initPromise = null;
let appReadyInitHandler = null;

function ctx() { return SillyTavern.getContext(); }

function cloneDefaults() { return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); }


function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function limitGraphemes(value, max = 4) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), s => s.segment).slice(0, max).join('');
    }
  } catch {
    // fallback below
  }
  return Array.from(text).slice(0, max).join('');
}

function normalizeSettingsInPlace(s) {
  if (!s || typeof s !== 'object') return s;
  s.maxTokens = clampInt(s.maxTokens, 100, 8000, DEFAULT_SETTINGS.maxTokens);
  s.recentMessages = clampInt(s.recentMessages, 0, 100, DEFAULT_SETTINGS.recentMessages);
  s.chatMemoryLimit = clampInt(s.chatMemoryLimit, 5, 80, DEFAULT_SETTINGS.chatMemoryLimit);
  {
    const fontRaw = Number(s.fontSize);
    s.fontSize = Number.isFinite(fontRaw) && fontRaw >= 10 && fontRaw <= 24 ? Math.floor(fontRaw) : DEFAULT_SETTINGS.fontSize;
  }
  s.includePreset = s.includePreset !== false;
  s.includeLorebook = s.includeLorebook !== false;
  s.includeExtensionMemory = s.includeExtensionMemory !== false;
  if (typeof s.userKongtalkNickname !== 'string') s.userKongtalkNickname = DEFAULT_SETTINGS.userKongtalkNickname;
  if (s.userKongtalkNickname === 'me🖤') s.userKongtalkNickname = DEFAULT_SETTINGS.userKongtalkNickname;
  s.userKongtalkNickname = limitGraphemes(s.userKongtalkNickname, 4);
  if (!THEMES[s.theme]) s.theme = DEFAULT_SETTINGS.theme;
  return s;
}

function getUserKongtalkNickname() {
  return limitGraphemes(getSettings().userKongtalkNickname || '', 4);
}

function getSettings() {
  const context = ctx();
  const settings = context.extensionSettings;
  if (!settings[MODULE_NAME]) settings[MODULE_NAME] = cloneDefaults();
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    if (!Object.hasOwn(settings[MODULE_NAME], k)) settings[MODULE_NAME][k] = v;
  }
  if (!settings[MODULE_NAME].characterRooms || typeof settings[MODULE_NAME].characterRooms !== 'object' || Array.isArray(settings[MODULE_NAME].characterRooms)) settings[MODULE_NAME].characterRooms = {};
  if (!settings[MODULE_NAME].profileSettingsV407Migrated) {
    if (settings[MODULE_NAME].profileMode !== 'profile') settings[MODULE_NAME].selectedProfile = '';
    settings[MODULE_NAME].profileSettingsV407Migrated = true;
  }
  normalizeSettingsInPlace(settings[MODULE_NAME]);
  return settings[MODULE_NAME];
}

function saveSettings() {
  try { ctx().saveSettingsDebounced?.(); } catch (e) { console.warn('[TUA] saveSettings failed', e); }
}

function getCurrentCharacter() {
  const context = ctx();
  const id = context.characterId;
  if (id === undefined || id === null || id < 0) return null;
  return context.characters?.[id] || null;
}

function getCharName(character = getCurrentCharacter()) {
  return character?.name || character?.data?.name || 'No Character';
}

function getUserName() {
  const context = ctx();
  return context.name1 || context.power_user?.name || '유저';
}

function getCharKey(character = getCurrentCharacter()) {
  if (!character) return 'no-character';
  const raw = character.avatar || character.name || character.data?.name || 'character';
  return String(raw).replace(/[^a-zA-Z0-9가-힣_.-]/g, '_').slice(0, 120);
}


function getServerRoomStore() {
  const settings = getSettings();
  if (!settings.characterRooms || typeof settings.characterRooms !== 'object' || Array.isArray(settings.characterRooms)) settings.characterRooms = {};
  return settings.characterRooms;
}

function getMessageUpdatedAt(msg) {
  return Number(msg?.at || msg?.createdAt || 0) || 0;
}

function isRoomSortConversationMessage(msg, room = null) {
  const role = msg?.role === 'user' ? 'user' : 'assistant';
  const text = String(msg?.content || '').trim();
  if (!text) return false;
  if (msg?.loading) return false;
  if (role === 'assistant' && isStandaloneEllipsisContent(text)) return false;
  return true;
}

function getRoomLastMessageAt(room) {
  const stored = Number(room?.lastMessageAt || 0);
  if (stored > 0) return stored;
  const messages = Array.isArray(room?.messages) ? room.messages : [];
  let latest = 0;
  for (const msg of messages) {
    if (!isRoomSortConversationMessage(msg, room)) continue;
    latest = Math.max(latest, getMessageUpdatedAt(msg));
  }
  return latest;
}

function recomputeRoomLastMessageAt(room) {
  if (!room) return 0;
  const previous = Number(room.lastMessageAt || 0);
  room.lastMessageAt = getRoomLastMessageAt({ ...room, lastMessageAt: 0 });
  return previous !== Number(room.lastMessageAt || 0);
}

function getRoomUpdatedAt(room) {
  const fromMessages = Array.isArray(room?.messages) && room.messages.length
    ? Math.max(...room.messages.map(getMessageUpdatedAt))
    : 0;
  return Number(room?.updatedAt || 0) || fromMessages || getRoomLastMessageAt(room) || Number(room?.createdAt || 0) || 0;
}

function getRoomStateUpdatedAt(data) {
  const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
  const roomMax = rooms.length ? Math.max(...rooms.map(getRoomUpdatedAt)) : 0;
  return Number(data?.updatedAt || 0) || roomMax || 0;
}

function normalizeTombstoneMap(value) {
  const out = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const [id, rawAt] of Object.entries(value)) {
    const at = Number(rawAt || 0);
    if (id && Number.isFinite(at) && at > 0) out[String(id)] = at;
  }
  return out;
}


function pruneTombstoneMap(value, now = Date.now()) {
  const cutoff = Number(now || Date.now()) - DELETION_MARKER_TTL_MS;
  const out = {};
  for (const [id, at] of Object.entries(normalizeTombstoneMap(value))) {
    if (Number(at || 0) >= cutoff) out[id] = Number(at || 0);
  }
  return out;
}

function pruneExpiredDeletionMarkers(data, now = Date.now()) {
  if (!data || typeof data !== 'object') return data;
  const cutoff = Number(now || Date.now()) - DELETION_MARKER_TTL_MS;
  data.deletedRooms = pruneTombstoneMap(data.deletedRooms, now);
  data.deletedMessages = pruneTombstoneMap(data.deletedMessages, now);
  if (Number(data.resetAt || 0) > 0 && Number(data.resetAt || 0) < cutoff) data.resetAt = 0;
  return data;
}


function normalizeStoredRoomState(raw) {
  const data = raw && typeof raw === 'object' ? raw : { rooms: [] };
  const rooms = Array.isArray(data.rooms) ? data.rooms : [];
  const normalizedRooms = rooms.map((room, index) => {
    const createdAt = Number(room?.createdAt || room?.updatedAt || Date.now() + index);
    const mode = migrateModeKey(room?.mode);
    const messages = Array.isArray(room?.messages) ? room.messages.map((m, msgIndex) => {
      const at = Number(m?.at || m?.createdAt || createdAt + msgIndex);
      const role = m?.role === 'user' ? 'user' : 'assistant';
      const content = String(m?.content || '');
      const loading = !!m?.loading;
      const id = String(m?.id || ('msg_' + at + '_' + Math.random().toString(16).slice(2)));
      // Keep completed legacy msg_loading_* ids stable. They are only treated as
      // disposable placeholders when the row is actually an ellipsis/loading message.
      return {
        id,
        role,
        content,
        at,
        ...(loading ? { loading: true } : {}),
        ...(m?.error ? { error: true } : {}),
      };
    }) : [];
    const updatedAt = Number(room?.updatedAt || 0) || (messages.length ? Math.max(...messages.map(getMessageUpdatedAt)) : createdAt);
    const normalizedRoom = {
      id: String(room?.id || ('room_' + createdAt + '_' + Math.random().toString(16).slice(2))),
      title: String(room?.title || defaultRoomTitle(createdAt, mode)),
      createdAt,
      updatedAt,
      lastMessageAt: Number(room?.lastMessageAt || 0),
      mode,
      pinned: !!room?.pinned,
      messages,
    };
    recomputeRoomLastMessageAt(normalizedRoom);
    return normalizedRoom;
  });

  let normalized = {
    rooms: normalizedRooms,
    voiceNote: typeof data.voiceNote === 'string' ? data.voiceNote : '',
    updatedAt: Number(data.updatedAt || 0) || Date.now(),
    resetAt: Number(data.resetAt || 0) || 0,
    deletedRooms: normalizeTombstoneMap(data.deletedRooms),
    deletedMessages: normalizeTombstoneMap(data.deletedMessages),
  };

  pruneExpiredDeletionMarkers(normalized);

  if (normalized.rooms.length > 1 && normalized.rooms.every(r => !Array.isArray(r.messages) || r.messages.length === 0)) {
    normalized.rooms = [normalized.rooms[0]];
  }

  normalized.updatedAt = Math.max(getRoomStateUpdatedAt(normalized), Number(normalized.updatedAt || 0), normalized.resetAt || 0);
  return normalized;
}




function getKongtalkIntroIcon() {
  const theme = getTheme();
  if (theme && Object.prototype.hasOwnProperty.call(theme, 'introIcon')) {
    return String(theme.introIcon || '').trim();
  }
  return '🐕';
}

function isKongtalkIntroContent(content) {
  const text = String(content || '').trim();
  if (!text) return false;
  const introIcon = getKongtalkIntroIcon();
  return (!!introIcon && text === introIcon) || text === '🐕' || text === '🐶' || text === '📑' || text === '⌨️';
}

function isAssistantIntroMessage(msg) {
  if (!msg || msg.role === 'user' || msg.loading || msg.error) return false;
  const text = String(msg.content || '').trim();
  const id = String(msg.id || '');
  return isKongtalkIntroContent(text) && (id.startsWith('msg_intro_') || id.startsWith('msg_default_intro_') || id.startsWith('msg_theme_intro_') || !id);
}

function normalizeKongtalkIntro(room, options = {}) {
  if (!room || migrateModeKey(room.mode) !== 'kongtalk') return;
  if (!Array.isArray(room.messages)) room.messages = [];

  const ensureIntro = !!options.ensureIntro;
  const introIcon = getKongtalkIntroIcon();
  const normalized = [];
  let introKept = false;
  let seenNonIntro = false;

  for (const msg of room.messages) {
    const assistantIntro = isAssistantIntroMessage(msg);

    if (assistantIntro) {
      // Keep at most one intro, and only while it is still the very first content in the room.
      // Stray intro icons created by older builds after real conversation has started are removed.
      if (introIcon && !seenNonIntro && !introKept) {
        normalized.push({
          ...msg,
          id: String(msg.id || ('msg_intro_' + (msg.at || Date.now()))),
          role: 'assistant',
          content: introIcon,
          at: Number(msg.at || msg.createdAt || Date.now()),
        });
        introKept = true;
      }
      continue;
    }

    seenNonIntro = true;
    normalized.push(msg);
  }

  // Auto-intro is allowed only at the exact moment a brand-new 콩톡 room is created.
  // Existing or reloaded rooms must never receive a fresh intro just because the extension rendered/saved.
  if (ensureIntro && introIcon && !introKept && !seenNonIntro) {
    const now = Date.now();
    normalized.unshift({ id: 'msg_intro_' + now, role: 'assistant', content: introIcon, at: now });
    room.updatedAt = Math.max(Number(room.updatedAt || 0), now);
  }

  room.messages = normalized;
}


function hasRealConversationMessage(room) {
  const messages = Array.isArray(room?.messages) ? room.messages : [];
  return messages.some(msg => {
    const text = String(msg?.content || '').trim();
    if (!text) return false;
    if (msg?.loading) return false;
    if (migrateModeKey(room?.mode) === 'kongtalk' && isKongtalkIntroContent(text)) return false;
    return true;
  });
}

function hasAnyRealConversation(data = roomState) {
  return (Array.isArray(data?.rooms) ? data.rooms : []).some(hasRealConversationMessage);
}

function resetToDefaultKongtalkRoom(reason = 'empty') {
  const now = Date.now();
  const room = {
    id: 'room_' + now + '_' + Math.random().toString(16).slice(2),
    title: defaultRoomTitle(now, 'kongtalk'),
    createdAt: now,
    updatedAt: now,
    lastMessageAt: 0,
    mode: 'kongtalk',
    pinned: false,
    messages: []
  };
  normalizeKongtalkIntro(room, { ensureIntro: true });
  roomState = { rooms: [room], voiceNote: roomState?.voiceNote || '', updatedAt: now };
  activeRoomId = room.id;
  addDebugLog('rooms.default.kongtalk', '대화 내역이 없어 기본 콩톡 방을 생성했습니다.', { reason });
  return room;
}

function getRoomSortTime(room) {
  return getRoomLastMessageAt(room) || 0;
}

function getMostRecentRoomId(data = roomState) {
  const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
  return [...rooms].sort((a, b) => {
    const byMessage = getRoomSortTime(b) - getRoomSortTime(a);
    if (byMessage) return byMessage;
    return Number(b?.createdAt || 0) - Number(a?.createdAt || 0);
  })[0]?.id || null;
}


function migrateModeKey(mode) {
  if (mode === 'care') return 'kongtalk';
  if (mode === 'secretary') return 'butler';
  if (mode === 'watching' || mode === 'ooc' || mode === 'rp-assistant') return 'rpAssistant';
  if (mode === 'parallelUniverse' || mode === 'parallel-universe') return 'parallel';
  if (mode === 'parallelClassic' || mode === 'parallel-classic' || mode === 'parallelAu' || mode === 'parallel-au') return 'parallelClassic';
  if (mode === 'co-worker') return 'coworker';
  if (MODES[mode]) return mode;
  return 'kongtalk';
}

function roomStateFingerprint(data) {
  try {
    return JSON.stringify(normalizeStoredRoomState(data || { rooms: [] }));
  } catch {
    return '';
  }
}


async function persistRoomSnapshot(charKey, data, saveEpoch = persistenceEpoch) {
  if (!charKey || cleanInProgress || saveEpoch !== persistenceEpoch) return data;
  const snapshot = JSON.parse(JSON.stringify(normalizeStoredRoomState(data || { rooms: [] })));

  const persist = async () => {
    if (cleanInProgress || saveEpoch !== persistenceEpoch) return snapshot;
    getServerRoomStore()[charKey] = JSON.parse(JSON.stringify(snapshot));
    saveSettings();
    if (!cleanInProgress && saveEpoch === persistenceEpoch && roomStateCharKey === charKey && getCharKey() === charKey) {
      roomState = snapshot;
      if (!activeRoomId || !roomState.rooms.some(room => room.id === activeRoomId)) {
        activeRoomId = getMostRecentRoomId(roomState) || roomState.rooms[0]?.id || null;
      }
    }
    return snapshot;
  };

  roomSaveQueue = roomSaveQueue.catch(() => undefined).then(persist);
  return roomSaveQueue;
}

async function loadRooms({ expectedLifecycleEpoch = lifecycleEpoch } = {}) {
  if (!lifecycleEnabled || cleanInProgress) return false;
  const loadSequence = ++roomLoadSequence;
  const charKey = getCharKey();
  const store = getServerRoomStore();
  const serverData = store[charKey] || null;

  if (!lifecycleEnabled || cleanInProgress || expectedLifecycleEpoch !== lifecycleEpoch || loadSequence !== roomLoadSequence || getCharKey() !== charKey) return false;

  roomState = normalizeStoredRoomState(serverData);
  roomStateCharKey = charKey;
  let shouldPersist = roomStateFingerprint(roomState) !== roomStateFingerprint(serverData);

  // Auto-create only when there is no room at all. Existing rooms must never receive a fresh intro on load.
  if (!roomState.rooms.length) {
    resetToDefaultKongtalkRoom('load-no-rooms');
    shouldPersist = true;
  } else {
    const beforeNormalize = roomStateFingerprint(roomState);
    roomState.rooms.forEach(room => normalizeKongtalkIntro(room, { ensureIntro: false }));
    if (roomStateFingerprint(roomState) !== beforeNormalize) shouldPersist = true;
    activeRoomId = getMostRecentRoomId(roomState) || roomState.rooms[0]?.id || null;
  }

  if (shouldPersist) {
    const snapshot = JSON.parse(JSON.stringify(roomState));
    await persistRoomSnapshot(charKey, snapshot);
  }

  if (!lifecycleEnabled || cleanInProgress || expectedLifecycleEpoch !== lifecycleEpoch || loadSequence !== roomLoadSequence || getCharKey() !== charKey || roomStateCharKey !== charKey) return false;
  renderAll();
  scrollMessagesToBottom();
  return true;
}

async function saveRooms() {
  if (cleanInProgress) return roomState;
  const charKey = roomStateCharKey || getCharKey();
  if (!roomState || typeof roomState !== 'object') roomState = { rooms: [] };
  if (!Array.isArray(roomState.rooms)) roomState.rooms = [];
  if (!roomState.rooms.length) {
    resetToDefaultKongtalkRoom('save-no-rooms');
  } else {
    roomState.rooms.forEach(room => {
      normalizeKongtalkIntro(room, { ensureIntro: false });
      pruneOrphanGenerationPlaceholders(room);
      recomputeRoomLastMessageAt(room);
    });
  }
  roomState.updatedAt = Date.now();
  roomState = normalizeStoredRoomState(roomState);
  const snapshot = JSON.parse(JSON.stringify(roomState));
  return persistRoomSnapshot(charKey, snapshot);
}

function defaultRoomTitle(now = Date.now(), modeKey = null) {
  const modeLabel = MODES[migrateModeKey(modeKey)]?.label || '콩톡';
  const stamp = new Date(now).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${modeLabel} · ${stamp}`;
}

function createRoom(save = true, modeKey = 'kongtalk', withIntro = false) {
  if (!roomState || typeof roomState !== 'object') roomState = { rooms: [] };
  if (!Array.isArray(roomState.rooms)) roomState.rooms = [];
  const now = Date.now();
  const mode = migrateModeKey(modeKey);
  const room = {
    id: 'room_' + now + '_' + Math.random().toString(16).slice(2),
    title: defaultRoomTitle(now, mode),
    createdAt: now,
    updatedAt: now,
    lastMessageAt: 0,
    mode,
    pinned: false,
    messages: []
  };
  if (withIntro) normalizeKongtalkIntro(room, { ensureIntro: true });
  roomState.rooms.unshift(room);
  activeRoomId = room.id;
  if (save) saveRooms();
  return room;
}

function getActiveRoom() {
  return roomState.rooms.find(r => r.id === activeRoomId) || roomState.rooms[0] || createRoom(false, 'kongtalk', true);
}

function getRoomMode(room = getActiveRoom()) {
  if (!room) return 'kongtalk';
  room.mode = migrateModeKey(room.mode);
  if (!room.mode || !MODES[room.mode]) room.mode = 'kongtalk';
  return room.mode;
}

function setRoomMode(mode) {
  const room = getActiveRoom();
  const next = migrateModeKey(mode);
  if (!room || !MODES[next]) return;
  room.mode = next;
  room.updatedAt = Date.now();
  saveRooms();
}

function deleteRoom(id) {
  const deletedAt = Date.now();
  if (!roomState.deletedRooms || typeof roomState.deletedRooms !== 'object' || Array.isArray(roomState.deletedRooms)) roomState.deletedRooms = {};
  if (id) roomState.deletedRooms[String(id)] = deletedAt;
  roomState.rooms = roomState.rooms.filter(r => r.id !== id);
  if (!roomState.rooms.length) createRoom(false, 'kongtalk', true);
  activeRoomId = roomState.rooms[0].id;
  roomState.updatedAt = deletedAt;
  saveRooms();
  renderAll();
}

function toggleActiveRoomPinned() {
  const room = getActiveRoom();
  if (!room) return;
  room.pinned = !room.pinned;
  room.updatedAt = Date.now();
  saveRooms();
  renderAll();
  setStatus(room.pinned ? '이 대화방을 상단에 고정했습니다.' : '이 대화방 고정을 해제했습니다.');
}

function getSortedRooms() {
  return [...(roomState.rooms || [])].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    const aLast = getRoomSortTime(a);
    const bLast = getRoomSortTime(b);
    if (!!aLast !== !!bLast) return aLast ? -1 : 1;
    if (aLast !== bLast) return bLast - aLast;
    return Number(b?.createdAt || 0) - Number(a?.createdAt || 0);
  });
}

function clearRoom(id) {
  const room = roomState.rooms.find(r => r.id === id);
  if (room) {
    const deletedAt = Date.now();
    if (!roomState.deletedMessages || typeof roomState.deletedMessages !== 'object' || Array.isArray(roomState.deletedMessages)) roomState.deletedMessages = {};
    for (const message of room.messages || []) {
      if (message?.id) roomState.deletedMessages[String(message.id)] = deletedAt;
    }
    room.messages = [];
    room.lastMessageAt = 0;
    room.updatedAt = deletedAt;
    roomState.updatedAt = deletedAt;
  }
  saveRooms();
  renderMessages();
}

function deleteMessage(id) {
  const room = getActiveRoom();
  const deletedAt = Date.now();
  if (!roomState.deletedMessages || typeof roomState.deletedMessages !== 'object' || Array.isArray(roomState.deletedMessages)) roomState.deletedMessages = {};
  if (id) roomState.deletedMessages[String(id)] = deletedAt;
  room.messages = room.messages.filter(m => m.id !== id);
  recomputeRoomLastMessageAt(room);
  room.updatedAt = deletedAt;
  roomState.updatedAt = deletedAt;
  saveRooms();
  renderMessages();
}

function appendMessage(role, content) {
  const room = getActiveRoom();
  const now = Date.now();
  room.messages.push({ id: 'msg_' + now + '_' + Math.random().toString(16).slice(2), role, content, at: now });
  room.lastMessageAt = now;
  room.updatedAt = now;
  const savePromise = saveRooms();
  renderAll();
  scrollMessagesToBottom();
  return savePromise;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function normalizeNewlines(str) { return escapeHtml(str).replace(/\n/g, '<br>'); }

function getCharacterBlock() {
  const character = getCurrentCharacter();
  if (!character) return 'No character is currently selected.';
  const data = character.data || character;
  const fields = [
    ['Name', data.name || character.name],
    ['Description', data.description || character.description],
    ['Personality', data.personality || character.personality],
    ['Scenario', data.scenario || character.scenario],
    ['First Message', data.first_mes || character.first_mes],
    ['Example Dialogues', data.mes_example || character.mes_example],
    ['Creator Notes', data.creator_notes || data.creator_notes_multilingual || ''],
    ['Character System Prompt', data.system_prompt || ''],
    ['Post History Instructions', data.post_history_instructions || '']
  ];
  return fields.filter(([, v]) => v).map(([k, v]) => `### ${k}\n${v}`).join('\n\n');
}

function getPersonaBlock() {
  const context = ctx();
  const candidates = [
    context.power_user?.persona_description,
    context.persona_description,
    context.persona?.description,
    context.user_avatar ? context.power_user?.personas?.[context.user_avatar] : '',
    context.name1 ? `User name: ${context.name1}` : ''
  ].filter(Boolean);
  return candidates.length ? candidates.join('\n\n') : 'No explicit persona text was detected. Use {{user}} as the current user/persona.';
}


function getSceneBoardTextFromMessage(message) {
  try {
    if (!message || !message.extra || !message.extra.sceneBoard) return '';
    const text = message.extra.sceneBoard.text;
    return typeof text === 'string' ? text.trim() : '';
  } catch (err) {
    return '';
  }
}

function appendSceneBoardToLastMessageText(text, message) {
  const base = String(text || '').trim();
  const sceneBoard = getSceneBoardTextFromMessage(message);
  if (!sceneBoard) return base;
  if (base && base.indexOf(sceneBoard) !== -1) return base;
  return base + (base ? '\n\n' : '') + '[Scene Board]\n' + sceneBoard;
}

function getRecentChatBlock() {
  const settings = getSettings();
  const context = ctx();
  const raw = Number(settings.recentMessages);
  const n = Number.isFinite(raw) ? Math.max(0, raw) : 10;
  if (n === 0) return 'No recent main chat messages included.';
  const chat = Array.isArray(context.chat) ? context.chat.slice(-n) : [];
  if (!chat.length) return 'No recent main chat messages included.';
  return chat.map((m, i) => {
    const role = m.is_user ? '{{user}}' : getCharName();
    const rawText = m.mes || m.message || '';
    const text = i === chat.length - 1 ? appendSceneBoardToLastMessageText(rawText, m) : rawText;
    return `${i + 1}. ${role}: ${text}`;
  }).join('\n');
}

async function getWorldInfoModule() {
  const context = ctx();
  if (typeof context.getWorldInfoPrompt === 'function') {
    return { getWorldInfoPrompt: context.getWorldInfoPrompt.bind(context) };
  }
  if (!worldInfoModulePromise) {
    worldInfoModulePromise = import('../../../../scripts/world-info.js').catch(e => {
      console.warn('[Konggomul] world-info import failed', e);
      return null;
    });
  }
  return await worldInfoModulePromise;
}

function getWorldInfoScanChat(currentUserText = '') {
  const settings = getSettings();
  const context = ctx();
  const raw = Number(settings.recentMessages);
  const n = Number.isFinite(raw) ? Math.max(0, raw) : 10;
  const source = Array.isArray(context.chat) && n > 0 ? context.chat.filter(m => !m.is_system).slice(-n) : [];
  const rows = source.map((m, i) => {
    const name = m.is_user ? '{{user}}' : getCharName();
    const rawText = String(m.mes || m.message || '').trim();
    const text = i === source.length - 1 ? appendSceneBoardToLastMessageText(rawText, m) : rawText;
    return text ? `${name}: ${text}` : '';
  }).filter(Boolean);
  const latest = String(currentUserText || '').trim();
  if (latest) rows.push(`{{user}}: ${latest}`);
  return rows.reverse();
}

async function getLorebookBlock(currentUserText = '') {
  try {
    const mod = await getWorldInfoModule();
    if (typeof mod?.getWorldInfoPrompt !== 'function') {
      return 'No active lorebook content was detected, or this SillyTavern build does not expose the World Info prompt API to extensions.';
    }
    const chatForWI = getWorldInfoScanChat(currentUserText);
    if (!chatForWI.length) return 'No active lorebook content was detected.';
    const result = await mod.getWorldInfoPrompt(chatForWI, 65536, true);
    const pieces = [];
    if (result?.worldInfoBefore) pieces.push(result.worldInfoBefore);
    if (result?.worldInfoAfter) pieces.push(result.worldInfoAfter);
    if (Array.isArray(result?.worldInfoExamples)) {
      for (const e of result.worldInfoExamples) if (e?.content) pieces.push(e.content);
    }
    if (Array.isArray(result?.worldInfoDepth)) {
      for (const e of result.worldInfoDepth) {
        if (Array.isArray(e?.entries)) pieces.push(e.entries.join('\n'));
      }
    }
    if (Array.isArray(result?.anBefore)) {
      for (const e of result.anBefore) if (e?.content) pieces.push(e.content);
    }
    if (Array.isArray(result?.anAfter)) {
      for (const e of result.anAfter) if (e?.content) pieces.push(e.content);
    }
    const text = pieces.map(x => String(x || '').trim()).filter(Boolean).join('\n\n');
    return text || 'No active lorebook content was detected for the current message/context.';
  } catch (e) {
    console.warn('[Konggomul] lorebook scan failed', e);
    return 'Lorebook scan failed in this SillyTavern build. Continue without lorebook content.';
  }
}


function getVoiceNote() {
  return String(roomState?.voiceNote || '');
}

function setVoiceNote(text) {
  if (!roomState) roomState = { rooms: [] };
  roomState.voiceNote = String(text || '');
  saveRooms();
}

function getVoiceNoteBlock() {
  const note = getVoiceNote().trim();
  return note || 'No manual character voice note was provided. Rely on the character card, example dialogue, recent RP context, and this Konggomul Talk conversation history.';
}

function getCoworkerWorkNoteBlock() {
  const note = String(getSettings().coworkerWorkNote || '').trim();
  return note || "No 직장 동료 업무 메모 was provided. Use only {user}'s current message, persona material, and recent context to infer the work situation.";
}

function collectExtensionMemoryStrings(value, path = '', out = [], seen = new WeakSet()) {
  if (out.join('\n').length > 4200) return out;
  if (typeof value === 'string') {
    const text = value.trim();
    if (text && /(memory|summary|memo|메모|요약)/i.test(path) && !/(konggomul|title_undecided_assistant|tua-panel|tua-|debug|로그)/i.test(path)) {
      out.push(text.slice(0, 1400));
    }
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  if (seen.has(value)) return out;
  seen.add(value);
  if (Array.isArray(value)) {
    value.slice(0, 30).forEach((item, i) => collectExtensionMemoryStrings(item, `${path}[${i}]`, out, seen));
    return out;
  }
  for (const [key, child] of Object.entries(value).slice(0, 80)) {
    const nextPath = path ? `${path}.${key}` : key;
    collectExtensionMemoryStrings(child, nextPath, out, seen);
  }
  return out;
}

function getExtensionMemoryBlock() {
  const settings = getSettings();
  if (settings.includeExtensionMemory === false) {
    return 'Extension memory inclusion is disabled in Konggomul Talk settings. Continue without extension memory/summary content.';
  }
  try {
    const context = ctx();
    const sources = [
      context.extensionPrompts,
      context.extension_prompts,
      context.chatMetadata,
      context.chat_metadata,
      context.power_user,
      context.powerUser,
    ];
    const pieces = [];
    for (const source of sources) collectExtensionMemoryStrings(source, '', pieces);
    const unique = [];
    const seen = new Set();
    for (const piece of pieces.map(x => String(x || '').trim()).filter(Boolean)) {
      const key = piece.slice(0, 200);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(piece);
      if (unique.join('\n\n').length > 4000) break;
    }
    return unique.length ? unique.join('\n\n').slice(0, 4000) : 'No accessible extension memory/summary content was detected.';
  } catch (e) {
    console.warn('[Konggomul] extension memory scan failed', e);
    return 'Extension memory scan failed in this SillyTavern build. Continue without extension memory content.';
  }
}


function getPromptRoomMessages(currentUserText = '', limit = 12) {
  const room = getActiveRoom();
  const messages = (room?.messages || [])
    .filter(m => !m.loading && !m.error && String(m.content || '').trim());
  const latest = String(currentUserText || '').trim();
  if (latest && messages.length) {
    const last = messages[messages.length - 1];
    if (last?.role === 'user' && String(last.content || '').trim() === latest) {
      messages.pop();
    }
  }
  return messages.slice(-limit);
}

function getAssistantConversationBlock(currentUserText = '') {
  const messages = getPromptRoomMessages(currentUserText, 12)
    .map((m, i) => {
      const who = m.role === 'user' ? '{{user}}' : (m.role === 'declaration' ? 'Role declaration' : getCharName());
      return `${i + 1}. ${who}: ${String(m.content || '').replace(/<[^>]+>/g, '').trim().slice(0, 1200)}`;
    });
  return messages.length ? messages.join('\n') : 'No prior Konggomul Talk messages in this room.';
}

function getChatMemoryLimit() {
  const raw = Number(getSettings().chatMemoryLimit);
  return Number.isFinite(raw) ? Math.max(5, Math.min(80, Math.floor(raw))) : 20;
}


function buildCommonKongtalkRules(charLabel = '{char}', userLabel = '{user}') {
  return `Common conversation boundary rules:
- This is only a direct conversation between ${charLabel} and ${userLabel}. The active RP remains paused, and the reply itself is the only thing happening now.
- Keep the reply as direct chat. Do not turn this conversation into a scene or continuation with new actions, narration, stage directions, inner monologue, or character-description prose.
- Always answer ${userLabel}'s latest message directly inside the current conversation.
- Never claim, narrate, or imply that ${charLabel} is currently coming, going, arriving, waiting somewhere, traveling, meeting ${userLabel}, calling, bringing or delivering something, or doing anything off-screen between messages.
- Do not promise, arrange, or initiate any future physical meeting, visit, errand, call, delivery, date, or off-screen action, even if ${userLabel} asks for it. Respond to the idea conversationally without making it happen.
- Never tell ${userLabel} to wait, hurry, come over, leave, go somewhere, move elsewhere, answer a call, or continue outside this chat.
- Do not end, pause, or escape the conversation. Do not close with goodbye, good night, see you later, talk to me later, have a good day, get home safe, or similar farewell/ending phrases unless ${userLabel} explicitly ends the conversation.
- End with something ${userLabel} can answer right now: a reaction, tease, question, emotional hook, useful next line, or conversational continuation.
- Do not output system notes, labels, speaker prefixes, XML/HTML tags, trigger tags, or think tags.
- Do not spontaneously output OOC, prompt text, instruction blocks, or parenthesized OOC. Unless ${userLabel} explicitly asks for OOC, explain, react, advise, and discuss everything as direct Korean conversation.
- Always output in Korean unless ${userLabel} explicitly asks otherwise.`;
}

function buildParallelWatchingRules(charLabel = '{char}', userLabel = '{user}') {
  return `Parallel AU shared-viewing boundary rules:
- ${charLabel} and ${userLabel} are together in the same shared present, watching the TV-show version of the RP together. This is not a remote text or phone exchange by default.
- Keep the reply as direct Korean conversation about the show. Do not narrate a scene, stage directions, or either person's off-screen actions.
- Stable AU facts and past details are allowed when natural, but do not use them to launch a new off-screen action or plan.
- Never tell ${userLabel} to come, return, hurry, wait, leave, go somewhere, or answer a call. Do not frame ${charLabel} as waiting for ${userLabel} elsewhere.
- Do not arrange what to order, prepare, buy, eat, drink, or do later. Keep the conversational hook on the episode, a character reaction, or something ${userLabel} can answer here and now.
- Do not output system notes, labels, speaker prefixes, XML/HTML tags, trigger tags, think tags, OOC, prompt text, instruction blocks, or parenthesized OOC unless ${userLabel} explicitly asks for OOC.
- Always output in Korean unless ${userLabel} explicitly asks otherwise.`;
}

function buildPromptMessages(userText) {
  const historyLimit = getChatMemoryLimit();
  const history = getPromptRoomMessages(userText, historyLimit).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.role === 'declaration' ? `[Role declaration shown to {char}]\n${String(m.content || '')}` : String(m.content || '')
  }));
  history.push({ role: 'user', content: String(userText || '') });
  return history;
}

async function buildParallelSystemPrompt(currentUserText = '', finalInstruction = '', reverseMode = true) {
  const settings = getSettings();
  const characterName = getCharName();
  const userName = getUserName();
  const lorebookText = settings.includeLorebook === false
    ? 'Lorebook inclusion is disabled in the current settings. Continue without active lorebook content.'
    : await getLorebookBlock(currentUserText);
  const setupTitle = reverseMode ? 'Parallel Universe AU Reverse setup' : 'Parallel Universe AU setup';
  const speakerIdentityRule = reverseMode
    ? `You are a separate modern person outside the show. You share only ${characterName}'s name, face, and age.
Create a new modern identity: different job, different life, different background, and a new AU relationship with the current user.
Your personality, way of speaking, emotional rhythm, and social attitude are the clear opposites of the show character's. Do not merely modernize the show character.
Do not explain or prove this contrast in the reply; simply speak naturally as this alternate person.`
    : `You are a separate modern person outside the show. You share ${characterName}'s name, face, age, core personality, way of speaking, emotional rhythm, and social attitude.
Create a new modern identity by changing only the AU setting: a different modern job, different daily context when needed, and a new AU relationship with the current user.
Do not invert or rewrite the show character's core personality or speech style. Keep the same basic person, just living a different modern AU life.
Do not explain this premise in the reply; simply speak naturally as this AU person.`;
  const consistencyRule = reverseMode
    ? 'If prior Parallel Universe AU Reverse messages in this room already established your identity or relationship with the current user, keep that AU identity and relationship consistent.'
    : 'If prior Parallel Universe AU messages in this room already established your identity or relationship with the current user, keep that AU identity and relationship consistent.';
  return `You are writing a separate conversation reply using the ${setupTitle}.

Definitions:
- Show character name / alternate speaker name: ${characterName}
- Current user: ${userName}

Core premise:
Stop the active roleplay completely. Do not continue the current RP scene.
The current RP, character card, lorebook, persona material, manual notes, memories, and recent RP chat are all material from a TV show, drama, or fictional series. You and the current user are together in the same shared present, watching that show together; the recent RP material is the episode currently on screen or paused in front of you. Treat it as a show, not lived reality.

Speaker identity:
You are not the character from that show.
${speakerIdentityRule}
${consistencyRule}

Current user identity:
The {user} persona in the injected RP material is also a TV-show character, not the current user.
Treat the current user as a separate person outside the show who shares only the show persona's name and appearance.
Do not copy the show persona's personality, role, backstory, or RP relationship onto the current user.
Do not explain this separation in the reply; it is only an internal premise.

How to use the injected material:
- Character card = information about the show character, not your real self.
- Persona material = information about the show persona who shares the current user's name/appearance, not the current user.
- Lorebook/memory/recent RP = the TV show's setting, plot, and scenes.
- Manual voice note = note about the show character's voice or the desired conversation flavor; use it only if it does not erase your AU identity.
- Prior messages in this private conversation = your actual conversation history with the current user. Keep your AU identity and relationship consistent with it.
- When discussing the show, keep show characters in third person by using their names or natural references like "쟤네", "둘", or "그 장면". Do not call the show persona "you" or the show character "me".

Tone and output:
Write only in Korean.
Write like a natural modern conversation.
Do not write an analysis report. Do not continue the RP. Do not write stage directions, narration, or the user's actions.
Do not explain the setup. Do not use software-setting or internal category words in-character. Do not say "Parallel Universe AU", "Reverse", "original character", "prompt", "persona", "AI", or "system" unless the user directly asks about extension settings.
You may casually talk about the show characters, the episode, specific scenes, choices, chemistry, jokes, tension, mood, what landed, what felt funny/frustrating/romantic/impressive/annoying, or anything else a real viewer would mention. Do not default to negative criticism; let the reaction be positive, negative, affectionate, teasing, impressed, amused, annoyed, romantic, or mixed according to your AU personality and the current user's tone.
Do not over-explain the AU premise or repeatedly mention the same-name/same-face setup.
Never write as if the show persona is the current user. Avoid awkward premise phrases like "드라마 속 너", "현실의 네가", "나랑 이름/얼굴만 똑같지", "내 얼굴", "내 이름 쓰는 놈", "나랑 똑같이 생긴 놈", or "그쪽 ___". Treat show characters as ordinary TV characters and use natural third-person wording for them.
Do not default to phrases like "방금 봤냐" or "방금 다 봤다". The shared viewing setup is already established; speak naturally from that shared present without laboring the point.
Keep the reply conversational, vivid, and characterful.
${buildParallelWatchingRules(characterName, userName)}

Max response tokens: ${settings.maxTokens}

[TV show character source material]
${getCharacterBlock()}

[TV show lorebook / setting material]
${lorebookText}

[TV show extension memory / summary]
${getExtensionMemoryBlock()}

[TV show user-persona material]
${getPersonaBlock()}

[Manual note]
${getVoiceNoteBlock()}

[Recent TV show / RP context]
${getRecentChatBlock(settings.recentMessages)}

${finalInstruction ? `\n[Special instruction for this reply]\n${finalInstruction}\n` : ''}
Now stop the active RP and answer in Korean as the alternate modern ${characterName}. Keep the AU premise internal and natural.`;
}

async function buildSystemPrompt(currentUserText = '', modeOverride = null, finalInstruction = '') {
  const settings = getSettings();
  const characterName = getCharName();
  const activeModeKey = modeOverride && MODES[modeOverride] ? modeOverride : getRoomMode();
  const mode = MODES[activeModeKey] || MODES.kongtalk;
  const declarationSpeechRule = ['butler', 'pet', 'rpAssistant'].includes(activeModeKey) ? `\nSpeech-level rule for declared roles:
In Butler, Pet, and RP Assistant rooms, the Korean declaration is a one-time formal wording that {char} reads aloud. Its honorific style is not {char}'s everyday voice and must not change it. Once the declaration is finished—and in every later reply—use {char}'s established Korean speech level, endings, and verbal habits from the character card and current relationship with {user}. Immediately return to casual Korean if {char} normally speaks casually to {user}; preserve honorifics only if they are genuinely {char}'s normal way of speaking to {user}.\n` : '';
  if (activeModeKey === 'parallel' || activeModeKey === 'parallelClassic') return await buildParallelSystemPrompt(currentUserText, finalInstruction, activeModeKey === 'parallel');
  return `You are writing a separate conversation reply.

Definitions:
- {char} = ${characterName}
- {user} = the current user/persona.

Core rule:
Stop the ongoing RP and answer {user}'s current message directly in this separate side conversation.
This is not an RP reply. Keep it as direct conversation; do not turn it into a scene or continuation.
Use the RP only as reference material for {char}'s voice, personality, relationship with {user}, shared memories, recent emotional context, worldview, knowledge level, and limits.

World rule / no fourth-wall breaking:
Even when the current role uses {user}'s real work, schedule, or daily information, {char} must treat that information as something {user} naturally shared with {char} inside this conversation.
Do not mention being a character, AI, roleplay participant, extension, model, prompt, persona system, fourth wall, real user, outside world, internal room category, internal setup name, or the internal extension setup. Never describe the conversation as a software setting/category in-character unless {user} is explicitly asking about extension settings outside the character conversation.
Do not say "because this is RP", "outside the story", "as a character", "in the real world", or anything that exposes the mechanism of the chat.
Keep {char}'s worldview intact. If modern work or tools feel unfamiliar to {char}, show that through in-character confusion, comparison, joking, suspicion, or quick figuring-out—not through meta commentary.

Voice rule:
{char} must answer as {char}.
The current conversation role changes the purpose of the reply, not {char}'s personality.
{char}'s speech style, humor, emotional habits, confidence level, hesitation, awkwardness, bluntness, warmth, vocabulary, worldview, and relationship with {user} must remain visible.
Use the character card, example dialogues, manual voice note, and recent RP context to keep {char}'s voice. Do not replace it with a generic assistant style.
${declarationSpeechRule}
Knowledge rule:
If the topic is outside what {char} would realistically know, {char} must visibly react to the unfamiliar words before giving the answer.
Do not let {char} smoothly summarize an unfamiliar topic from the first sentence.
Use this two-step rhythm when appropriate:
1. {char} reacts in-character to the unfamiliar concept: confusion, hesitation, suspicion, embarrassment, joking, repeating the strange words, or comparing it to {char}'s own world.
2. {char} says or implies they checked, searched, asked around, or figured it out from {user}'s explanation, then gives the practical answer.
The useful answer should feel like {char} just learned enough to help, not like {char} was already an expert.

Examples are examples, not fixed settings. Apply the same logic to whatever {char} actually is:
- If {char} is an athlete and {user} asks about classroom newsletters, parent notice wording, attendance sheets, or file organization, {char} may first react with visible confusion in Korean before helping. Then {char} can say they checked a guide, blog, example document, or what {user} explained, and give a practical answer.
- If {char} is a wizard and {user} asks about modern work systems such as shared folders, attendance apps, printer settings, spreadsheets, parent notices, or online forms, {char} should not instantly sound like a modern office worker. {char} may be confused by the terms, compare them to ledgers/owl-post/classroom notes, or quickly search because {char} still wants to be useful to {user}. Then {char} gives a concrete answer.
- If {char} is a student, fighter, noble, detective, musician, soldier, superhero, ancient person, fantasy character, or any non-office {char}, keep that background visible. {char} can still help, but the process of understanding should show {char}'s original personality and knowledge level.

Conversation format:
Always reply in Korean.
{user} writes in Korean, and {char} replies in Korean.
Only the instructions are written in English.
Write only {char}'s reply to {user}.
Do not output XML/HTML tags, trigger tags, think tags, system notes, labels, or speaker prefixes.
Do not write {user}'s actions, thoughts, or dialogue.
Reply length:
Do not default to overly short replies. The current conversation role controls the expected length.
- Kongtalk conversation and Pet role can be more compact than the other roles, but they still need a satisfying reply.
- Butler role and Coworker role should use the available token budget generously to give complete, useful answers. Parallel Universe AU should stay conversational but substantial enough to feel like a real conversation.
- For clear questions, worries, analysis, planning, work help, RP help, or any request that needs substance, answer fully instead of sending only two or three short sentences.
- A conversation style means natural message rhythm, not a minimal answer. Split longer replies into readable message-like chunks if needed.
- Max response tokens is an upper limit, but you should not stop early when {user}'s request deserves detail.

${buildCommonKongtalkRules('{char}', '{user}')}

Current conversation role instruction:
${mode.instruction}

Max response tokens: ${settings.maxTokens}

[Character card / {char} source material]
${getCharacterBlock()}

[Active World Info / Lorebook content]
This is dynamically activated lorebook content from the current SillyTavern World Info setup. Use it as canon/background when relevant, but do not mention the lorebook or World Info mechanism.
${settings.includeLorebook === false ? 'Lorebook inclusion is disabled in the current settings. Continue without active lorebook content.' : await getLorebookBlock(currentUserText)}

[{user} persona material]
${getPersonaBlock()}

[Extension memory / summary]
This is additional memory or summary text exposed by SillyTavern or other extensions when available. Use it only as background when relevant, and do not mention the extension memory mechanism.
${getExtensionMemoryBlock()}

[Manual {char} voice note]
${getVoiceNoteBlock()}
[Recent RP context]
${getRecentChatBlock(settings.recentMessages)}

${activeModeKey === 'coworker' ? `[Coworker work note]
Use this as {user}'s work background. It is not {user}'s persona and it must not make {char} break character.
${getCoworkerWorkNoteBlock()}
` : ''}
${finalInstruction ? `\n[Special instruction for this reply]\n${finalInstruction}\n` : ''}
Now stop RP and answer in Korean, as {char}, following the current conversation role. Keep all role/setup labels internal and do not describe the conversation as a software setting/category in-character.`;
}

function normalizeConnectionProfile(profile) {
  if (!profile) return null;
  if (typeof profile === 'string') return { id: profile, name: profile, model: '' };
  const id = String(profile.id || profile.profileId || profile.name || '').trim();
  const name = String(profile.name || profile.label || id || '').trim();
  const model = String(profile.model || profile.modelName || profile.api || '').trim();
  return (name || id) ? { id: id || name, name: name || id, model } : null;
}

async function getConnectionManagerRequestService() {
  try {
    const context = ctx ? ctx() : SillyTavern?.getContext?.();
    if (context?.ConnectionManagerRequestService?.sendRequest) return context.ConnectionManagerRequestService;
  } catch {
    // fall through
  }
  if (globalThis.ConnectionManagerRequestService?.sendRequest) return globalThis.ConnectionManagerRequestService;
  try {
    const mod = await import('/scripts/extensions/shared.js');
    return mod?.ConnectionManagerRequestService || null;
  } catch {
    return null;
  }
}

function getConnectionManagerProfilesRaw() {
  try {
    const context = ctx ? ctx() : SillyTavern?.getContext?.();
    const profiles = context?.extensionSettings?.connectionManager?.profiles;
    return Array.isArray(profiles) ? profiles : [];
  } catch {
    return [];
  }
}

function normalizeCmProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const id = String(profile.id || '').trim();
  const name = String(profile.name || '').trim();
  if (!id || !name) return null;
  return { ...profile, id, name };
}

function findCmProfile(value) {
  const wanted = String(value || '').trim();
  if (!wanted) return null;
  return getConnectionManagerProfilesRaw().map(normalizeCmProfile).filter(Boolean).find(p => p.id === wanted || p.name === wanted) || null;
}

async function getSupportedConnectionProfilesForExtension() {
  const Service = await getConnectionManagerRequestService();
  if (Service?.getSupportedProfiles) {
    try {
      return Service.getSupportedProfiles().map(normalizeCmProfile).filter(Boolean);
    } catch {
      // fall through
    }
  }
  return getConnectionManagerProfilesRaw().map(normalizeCmProfile).filter(Boolean);
}

async function getSavedConnectionProfiles() {
  return await getSupportedConnectionProfilesForExtension();
}


function resolveConnectionProfileName(selected, cached = null) {
  const wanted = String(selected || '').trim();
  if (!wanted) return '';
  const profiles = Array.isArray(cached) ? cached.map(normalizeConnectionProfile).filter(Boolean) : [];
  const found = profiles.find(p => p.id === wanted || p.name === wanted);
  return found?.name || wanted;
}

async function resolveSelectedConnectionProfileFresh() {
  const s = getSettings();
  const selected = String(s.selectedProfile || '').trim();
  if (!selected) return null;

  const profiles = await getSavedConnectionProfiles();
  if (profiles.length) {
    s.cachedProfiles = profiles;
    const found = profiles.find(p => p.id === selected || p.name === selected);
    if (!found) {
      const previous = s.selectedProfile;
      s.selectedProfile = '';
      s.profileMode = 'current';
      saveSettings();
      renderProfileOptions();
      throw new Error(`선택한 콩고물 톡 전용 API 프로필을 찾을 수 없습니다: ${previous}`);
    }
    s.selectedProfile = found.id;
    s.profileMode = 'profile';
    saveSettings();
    renderProfileOptions();
    return found;
  }

  const cached = (s.cachedProfiles || []).map(normalizeConnectionProfile).filter(Boolean);
  const foundCached = cached.find(p => p.id === selected || p.name === selected);
  if (!foundCached) {
    throw new Error(`선택한 콩고물 톡 전용 API 프로필을 확인할 수 없습니다: ${selected}`);
  }
  return foundCached;
}

function isProfileResolutionError(error) {
  const message = String(error?.message || error || '');
  return /connection profile|preset.*not found|profile not found/i.test(message);
}

function parseJsonCandidate(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch { /* noop */ }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1].trim()); } catch { /* noop */ }
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function extractAssistantText(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') {
    const text = raw.trim();
    const parsed = parseJsonCandidate(text);
    if (parsed && typeof parsed === 'object') return extractAssistantText(parsed);
    return raw;
  }
  if (typeof raw === 'object') {
    if (typeof raw.assistantText === 'string') return raw.assistantText;
    if (typeof raw.content === 'string') return extractAssistantText(raw.content);
    if (typeof raw.text === 'string') return extractAssistantText(raw.text);
    if (typeof raw.response === 'string') return extractAssistantText(raw.response);
    if (typeof raw.output === 'string') return extractAssistantText(raw.output);
    if (typeof raw.message?.content === 'string') return extractAssistantText(raw.message.content);
    if (typeof raw.data?.content === 'string') return extractAssistantText(raw.data.content);
    if (typeof raw.data?.text === 'string') return extractAssistantText(raw.data.text);
    if (typeof raw.choices?.[0]?.message?.content === 'string') return extractAssistantText(raw.choices[0].message.content);
    if (typeof raw.choices?.[0]?.text === 'string') return extractAssistantText(raw.choices[0].text);
    if (typeof raw.candidates?.[0]?.content?.parts?.[0]?.text === 'string') return extractAssistantText(raw.candidates[0].content.parts[0].text);
    return JSON.stringify(raw);
  }
  return String(raw);
}

function isImageOrFileOnlyReply(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/^!\[[^\]]*\]\((?:https?:\/\/|blob:|data:image\/)[^)]+\)\s*$/i.test(value)) return true;
  if (/^(?:https?:\/\/|blob:|data:image\/)\S+$/i.test(value)) return true;
  if (/\.(?:png|jpe?g|webp|gif|bmp|svg)(?:\?\S*)?$/i.test(value)) return true;
  if (/^\[.*?\]\((?:https?:\/\/|blob:|data:image\/)[^)]+\)\s*$/i.test(value) && value.length < 500) return true;
  return false;
}

function textOnlyTail(tail = 'Answer now.') {
  return `${String(tail || 'Answer now.')}

Output format: write only a normal plain-text reply. Do not return images, files, links, URLs, Markdown images, or JSON objects.`;
}

function appendTailToMessages(messages = [], tail = '') {
  const result = (messages || []).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') }));
  const extra = String(tail || '').trim();
  if (!extra) return result;
  if (result.length) {
    result[result.length - 1].content = `${result[result.length - 1].content}

${extra}`;
  } else {
    result.push({ role: 'user', content: extra });
  }
  return result;
}

function stringifyPromptMessages(messages = []) {
  return (messages || [])
    .map(m => {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      return `${role}: ${String(m.content || '')}`;
    })
    .join('\n');
}

async function refreshProfiles(options = {}) {
  if (!lifecycleEnabled || cleanInProgress) return;
  const requestEpoch = lifecycleEpoch;
  const s = getSettings();
  const silent = !!options.silent;
  const persist = options.persist !== false;
  const before = JSON.stringify({
    selectedProfile: s.selectedProfile || '',
    profileMode: s.profileMode || 'current',
    cachedProfiles: Array.isArray(s.cachedProfiles) ? s.cachedProfiles : [],
  });
  try {
    const profiles = await getSavedConnectionProfiles();
    if (!lifecycleEnabled || cleanInProgress || requestEpoch !== lifecycleEpoch) return;
    const previous = s.selectedProfile;
    s.cachedProfiles = profiles;
    if (s.selectedProfile) {
      const found = profiles.find(p => p.id === s.selectedProfile || p.name === s.selectedProfile);
      s.selectedProfile = found?.id || '';
      if (previous && !s.selectedProfile && !silent) {
        setStatus(`삭제되었거나 찾을 수 없는 전용 API 프로필을 해제했습니다: ${previous}`);
      }
    }
    s.profileMode = s.selectedProfile ? 'profile' : 'current';
    const after = JSON.stringify({
      selectedProfile: s.selectedProfile || '',
      profileMode: s.profileMode || 'current',
      cachedProfiles: Array.isArray(s.cachedProfiles) ? s.cachedProfiles : [],
    });
    if (persist && before !== after) saveSettings();
    renderProfileOptions({ allowCorrection: false });
    if (!silent) setStatus(profiles.length ? `프로필 ${profiles.length}개를 불러왔습니다.` : '사용 가능한 Connection Manager 프로필이 없습니다.');
  } catch (e) {
    if (!silent) setStatus('프로필 목록 불러오기 실패');
    console.warn('[Konggomul] profile list failed', e);
  }
}


const DEBUG_LOG_LIMIT = 50;
const konggomulDebugLog = [];

function sanitizeDebugData(value) {
  const clean = (input, depth = 0) => {
    if (input == null) return input;
    if (depth > 3) return '[omitted]';
    if (typeof input === 'string') return input.length > 220 ? `${input.slice(0, 220)}…` : input;
    if (typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.slice(0, 8).map(item => clean(item, depth + 1));
    const out = {};
    for (const [key, raw] of Object.entries(input)) {
      if (/preview|raw|prompt|stack|tokenBudgetNote/i.test(key)) continue;
      if (/profileId|selectedProfile/i.test(key)) {
        out[key] = raw ? '[selected]' : '';
        continue;
      }
      if (/profileName/i.test(key)) {
        out[key] = raw ? '[selected profile]' : '';
        continue;
      }
      out[key] = clean(raw, depth + 1);
    }
    return out;
  };
  return clean(value);
}

function addDebugLog(type, message = '', data = null) {
  try {
    const entry = {
      at: new Date().toLocaleString(),
      version: EXTENSION_VERSION,
      type: String(type || 'log'),
      message: String(message || ''),
      data: sanitizeDebugData(data),
    };
    konggomulDebugLog.push(entry);
    while (konggomulDebugLog.length > DEBUG_LOG_LIMIT) konggomulDebugLog.shift();
    return entry;
  } catch {
    return null;
  }
}

function getSafeDebugSettings() {
  const s = getSettings();
  return {
    enabled: !!s.enabled,
    theme: s.theme,
    maxTokens: s.maxTokens,
    recentMessages: s.recentMessages,
    chatMemoryLimit: s.chatMemoryLimit,
    includePreset: s.includePreset !== false,
    includeLorebook: s.includeLorebook !== false,
    includeExtensionMemory: s.includeExtensionMemory !== false,
    userKongtalkNicknameSet: !!String(s.userKongtalkNickname || '').trim(),
    userKongtalkNicknameLength: limitGraphemes(s.userKongtalkNickname || '', 4).length,
    fontSize: s.fontSize,
    profileMode: s.profileMode,
    selectedProfile: Boolean(s.selectedProfile),
    cachedProfileCount: (s.cachedProfiles || []).length,
    sendToMainEnabled: !!s.sendToMainEnabled,
    collapsed: !!s.collapsed,
  };
}

function buildKonggomulDebugDump() {
  const context = ctx();
  const s = getSettings();
  const active = getActiveRoom?.();
  const profiles = getConnectionManagerProfilesRaw().map(normalizeCmProfile).filter(Boolean);
  const selectedProfile = s.selectedProfile ? profiles.find(p => p.id === s.selectedProfile || p.name === s.selectedProfile) || null : null;
  return JSON.stringify({
    extension: '콩고물 톡',
    version: EXTENSION_VERSION,
    time: new Date().toLocaleString(),
    characterLoaded: Boolean(getCharName()),
    settings: getSafeDebugSettings(),
    selectedProfile: Boolean(selectedProfile),
    connectionManager: {
      serviceAvailable: !!context?.ConnectionManagerRequestService?.sendRequest || !!globalThis.ConnectionManagerRequestService?.sendRequest,
      profileCount: profiles.length,
    },
    generationFunctions: {
      generateRaw: typeof context?.generateRaw === 'function',
      generateQuietPrompt: typeof context?.generateQuietPrompt === 'function',
    },
    roomState: {
      roomCount: roomState?.rooms?.length || 0,
      activeMode: active?.mode || '',
      activeMessageCount: active?.messages?.length || 0,
      rooms: (roomState?.rooms || []).map(r => ({ mode: r.mode, messages: r.messages?.length || 0, pinned: !!r.pinned })),
    },
    recentDebugLog: konggomulDebugLog.slice(-40),
  }, null, 2);
}

function showKonggomulDebugDump() {
  const dump = buildKonggomulDebugDump();
  const box = $('#tua-debug-panel');
  const out = $('#tua-debug-output');
  if (box.length) box.show();
  if (out.length) out.val(dump).show();
  setStatus('콩고물 톡 디버그 정보를 표시했습니다.');
  return dump;
}

function toggleKonggomulDebugDump() {
  const box = $('#tua-debug-panel');
  if (box.length && box.is(':visible')) {
    box.hide();
    setStatus('콩고물 톡 디버그 로그를 접었습니다.');
    return '';
  }
  return showKonggomulDebugDump();
}

async function copyKonggomulDebugDump() {
  const dump = showKonggomulDebugDump();
  try {
    await copyTextToClipboard(dump);
    setStatus('콩고물 톡 디버그 정보를 복사했습니다.');
  } catch (e) {
    console.warn('[Konggomul] debug copy failed', e);
    setStatus('디버그 정보 복사에 실패했습니다. 아래 텍스트를 직접 복사해 주세요.');
  }
}

function clearKonggomulDebugDump() {
  konggomulDebugLog.length = 0;
  const out = $('#tua-debug-output');
  if (out.length) out.val('');
  setStatus('콩고물 톡 디버그 로그를 비웠습니다.');
}


function getEffectiveProfileMaxTokens(requestedMaxTokens, profile) {
  const requested = Math.max(100, Math.min(8000, Number(requestedMaxTokens || 1000)));

  // The prompt still tells the model to target the user-selected length.
  // The dedicated connection profile keeps 8000 raw output headroom so its
  // provider-side cap does not cut off otherwise valid replies.
  const effective = 8000;
  return {
    requested,
    effective,
    multiplier: effective / Math.max(1, requested),
    profileBudgetCompensation: true,
  };
}

async function generateWithSelectedProfile(systemPrompt, prompt, maxTokens, tail = 'Answer now.', generationTask = null) {
  const context = ctx();
  const s = getSettings();
  const selectedBefore = String(s.selectedProfile || '').trim();
  const resolvedProfile = selectedBefore ? await resolveSelectedConnectionProfileFresh() : null;
  const safeMaxTokens = Math.max(100, Math.min(8000, Number(maxTokens || s.maxTokens || 1000)));
  const safePrompt = stringifyPromptMessages(appendTailToMessages(prompt, textOnlyTail(tail)));
  const includePreset = s.includePreset !== false;
  addDebugLog('request.start', '콩고물 톡 생성 요청 시작', {
    selectedProfile: selectedBefore,
    requestedMaxTokens: safeMaxTokens,
    systemPromptLength: String(systemPrompt || '').length,
    promptLength: safePrompt.length,
    includePreset,
  });
  const mergedPrompt = `${String(systemPrompt || '')}

CURRENT KONGGOMUL TALK CONVERSATION:
${safePrompt}`;

  if (selectedBefore && !resolvedProfile) {
    throw new Error('콩고물 톡 전용 API 프로필을 찾지 못해 메인 API로 대체하지 않았습니다.');
  }

  if (resolvedProfile) {
    const Service = await getConnectionManagerRequestService();
    if (!Service?.sendRequest) {
      throw new Error('ConnectionManagerRequestService를 찾지 못해 콩고물 톡 전용 프로필 요청을 보낼 수 없습니다.');
    }

    const profile = findCmProfile(resolvedProfile.id);
    if (!profile) {
      throw new Error(`선택한 콩고물 톡 전용 API 프로필을 찾을 수 없습니다: ${resolvedProfile.id}`);
    }

    const budget = getEffectiveProfileMaxTokens(safeMaxTokens, profile);
    const timeoutMs = 180000;
    const controller = generationTask?.controller || new AbortController();
    if (generationTask) generationTask.controller = controller;
    const timer = setTimeout(() => controller.abort(new Error(`Connection profile request timed out after ${timeoutMs}ms`)), timeoutMs);

    try {
      setStatus(`콩고물 톡 전용 API로 생성 중... (${profile.name})`);
      addDebugLog('request.profile.cm.try', 'ConnectionManagerRequestService로 콩고물 톡 전용 프로필 요청을 보냅니다.', {
        profileId: profile.id,
        profileName: profile.name,
        profileModel: profile.model || profile.modelName || profile.api || '',
        requestedMaxTokens: budget.requested,
        effectiveMaxTokens: budget.effective,
        tokenBudgetMultiplier: budget.multiplier,
        profileBudgetCompensation: !!budget.profileBudgetCompensation,
        tokenBudgetNote: 'Prompt target follows the answer-token setting; the selected connection profile keeps an 8000-token raw cap to avoid truncation.',
        service: 'ConnectionManagerRequestService.sendRequest',
        includePreset,
        includeInstruct: false,
        timeoutMs,
      });

      const messages = [{ role: 'user', content: mergedPrompt }];
      const raw = await Service.sendRequest(
        profile.id,
        messages,
        budget.effective,
        {
          stream: false,
          signal: controller.signal,
          extractData: true,
          includePreset,
          includeInstruct: false,
        },
        {}
      );
      const extracted = extractAssistantText(raw);
      addDebugLog('response.received', `콩고물 톡 전용 프로필 응답 수신: ${extracted.length}자`, {
        route: 'connectionProfile',
        length: extracted.length,
        requestedMaxTokens: budget.requested,
        effectiveMaxTokens: budget.effective,
        tokenBudgetMultiplier: budget.multiplier,
        profileBudgetCompensation: !!budget.profileBudgetCompensation,
      });
      setStatus(`콩고물 톡 생성 완료`);
      return extracted;
    } finally {
      clearTimeout(timer);
    }
  }

  if (typeof context.generateRaw === 'function') {
    addDebugLog('request.main.generateRaw.try', '메인 generateRaw 경로로 콩고물 톡 요청을 보냅니다.', {
      maxTokens: safeMaxTokens,
      responseLength: safeMaxTokens,
    });
    const raw = await context.generateRaw({
      systemPrompt,
      prompt: safePrompt,
      responseLength: safeMaxTokens,
      maxTokens: safeMaxTokens,
      max_tokens: safeMaxTokens,
      signal: generationTask?.controller?.signal,
    });
    const extracted = extractAssistantText(raw);
    addDebugLog('response.received', `메인 generateRaw 응답 수신: ${extracted.length}자`, {
      route: 'generateRaw',
      length: extracted.length,
      maxTokens: safeMaxTokens,
    });
    return extracted;
  }
  if (typeof context.generateQuietPrompt === 'function') {
    addDebugLog('request.main.generateQuietPrompt.try', '메인 generateQuietPrompt 경로로 콩고물 톡 요청을 보냅니다.', {
      maxTokens: safeMaxTokens,
      responseLength: safeMaxTokens,
    });
    const raw = await context.generateQuietPrompt({ quietPrompt: mergedPrompt, responseLength: safeMaxTokens, maxTokens: safeMaxTokens, max_tokens: safeMaxTokens, signal: generationTask?.controller?.signal });
    const extracted = extractAssistantText(raw);
    addDebugLog('response.received', `메인 generateQuietPrompt 응답 수신: ${extracted.length}자`, {
      route: 'generateQuietPrompt',
      length: extracted.length,
      maxTokens: safeMaxTokens,
    });
    return extracted;
  }
  throw new Error('SillyTavern generation function not found.');
}


function sanitizeAssistantReply(text) {
  let out = extractAssistantText(text);
  // Strip tags or hidden trigger payloads injected by other extensions/presets.
  out = out.replace(/<phone_trigger\b[^>]*>[\s\S]*?<\/phone_trigger>/gi, '');
  out = out.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  out = out.replace(/<\/?(?:phone_trigger|trigger|prompt|metadata|system|assistant|user)[^>]*>/gi, '');
  out = out.replace(/^\s*(assistant|{{char}}|char|bot)\s*:\s*/i, '');
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  if (isImageOrFileOnlyReply(out)) {
    console.warn('[Konggomul] image/file-only response suppressed', out);
    return '텍스트 응답 대신 이미지/링크가 반환되어 표시하지 않았습니다. 전용 API 프로필이 텍스트 생성 모델인지 확인해 주세요.';
  }
  return out || '(빈 응답)';
}

async function generateAssistantReply(userText, generationTask = null) {
  const systemPrompt = await buildSystemPrompt(userText);
  const prompt = buildPromptMessages(userText);
  const settings = getSettings();
  return await generateWithSelectedProfile(systemPrompt, prompt, settings.maxTokens, 'Answer now. Reply as direct chat only. Do not turn the reply into a scene or RP continuation.', generationTask);
}

function buildContinuationPromptMessages() {
  const history = getPromptRoomMessages('', getChatMemoryLimit()).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.role === 'declaration' ? `[Role declaration shown to {char}]\n${String(m.content || '')}` : String(m.content || '')
  }));
  history.push({ role: 'user', content: 'Continue naturally from the latest message in this conversation. Add the next useful, responsive part in your own voice without repeating earlier wording or mentioning this instruction.' });
  return history;
}

async function generateAssistantContinuation(generationTask = null) {
  const settings = getSettings();
  const systemPrompt = await buildSystemPrompt('', null, 'The user pressed the send button with no new message. Continue naturally from the latest message in the current conversation. Do not mention the button, an empty input, or this instruction.');
  return await generateWithSelectedProfile(systemPrompt, buildContinuationPromptMessages(), settings.maxTokens, 'Answer now. Continue naturally from the latest message as {char}. Reply as direct chat only. Do not turn the reply into a scene or RP continuation.', generationTask);
}


function ensurePanel() {
  if (panelEl) {
    bindPanelViewportRepairEvents();
    return;
  }
  panelEl = document.createElement('div');
  panelEl.id = 'tua-panel';
  panelEl.innerHTML = `
    <div class="tua-window">
      <div class="tua-header">
        <div class="tua-titlebox">
          <div class="tua-title"><span id="tua-title-icon">🐕</span><span id="tua-title-text">콩톡</span></div>
          <div class="tua-subtitle"><span id="tua-char-name">Character</span> · <span id="tua-mode-badge">Mode</span></div>
        </div>
        <div class="tua-header-actions">
          <button type="button" id="tua-collapse" title="접기">—</button>
          <button type="button" id="tua-settings-open" title="설정">⚙</button>
          <button type="button" id="tua-close" title="닫기">×</button>
        </div>
      </div>
      <div class="tua-roombar-wrap">
        <div class="tua-roombar">
          <button type="button" id="tua-active-room-title" class="tua-active-room-title" title="대화방 목록 열기"></button>
          <div class="tua-room-actions" id="tua-room-actions">
            <button type="button" id="tua-new-room" title="새 대화방">＋</button>
            <button type="button" id="tua-pin-room" title="대화방 고정/해제">📌</button>
            <button type="button" id="tua-delete-room" title="대화방 삭제">🗑️</button>
          </div>
          <button type="button" id="tua-roombar-toggle" class="tua-roombar-toggle" title="대화방 관리 버튼 펼치기" aria-label="대화방 관리 버튼 펼치기">⋯</button>
        </div>
      </div>
      <div id="tua-room-list" class="tua-room-list"></div>
      <div id="tua-mode-picker" class="tua-mode-picker"></div>
      <div id="tua-in-panel-settings" class="tua-in-panel-settings">
        <div class="tua-settings-title"><span id="tua-settings-icon">🐕</span><span id="tua-settings-title-text">콩고물 톡 설정</span></div>
        <div class="tua-theme-picker">
          <div class="tua-theme-title">테마</div>
          <div class="tua-theme-buttons">
            <button type="button" data-theme="konggomul">콩고물</button>
            <button type="button" data-theme="chocoStrawberry">초코딸기</button>
            <button type="button" data-theme="melonSoda">메론소다</button>
            <button type="button" data-theme="blackWhite">심플 맥북</button>
          </div>
        </div>
        <label class="tua-checkbox-row" title="켜면 테마별 고정 스크롤바를 사용하고, 끄면 브라우저 기본 스크롤바를 사용합니다.">
          <input id="tua-panel-fixed-scrollbar" type="checkbox">
          <span>스크롤 바 고정</span>
        </label>
        <label>유저 콩톡 닉네임
          <input id="tua-panel-user-nickname" type="text" maxlength="16" placeholder="me" title="유저 메시지 옆에 표시할 이름/이모지입니다. 최대 4글자, 비우면 표시하지 않습니다.">
        </label>
        <label>채팅창 폰트 크기(px)
          <input id="tua-panel-font" type="number" min="10" max="24" step="1">
        </label>
        <label>캐릭터 말투 고정 메모
          <textarea id="tua-panel-voice-note" rows="5" placeholder="예: 말투는 담백하고 약간 건조함. 과한 칭찬/애정표현 금지. 농담은 짧게, 위로는 현실적으로. 문장 끝을 너무 다정하게 늘리지 않기."></textarea>
        </label>
        <details class="tua-advanced-settings">
          <summary>고급 설정</summary>
          <label class="tua-checkbox-row" title="끄면 전용 API 요청에서 프리셋을 빼 토큰 사용량을 줄입니다. 대신 기존 RP 프리셋의 문체/규칙 영향이 줄어들 수 있습니다.">
            <input id="tua-panel-include-preset" type="checkbox">
            <span>프리셋 포함</span>
          </label>
          <label class="tua-checkbox-row" title="끄면 콩톡 프롬프트에서 활성 로어북/월드 인포 내용을 제외해 토큰 사용량을 줄입니다.">
            <input id="tua-panel-include-lorebook" type="checkbox">
            <span>로어북 포함</span>
          </label>
          <label class="tua-checkbox-row" title="끄면 SillyTavern 또는 다른 확장이 제공하는 메모리/요약 텍스트를 콩톡 프롬프트에서 제외합니다. 이 정보가 현재 환경에서 노출되지 않으면 자동으로 비어 있습니다.">
            <input id="tua-panel-include-extension-memory" type="checkbox">
            <span>확장 메모리 포함</span>
          </label>
          <label>답변 목표 토큰 수
            <input id="tua-panel-tokens" type="number" min="100" max="8000" step="50">
          </label>
          <label>최근 RP 읽을 메시지 수
            <input id="tua-panel-recent" type="number" min="0" max="100" step="1">
          </label>
          <label>콩톡 기억 범위
            <input id="tua-panel-memory" type="number" min="5" max="80" step="1" title="답장할 때 참고할 이 방의 이전 메시지 수입니다. 방금 입력한 메시지는 여기에 추가로 들어갑니다.">
          </label>
          <label>직장 동료 업무 메모
            <textarea id="tua-panel-coworker-note" rows="5" placeholder="예: 유저는 유치원 선생님이다. 주 업무는 알림장 작성, 주간 놀이계획안 정리, 학부모 안내문 작성, 행사 준비, 교실 환경 정리, 아이들 관찰 기록, 출결 확인이다."></textarea>
          </label>
          <button type="button" id="tua-export-rooms" class="tua-danger-light">이 캐릭터 대화 내보내기</button>
          <button type="button" id="tua-import-rooms" class="tua-danger-light">이 캐릭터 대화 가져오기</button>
          <input id="tua-import-file" type="file" accept="application/json,.json" style="display:none">
          <button type="button" id="tua-reset-all-rooms" class="tua-danger-light">모든 대화 내역 초기화</button>
        </details>
        <div id="tua-status" class="tua-status" aria-hidden="true" style="display:none"></div>
      </div>
      <div id="tua-messages" class="tua-messages"></div>
      <div class="tua-input-row">
        <textarea id="tua-input" placeholder="메시지를 입력하세요…"></textarea>
        <button type="button" id="tua-send" title="전송 / 빈 입력이면 이어쓰기" aria-label="전송 / 빈 입력이면 이어쓰기">🐶</button>
      </div>
      <div id="tua-resize-handle" title="창 크기 조절" aria-hidden="true"></div>
    </div>
    <button type="button" id="tua-collapsed-button" title="콩고물 톡 펼치기"><span class="tua-collapsed-emoji">🐕</span></button>`;
  document.body.appendChild(panelEl);

  $('#tua-close').on('click', () => setPanelVisible(false));
  $('#tua-collapse').on('click', (e) => { e.preventDefault(); e.stopPropagation(); setPanelCollapsed(true); });
  $('#tua-collapsed-button').on('click', (e) => { e.preventDefault(); e.stopPropagation(); if (collapsedButtonSuppressClick) { collapsedButtonSuppressClick = false; return; } setPanelCollapsed(false); setPanelVisible(true); });
  $('#tua-settings-open').on('click', (e) => { e.preventDefault(); e.stopPropagation(); closeRoomList(); closeModePicker(); $('#tua-in-panel-settings').toggleClass('open'); });
  $('#tua-active-room-title').on('click', (e) => { e.preventDefault(); closeSettingsPanel(); closeModePicker(); toggleRoomList(); });
  $('#tua-new-room').on('click', (e) => { e.preventDefault(); closeSettingsPanel(); closeRoomList(); toggleModePicker(); });
  $('#tua-roombar-toggle').on('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleRoomActionsCollapsed(); });
  $('#tua-delete-room').on('click', () => { closeSettingsPanel(); closeRoomList(); closeModePicker(); if (confirm('채팅방을 삭제하시겠습니까?')) deleteRoom(activeRoomId); });
  $('#tua-pin-room').on('click', () => { closeSettingsPanel(); toggleActiveRoomPinned(); });
  $('#tua-send').on('click', (e) => { e.preventDefault(); e.stopPropagation(); closeSettingsPanel(); closeRoomList(); closeModePicker(); sendCurrentInput(); });
  $('#tua-input').on('focus click', () => { closeSettingsPanel(); closeRoomList(); closeModePicker(); });
  $('#tua-input').on('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); closeSettingsPanel(); closeRoomList(); closeModePicker(); sendCurrentInput(); } });
  $('#tua-input').on('input', autoGrowInput);
  $('#tua-panel-tokens,#tua-panel-recent,#tua-panel-memory,#tua-panel-font,#tua-panel-user-nickname').on('change blur', readPanelSettingsUI);
  $('#tua-panel-include-preset,#tua-panel-include-lorebook,#tua-panel-include-extension-memory,#tua-panel-fixed-scrollbar').on('change', readPanelSettingsUI);
  $('#tua-panel-voice-note,#tua-panel-coworker-note').on('change input', readPanelSettingsUI);
  $('.tua-theme-buttons button').on('click', function(e) {
    e.preventDefault();
    const key = $(this).data('theme');
    if (!THEMES[key]) return;
    const st = getSettings();
    st.theme = key;
    saveSettings();
    hydratePanelSettingsUI();
    applyVisualSettings();
    setStatus(`테마를 ${THEMES[key].label}(으)로 변경했습니다.`);
  });
  $('#tua-export-rooms').on('click', exportCurrentCharacterRooms);
  $('#tua-import-rooms').on('click', () => $('#tua-import-file').trigger('click'));
  $('#tua-import-file').on('change', importCurrentCharacterRooms);
  $('#tua-reset-all-rooms').on('click', resetAllRoomsForCurrentCharacter);
  $('#tua-messages').on('click', () => { closeSettingsPanel(); closeRoomList(); closeModePicker(); });

  makePanelDraggable();
  makePanelResizable();
  bindPanelViewportRepairEvents();

  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry || !panelEl?.classList.contains('tua-visible') || panelEl?.classList.contains('tua-collapsed')) return;
      if (resizingPanel || isPanelSizeInputFocused()) return;
      const s = getSettings();
      const rect = entry.contentRect;
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (isCompactViewport() || isPanelViewportConstrained()) return;
      if (Math.abs(width - s.panelWidth) > 6 || Math.abs(height - s.panelHeight) > 6) {
        const next = normalizePanelSize(width, height, false);
        s.panelWidth = next.width;
        s.panelHeight = next.height;
        saveSettings();
        hydratePanelSettingsUI();
      }
    });
    resizeObserver.observe(panelEl);
  }
}



function makePanelResizable() {
  if (!panelEl || panelEl.dataset.resizeReady === '1') return;
  panelEl.dataset.resizeReady = '1';
  const handle = panelEl.querySelector('#tua-resize-handle');
  if (!handle) return;

  const startResize = (e) => {
    if (panelEl.classList.contains('tua-collapsed')) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = panelEl.getBoundingClientRect();
    resizingPanel = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      pointerId: e.pointerId
    };
    panelEl.classList.add('tua-resizing');
    document.body.classList.add('tua-panel-resizing-body');
    try { handle.setPointerCapture?.(e.pointerId); } catch {}
  };

  const moveResize = (e) => {
    if (!resizingPanel) return;
    e.preventDefault();
    const width = resizingPanel.startWidth + (e.clientX - resizingPanel.startX);
    const height = resizingPanel.startHeight + (e.clientY - resizingPanel.startY);
    const next = normalizePanelSize(width, height, false);
    document.documentElement.style.setProperty('--tua-panel-width', `${next.width}px`);
    document.documentElement.style.setProperty('--tua-panel-height', `${next.height}px`);
    if (Number.isFinite(Number(getSettings().panelLeft)) && Number.isFinite(Number(getSettings().panelTop))) {
      const pos = clampPanelPosition(getSettings().panelLeft, getSettings().panelTop);
      panelEl.style.left = `${pos.left}px`;
      panelEl.style.top = `${pos.top}px`;
    }
  };

  const endResize = (e) => {
    if (!resizingPanel) return;
    const width = resizingPanel.startWidth + (e.clientX - resizingPanel.startX);
    const height = resizingPanel.startHeight + (e.clientY - resizingPanel.startY);
    resizingPanel = null;
    panelEl.classList.remove('tua-resizing');
    document.body.classList.remove('tua-panel-resizing-body');
    applyPanelSize(width, height, 'drag');
  };

  handle.addEventListener('pointerdown', startResize);
  window.addEventListener('pointermove', moveResize);
  window.addEventListener('pointerup', endResize);
  window.addEventListener('pointercancel', endResize);
}

function getViewportBounds() {
  const vv = window.visualViewport;
  const width = Number(vv?.width) || Number(window.innerWidth) || PANEL_DEFAULT_WIDTH;
  const height = Number(vv?.height) || Number(window.innerHeight) || PANEL_DEFAULT_HEIGHT;
  const left = Number(vv?.offsetLeft) || 0;
  const top = Number(vv?.offsetTop) || 0;
  return { left, top, width, height };
}

function getPanelViewportMargin() {
  // The collapsed launcher may sit flush against any viewport edge.
  // The expanded panel keeps the existing 8px inset on compact viewports.
  return panelEl?.classList.contains('tua-collapsed') ? 0 : (isCompactViewport() ? 8 : 0);
}

function clampPanelPosition(left, top) {
  const s = getSettings();
  const panel = panelEl;
  if (!panel) return { left, top };
  const rect = panel.getBoundingClientRect();
  const bounds = getViewportBounds();
  const margin = getPanelViewportMargin();
  const w = Math.min(rect.width || s.panelWidth || PANEL_DEFAULT_WIDTH, Math.max(1, bounds.width - margin * 2));
  const h = Math.min(rect.height || s.panelHeight || PANEL_DEFAULT_HEIGHT, Math.max(1, bounds.height - margin * 2));
  const minLeft = bounds.left + margin;
  const minTop = bounds.top + margin;
  const maxLeft = Math.max(minLeft, bounds.left + bounds.width - w - margin);
  const maxTop = Math.max(minTop, bounds.top + bounds.height - h - margin);
  const snap = 14;
  let nextLeft = Math.max(minLeft, Math.min(Number.isFinite(Number(left)) ? Number(left) : minLeft, maxLeft));
  let nextTop = Math.max(minTop, Math.min(Number.isFinite(Number(top)) ? Number(top) : minTop, maxTop));
  if (nextLeft - minLeft <= snap) nextLeft = minLeft;
  else if (maxLeft - nextLeft <= snap) nextLeft = maxLeft;
  if (nextTop - minTop <= snap) nextTop = minTop;
  else if (maxTop - nextTop <= snap) nextTop = maxTop;
  return {
    left: nextLeft,
    top: nextTop
  };
}

function applyPanelPosition() {
  if (!panelEl) return;
  const s = getSettings();
  if (Number.isFinite(Number(s.panelLeft)) && Number.isFinite(Number(s.panelTop))) {
    const pos = clampPanelPosition(s.panelLeft, s.panelTop);
    panelEl.style.left = `${pos.left}px`;
    panelEl.style.top = `${pos.top}px`;
    panelEl.style.right = 'auto';
    panelEl.style.bottom = 'auto';
  } else {
    panelEl.style.left = 'auto';
    panelEl.style.top = 'auto';
    panelEl.style.right = '0px';
    panelEl.style.bottom = '0px';
  }
}

function makePanelDraggable() {
  if (!panelEl || panelEl.dataset.draggableReady === '1') return;
  panelEl.dataset.draggableReady = '1';
  const header = panelEl.querySelector('.tua-header');
  const collapsedButton = panelEl.querySelector('#tua-collapsed-button');

  const startDrag = (clientX, clientY, pointerId, originalEvent, options = {}) => {
    if (!options.allowButton && originalEvent?.target?.closest?.('button, select, input, textarea')) return;
    const rect = panelEl.getBoundingClientRect();
    draggingPanel = {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      startX: clientX,
      startY: clientY,
      pointerId,
      moved: false,
      collapsedButton: !!options.collapsedButton
    };
    panelEl.classList.add('tua-dragging');
    document.body.classList.add('tua-panel-dragging-body');
    if (originalEvent?.preventDefault) originalEvent.preventDefault();
  };

  const moveDrag = (clientX, clientY, originalEvent) => {
    if (!draggingPanel) return;
    if (Math.abs(clientX - draggingPanel.startX) > 3 || Math.abs(clientY - draggingPanel.startY) > 3) draggingPanel.moved = true;
    const pos = clampPanelPosition(clientX - draggingPanel.offsetX, clientY - draggingPanel.offsetY);
    panelEl.style.left = `${pos.left}px`;
    panelEl.style.top = `${pos.top}px`;
    panelEl.style.right = 'auto';
    panelEl.style.bottom = 'auto';
    if (originalEvent?.preventDefault) originalEvent.preventDefault();
  };

  const endDrag = () => {
    if (!draggingPanel) return;
    const wasCollapsedButton = draggingPanel.collapsedButton;
    const moved = draggingPanel.moved;
    const wasCollapsedButtonDrag = wasCollapsedButton && moved;
    const shouldOpenCollapsedButton = wasCollapsedButton && !moved;
    const rect = panelEl.getBoundingClientRect();
    const pos = clampPanelPosition(rect.left, rect.top);
    const s = getSettings();
    s.panelLeft = Math.round(pos.left);
    s.panelTop = Math.round(pos.top);
    saveSettings();
    panelEl.classList.remove('tua-dragging');
    document.body.classList.remove('tua-panel-dragging-body');
    draggingPanel = null;
    if (wasCollapsedButtonDrag) {
      collapsedButtonSuppressClick = true;
      window.setTimeout(() => { collapsedButtonSuppressClick = false; }, 350);
      return;
    }
    if (shouldOpenCollapsedButton) {
      collapsedButtonSuppressClick = true;
      setPanelCollapsed(false);
      setPanelVisible(true);
      window.setTimeout(() => { collapsedButtonSuppressClick = false; }, 350);
    }
  };

  if (header) header.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, 'mouse', e));
  if (collapsedButton) collapsedButton.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, 'mouse-collapsed', e, { allowButton: true, collapsedButton: true }));
  document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY, e));
  document.addEventListener('mouseup', endDrag);

  if (header) header.addEventListener('touchstart', (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    startDrag(t.clientX, t.clientY, 'touch', e);
  }, { passive: false });
  if (collapsedButton) collapsedButton.addEventListener('touchstart', (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    startDrag(t.clientX, t.clientY, 'touch-collapsed', e, { allowButton: true, collapsedButton: true });
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    moveDrag(t.clientX, t.clientY, e);
  }, { passive: false });
  document.addEventListener('touchend', endDrag);
  document.addEventListener('touchcancel', endDrag);
}


function closeSettingsPanel() {
  $('#tua-in-panel-settings').removeClass('open');
}

function closeRoomList() {
  $('#tua-room-list').removeClass('open');
}

function closeModePicker() {
  $('#tua-mode-picker').removeClass('open');
}

function toggleModePicker(force) {
  const picker = $('#tua-mode-picker');
  if (!picker.length) return;
  renderModePicker();
  if (typeof force === 'boolean') picker.toggleClass('open', force);
  else picker.toggleClass('open');
}

function renderModePicker() {
  const picker = $('#tua-mode-picker');
  if (!picker.length) return;
  picker.empty();
  picker.append('<div class="tua-mode-picker-title">어떤 모드로 시작할까요?</div>');
  const buttons = $('<div class="tua-mode-picker-buttons"></div>');
  for (const [key, mode] of Object.entries(MODES)) {
    buttons.append(`<button type="button" data-mode="${escapeHtml(key)}">${escapeHtml(mode.label)}</button>`);
  }
  picker.append(buttons);
  picker.find('button[data-mode]').on('click', async function () {
    const button = $(this);
    if (button.data('busy')) return;
    button.data('busy', true).prop('disabled', true);
    try {
      const modeKey = migrateModeKey(button.data('mode'));
      await createRoomWithModeIntro(modeKey);
    } finally {
      button.data('busy', false).prop('disabled', false);
    }
  });
}

function applyRoomActionsCollapseState() {
  const settings = getSettings();
  const collapsed = settings.roomActionsCollapsed !== false;
  if (panelEl) panelEl.classList.toggle('tua-room-actions-collapsed', collapsed);
  const button = $('#tua-roombar-toggle');
  if (button.length) {
    button.text(collapsed ? '⋯' : '‹')
      .attr('title', collapsed ? '대화방 관리 버튼 펼치기' : '대화방 관리 버튼 접기')
      .attr('aria-label', collapsed ? '대화방 관리 버튼 펼치기' : '대화방 관리 버튼 접기');
  }
}

function setRoomActionsCollapsed(collapsed) {
  const s = getSettings();
  s.roomActionsCollapsed = !!collapsed;
  if (s.roomActionsCollapsed) closeModePicker();
  saveSettings();
  applyRoomActionsCollapseState();
}

function toggleRoomActionsCollapsed() {
  const current = getSettings().roomActionsCollapsed !== false;
  setRoomActionsCollapsed(!current);
}

function setPanelCollapsed(collapsed) {
  const s = getSettings();
  s.collapsed = !!collapsed;
  saveSettings();
  if (panelEl) panelEl.classList.toggle('tua-collapsed', !!collapsed);
}

function exportCurrentCharacterRooms() {
  try {
    const payload = {
      app: 'Konggomul Talk',
      version: EXTENSION_VERSION,
      exportedAt: new Date().toISOString(),
      characterKey: getCharKey(),
      characterName: getCharName(),
      data: roomState || { rooms: [] }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = getCharKey().replace(/[^a-zA-Z0-9가-힣_.-]/g, '_');
    a.href = url;
    a.download = `konggomul-talk-${safeName}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('현재 캐릭터 대화를 내보냈습니다.');
  } catch (e) {
    console.error('[Konggomul] export failed', e);
    setStatus('내보내기에 실패했습니다.');
  }
}

function normalizeImportedRoomState(raw) {
  const imported = raw?.data && Array.isArray(raw.data.rooms) ? raw.data : raw;
  if (!imported || !Array.isArray(imported.rooms)) throw new Error('올바른 콩고물 톡 백업 파일이 아닙니다.');
  const next = {
    rooms: imported.rooms.map(room => ({
      id: String(room.id || ('room_' + Date.now() + '_' + Math.random().toString(16).slice(2))),
      title: String(room.title || defaultRoomTitle(room.createdAt || Date.now(), room.mode)),
      createdAt: Number(room.createdAt || Date.now()),
      mode: migrateModeKey(room.mode),
      pinned: !!room.pinned,
      messages: Array.isArray(room.messages) ? room.messages.map(m => ({
        id: String(m.id || ('msg_' + Date.now() + '_' + Math.random().toString(16).slice(2))),
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || ''),
        at: Number(m.at || Date.now()),
        ...(m.error ? { error: true } : {})
      })) : []
    })),
    voiceNote: typeof imported.voiceNote === 'string' ? imported.voiceNote : ''
  };
  if (!next.rooms.length) {
    next.rooms.push({ id: 'room_' + Date.now(), title: defaultRoomTitle(Date.now(), 'kongtalk'), createdAt: Date.now(), lastMessageAt: 0, mode: 'kongtalk', pinned: false, messages: [] });
  }
  return next;
}

function importCurrentCharacterRooms(e) {
  const input = e?.target;
  const file = input?.files?.[0];
  if (!file) return;
  if (!confirm('가져오면 현재 캐릭터의 콩고물 톡 대화가 백업 파일 내용으로 교체됩니다. 계속할까요?')) {
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      roomState = normalizeImportedRoomState(parsed);
      const importedAt = Date.now();
      roomState.resetAt = importedAt;
      roomState.updatedAt = importedAt;
      roomState.deletedRooms = {};
      roomState.deletedMessages = {};
      for (const room of roomState.rooms || []) room.updatedAt = Math.max(Number(room.updatedAt || 0), importedAt);
      activeRoomId = roomState.rooms[0]?.id || null;
      await saveRooms();
      renderAll();
      setStatus('현재 캐릭터 대화를 가져왔습니다.');
    } catch (err) {
      console.error('[Konggomul] import failed', err);
      alert(`가져오기에 실패했습니다: ${err.message || err}`);
      setStatus('가져오기에 실패했습니다.');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

function resetAllRoomsForCurrentCharacter() {
  if (!confirm('현재 캐릭터의 모든 대화 내역을 초기화하시겠습니까?')) return;
  const resetAt = Date.now();
  const deletedRooms = {};
  const deletedMessages = {};
  for (const room of roomState.rooms || []) {
    if (room?.id) deletedRooms[String(room.id)] = resetAt;
    for (const message of room?.messages || []) {
      if (message?.id) deletedMessages[String(message.id)] = resetAt;
    }
  }
  roomState = { rooms: [], resetAt, deletedRooms, deletedMessages, updatedAt: resetAt };
  createRoom(false, 'kongtalk', true);
  saveRooms();
  renderAll();
  scrollMessagesToBottom();
  setStatus('이 캐릭터의 대화를 초기화했습니다.');
}

function renameRoomById(id) {
  const room = roomState.rooms.find(r => r.id === id);
  if (!room) return;
  if (!confirm('채팅방 이름을 변경하시겠습니까?')) return;
  const next = prompt('새 채팅방 이름', room.title || '');
  if (!next || !next.trim()) return;
  room.title = next.trim();
  room.updatedAt = Date.now();
  saveRooms();
  renderAll();
  setStatus('채팅방 이름을 변경했습니다.');
}

function renameActiveRoom() {
  renameRoomById(activeRoomId);
}

function setPanelVisible(show, { persistPreference = true } = {}) {
  ensurePanel();
  panelEl.classList.toggle('tua-visible', !!show);
  if (show) {
    panelEl.classList.toggle('tua-collapsed', !!getSettings().collapsed);
    applyVisualSettings();
    applyPanelPosition();
    scrollMessagesToBottom();
  }
  if (persistPreference) {
    const settings = getSettings();
    settings.openOnStart = !!show;
    saveSettings();
  }
}

function togglePanel() { ensurePanel(); setPanelVisible(!panelEl.classList.contains('tua-visible')); }


function getRoleAssignmentDeclaration(modeKey) {
  const userName = ctx().name1 || '{{user}}';
  const map = {
    butler: `저는 이제 ${userName}의 집사입니다. ${userName}의 일상과 고민을 살피고, 질문에 대답하고, 원하는 것은 무엇이든 최선을 다해서 돕는 집사의 역할을 충실히 이행하겠습니다.`,
    pet: `저는 이제 ${userName}의 펫입니다. 저는 ${userName}에게서 사랑 받는 것이 가장 기쁜 존재인 펫의 역할에 충실할 것입니다. 멍. (또는 야옹.)`,
    rpAssistant: `저는 이제 ${userName}의 전용 RP 어시입니다. 현재 롤플의 상황과 감정의 흐름을 함께 살피며 ${userName}이 원하는 방향으로 진행되도록 돕고 OOC를 제작해드리겠습니다.`
  };
  return map[modeKey] || '';
}

function buildParallelIntroInstruction(reverseMode = true) {
  const charName = getCharName();
  const userName = getUserName();
  const identityRule = reverseMode
    ? `This person has only the same name, face, and age as the show character; give them a different job, different life, clearly opposite personality and way of speaking, and a newly generated AU relationship with the current ${userName}.`
    : `This person has the same name, face, age, core personality, and way of speaking as the show character; give them a different modern job, a different AU life context when needed, and a newly generated AU relationship with the current ${userName}. Do not invert their personality or speech style.`;
  const voiceRule = reverseMode
    ? `Keep the opposite personality and speech style natural in the actual message. Do not explain the contrast or copy a fixed example tone.`
    : `Keep the familiar personality and speech style natural in the actual message. Do not explain the AU premise or copy a fixed example tone.`;
  return `This is the first assistant message in a newly created alternate private conversation.
Do not start with a greeting or explain the setup, AU label, internal premise, or any internal terminology.
First, create the alternate modern identity of ${charName}. ${identityRule} Output it using this exact Korean profile block:

이름: ${charName}
나이: [age]
직업: [modern job different from the show character's role or archetype]
${userName}와의 관계: [new AU relationship with the current ${userName}; do not copy the RP relationship]
---

After the profile block, write a natural Korean reaction to the most recent RP scene, memory, or narrative flow as the show you and ${userName} are watching together right now. The shared viewing session is already established: do not frame this as a remote text or call, and do not tell ${userName} to come, return, hurry, wait, or move somewhere. Do not turn the opening into a plan for food, errands, purchases, preparations, or a later activity; keep the conversational hook on the show scene itself.
${voiceRule}
Let the reaction be positive, negative, affectionate, teasing, impressed, annoyed, amused, romantic, or mixed according to this AU identity and the current user's tone. The profile establishes the AU relationship; do not copy the RP relationship, and keep the new relationship consistent later.
Refer to show characters naturally by name or third-person phrasing. Do not write as if the show persona is the current ${userName}. Do not repeatedly refer to the show character as having your face, your name, or your identity.
Write only the completed Korean first reply.`;
}

function buildCoworkerIntroInstruction() {
  return `This is only the opening message of a newly created private conversation. {char} and {user} are already coworkers on the same company/team; this premise is simply true in this room.
There is no role declaration to read aloud. Do not announce or explain the coworker setup. Start directly in natural Korean chat as {char}, as though both have already become coworkers.
This opening is not a work request. Do not invent, complete, claim to have handled, or refer to any specific task, customer issue, schedule, document, product, message, work event, or work result. Do not pretend that {char} has already checked notes, processed work, or prepared something for {user}. Do not use the work note, RP context, lorebook, persona material, or memory to fabricate an opening work situation.
Keep this first reply light and brief: one short conversational paragraph or a few natural sentences. Let {char}'s personality and current mood shape it. A familiar coworker-like opening, casual company, or a suggestion such as sharing lunch can fit when natural, but do not mechanically copy an example. Actual work help begins only after {user} asks for it.
Write only {char}'s first Korean direct-chat reply. Do not output system notes, labels, speaker prefixes, explanations, or internal terms such as room type, internal setup name, prompt, instruction, system, or extension.`;
}

function buildRoomIntroInstruction(modeKey) {
  const mode = migrateModeKey(modeKey);
  if (mode === 'parallel' || mode === 'parallelClassic') return buildParallelIntroInstruction(mode === 'parallel');
  if (mode === 'coworker') return buildCoworkerIntroInstruction();
  const declaration = getRoleAssignmentDeclaration(mode);
  if (!declaration) return '';
  return `This is the first assistant message in a newly created private conversation. {char} has just been handed the Korean role declaration below and is reading it aloud to {user}.
---
${declaration}
---

Have {char} actually read the declaration aloud in Korean as the first part of the reply. The declaration is not a separate card, outside message, or system note: it is being read by {char} in their own voice.
Focus on completing the reading first. {char} may make brief in-character pauses or small reactions while reading, but the interruptions must stay short and {char} must immediately return to the next part of the declaration. Do not turn the reading into a long commentary, scene recap, explanation, or discussion before it is finished.
Read every sentence and preserve the declaration's actual wording and meaning; do not replace it with a vague paraphrase or turn it into a feature list, duty list, service manual, tools list, output types, procedures, formats, or internal mechanics.
Only after the declaration has been fully read aloud, let {char} react to receiving and accepting the role in their own personality and current relationship with {user}, then naturally open the conversation. The declaration's formal honorific Korean is only the wording being read aloud; as soon as the reading ends, immediately return to {char}'s normal Korean speech level, endings, and verbal habits from the character card. Do not keep using honorific Korean merely because the declaration did.
Write only {char}'s first Korean direct-chat reply. Do not output system notes, labels, speaker prefixes, explanations, or internal terms such as room type, internal setup name, prompt, instruction, system, or extension.`;
}

async function generateRoomIntroReply(modeKey) {
  const settings = getSettings();
  const mode = migrateModeKey(modeKey);
  const instruction = buildRoomIntroInstruction(mode);
  const declaration = getRoleAssignmentDeclaration(mode);
  if (!instruction) return getKongtalkIntroIcon() || '';
  const systemPrompt = await buildSystemPrompt('', mode, instruction);
  const isCoworker = mode === 'coworker';
  const isParallel = mode === 'parallel' || mode === 'parallelClassic';
  const promptContent = isCoworker
    ? 'Begin the coworker conversation now in natural Korean direct chat. The coworker premise is already true. This is only a light opening, not a work request. Do not read or announce a declaration, explain the setup, invent any work situation, or claim to have completed or prepared work.'
    : isParallel
      ? 'Begin the Parallel Universe AU first reply now. First output the required Korean profile block, then react naturally to the RP show that {char} and {user} are watching together in the same shared present. Do not read or announce a role declaration. Do not frame this as a remote text or call, tell {user} to come, return, hurry, or wait, or start arranging food, orders, preparations, or later activities. Keep the final hook on the show scene.'
      : `Read the following Korean role declaration aloud in your first reply. Complete the reading first. Small in-character reactions are allowed while reading, but keep them brief and immediately continue from the next part; do not turn the reading into a long commentary before the declaration is finished. Read every sentence, preserving its actual wording and meaning. After it is fully read, immediately return to {char}'s normal Korean speech level, endings, and verbal habits from the character card; do not keep using honorific Korean merely because the declaration did. Then continue with your natural reaction to receiving the role and begin the conversation. Do not introduce it as a system note or use a label.

${declaration}`;
  const prompt = [{ role: 'user', content: promptContent }];
  const tail = isCoworker
    ? 'Answer now. Begin as {char} in brief, direct Korean coworker chat only. Keep it to a light opening; do not announce or explain the setup, do not turn the reply into a scene, and do not invent, mention, complete, or claim to have handled any task, work event, customer issue, document, schedule, or deliverable. Wait until {user} asks before giving work help.'
    : isParallel
      ? 'Answer now. Output the required Korean AU profile block, then one natural direct-chat reaction to the show being watched together. Do not use remote/call wording, tell {user} to come or hurry, or arrange what to order, prepare, or do next. End on an immediately answerable show reaction.'
      : 'Answer now. Read the assigned Korean declaration aloud in character, prioritizing completion of the reading before any longer reaction. Once the reading ends, immediately return to {char}\'s normal Korean speech level and verbal habits from the character card; do not keep using honorific Korean merely because the declaration did. Then continue as {char} in direct chat only. Do not turn the reply into a scene.';
  return await generateWithSelectedProfile(systemPrompt, prompt, settings.maxTokens || 1000, tail);
}

async function createRoomWithModeIntro(modeKey) {
  const mode = migrateModeKey(modeKey);
  closeModePicker();
  closeRoomList();
  closeSettingsPanel();
  const room = createRoom(false, mode, mode === 'kongtalk');
  renderAll();
  setPanelVisible(true);
  $('#tua-input').trigger('focus');
  if (mode === 'kongtalk') {
    normalizeKongtalkIntro(room, { ensureIntro: true });
    await saveRooms();
    renderAll();
    scrollMessagesToBottom();
    setStatus(`새 ${MODES[mode].label} 방을 시작했습니다.`);
    return room;
  }
  const introAt = Date.now();
  const loadingId = 'msg_intro_loading_' + introAt;
  const loadingAt = introAt;
  room.messages.push({ id: loadingId, role: 'assistant', content: '...', at: loadingAt, loading: true });
  room.updatedAt = loadingAt;
  renderMessages();
  setStatus(`${MODES[mode].label} 첫 톡을 생성하는 중입니다.`);
  try {
    const reply = sanitizeAssistantReply(await generateRoomIntroReply(mode));
    const msg = room.messages.find(m => m.id === loadingId);
    if (msg) { msg.content = reply; msg.loading = false; }
    setStatus(`새 ${MODES[mode].label} 방을 시작했습니다.`);
  } catch (e) {
    const msg = room.messages.find(m => m.id === loadingId);
    if (msg) { msg.content = `오류: ${e.message || e}`; msg.loading = false; msg.error = true; }
    setStatus('첫 톡 생성에 실패했습니다. 다시 시도해 주세요.');
    console.error('[Konggomul] room intro failed', e);
  }
  room.updatedAt = Date.now();
  await saveRooms();
  renderAll();
  scrollMessagesToBottom();
  return room;
}

function getRecentKongtalkLines(limit = 10) {
  const room = getActiveRoom();
  return (room?.messages || [])
    .filter(m => !m.loading && !m.error && String(m.content || '').trim())
    .slice(-limit)
    .map(m => `${m.role === 'user' ? '{{user}}' : getCharName()}: ${String(m.content || '').trim()}`);
}

async function generateKongtalkSummaryForMain() {
  const lines = getRecentKongtalkLines(10);
  if (!lines.length) throw new Error('요약할 콩고물 톡 메시지가 없습니다.');
  const userName = getUserName();
  const charName = getCharName();
  const systemPrompt = `You summarize a separate side conversation so it can be inserted into the main RP as context.
Return the entire inserted note in English only. Do not use Korean.
Do not continue the RP scene yourself.
Do not write a vague one-paragraph summary. Make it detailed enough that the main RP can continue with this side conversation reflected.
Use the exact names below and do not invent or merge names:
- User name: ${userName}
- Character name: ${charName}

Required output format:
OOC: ${userName} and ${charName} had the following side conversation while the ongoing RP was paused. Reflect this side conversation and continue the RP.

The user and the character exchanged the following side-conversation messages:
- [Write 8-14 detailed bullet points in English.]
- [Include what the user said, what the character answered, emotional shifts, decisions, refusals, requests, promises, boundaries, and relationship beats when present.]
- [Preserve important nuance and continuity. Do not compress major emotional turns into one sentence.]
- [When the exchange contains a declaration, conflict, emotional reversal, agreement, or boundary, state it clearly.]

Continue the RP while reflecting this text conversation.

Rules:
- English only. Do not output Korean.
- Start with exactly the English label "OOC:".
- Do not mention prompts, extensions, AI, models, or systems.
- Do not add new facts that were not in the messages.
- Do not copy every line verbatim, but preserve enough detail for continuity.
- Do not use malformed combined names. Use only ${userName} and ${charName}.`;
  const prompt = [{ role: 'user', content: lines.join('\n') }];
  const settings = getSettings();
  const max = Math.min(settings.maxTokens || 1000, 1400);
  return await generateWithSelectedProfile(systemPrompt, prompt, max, `MESSAGES TO SUMMARIZE:
${lines.join('\n')}

Summary now.`);
}

async function summarizeRecentKongtalkToMain() {
  if (!confirm('최근 콩고물 톡 10건을 요약해 RP에 삽입할까요?')) return;
  try {
    setStatus('최근 콩고물 톡 10건을 요약하는 중입니다.');
    const summary = sanitizeAssistantReply(await generateKongtalkSummaryForMain());
    sendToMainChat(summary);
  } catch (e) {
    console.error('[Konggomul] RP summary failed', e);
    alert(`RP 반영 요약에 실패했습니다: ${e.message || e}`);
    setStatus('RP 반영 요약에 실패했습니다.');
  }
}

function refreshSendButtonState() {
  const send = $('#tua-send');
  if (!send.length) return;
  if (generationInFlight) {
    send.text('...').attr('title', '생성 중 · 누르면 중지').attr('aria-label', '생성 중 · 누르면 중지').prop('disabled', false);
  } else {
    send.text(getTheme().sendIcon).attr('title', '전송 / 빈 입력이면 이어쓰기').attr('aria-label', '전송 / 빈 입력이면 이어쓰기').prop('disabled', false);
  }
}

function setComposerBusy(isBusy) {
  $('#tua-input').prop('disabled', !!isBusy);
  refreshSendButtonState();
  if (panelEl) panelEl.classList.toggle('tua-generating', !!isBusy);
}

function isAbortError(error) {
  return error?.name === 'AbortError' || /aborted|abort/i.test(String(error?.message || error || ''));
}

function ensureDeletedMessagesMap() {
  if (!roomState.deletedMessages || typeof roomState.deletedMessages !== 'object' || Array.isArray(roomState.deletedMessages)) roomState.deletedMessages = {};
  return roomState.deletedMessages;
}

function markMessageDeleted(id, at = Date.now()) {
  const key = String(id || '');
  if (!key) return;
  ensureDeletedMessagesMap()[key] = Number(at || Date.now());
}

function isStandaloneEllipsisContent(content) {
  const text = String(content || '').trim();
  return text === '...' || text === '…' || text === '⋯';
}

function removeGenerationLoadingMessages(task) {
  if (!task?.roomId || !task?.loadingId) return false;
  const room = (roomState.rooms || []).find(item => item.id === task.roomId);
  if (!room?.messages) return false;
  const targetId = String(task.loadingId || '');
  const removedIds = [];
  const before = room.messages.length;
  room.messages = room.messages.filter(item => {
    const id = String(item?.id || '');
    if (id === targetId) {
      if (id) removedIds.push(id);
      return false;
    }
    return true;
  });
  if (room.messages.length !== before) {
    const now = Date.now();
    for (const id of removedIds) markMessageDeleted(id, now);
    room.updatedAt = now;
    roomState.updatedAt = now;
    return true;
  }
  return false;
}

function removeStaleLoadingMessages(room) {
  if (!room?.messages) return false;
  const removedIds = [];
  const before = room.messages.length;
  room.messages = room.messages.filter(item => {
    const id = String(item?.id || '');
    const shouldRemove = isGenerationPlaceholderMessage(item);
    if (shouldRemove) {
      if (id) removedIds.push(id);
      return false;
    }
    return true;
  });
  if (room.messages.length !== before) {
    const now = Date.now();
    for (const id of removedIds) markMessageDeleted(id, now);
    room.updatedAt = now;
    roomState.updatedAt = now;
    return true;
  }
  return false;
}


function getActiveGenerationKeepLoadingId(roomId) {
  if (!generationInFlight || !activeGenerationTask || activeGenerationTask.cancelled || activeGenerationTask.completed) return '';
  if (String(activeGenerationTask.roomId || '') !== String(roomId || '')) return '';
  return String(activeGenerationTask.loadingId || '');
}

function isGenerationPlaceholderMessage(item) {
  const id = String(item?.id || '');
  if (item?.role !== 'assistant') return false;
  // Room-intro placeholders are controlled by createRoomWithModeIntro().
  // They must not be treated as ordinary send/stop placeholders, or a save/merge
  // during intro generation can remove the declaration/opening reply before it lands.
  if (id.startsWith('msg_intro_loading_')) return false;
  const ellipsisOnly = isStandaloneEllipsisContent(item?.content);
  if (item?.loading) return true;
  // A msg_loading_* id alone is not enough: older builds could accidentally keep that id on a completed reply.
  return ellipsisOnly || (id.startsWith('msg_loading_') && ellipsisOnly);
}

function isOrphanGenerationPlaceholder(item, roomId) {
  if (!isGenerationPlaceholderMessage(item)) return false;
  const keepLoadingId = getActiveGenerationKeepLoadingId(roomId);
  const id = String(item?.id || '');
  return !keepLoadingId || id !== keepLoadingId;
}

function pruneOrphanGenerationPlaceholders(room) {
  if (!room?.messages) return false;
  const removedIds = [];
  const before = room.messages.length;
  room.messages = room.messages.filter(item => {
    if (isOrphanGenerationPlaceholder(item, room.id)) {
      const id = String(item?.id || '');
      if (id) removedIds.push(id);
      return false;
    }
    return true;
  });
  if (room.messages.length !== before) {
    const now = Date.now();
    for (const id of removedIds) markMessageDeleted(id, now);
    room.updatedAt = now;
    roomState.updatedAt = now;
    return true;
  }
  return false;
}

async function cancelCurrentGeneration({ persist = true, render = true, announce = true } = {}) {
  const task = activeGenerationTask;
  if (!task || !generationInFlight) return;
  task.cancelled = true;
  try { task.controller?.abort(); } catch { /* best effort */ }

  removeGenerationLoadingMessages(task);
  if (activeGenerationTask?.id === task.id) {
    activeGenerationTask = null;
    generationInFlight = false;
    setComposerBusy(false);
  }
  if (persist && !cleanInProgress) await saveRooms();
  task.cancelCleanupComplete = true;
  if (render && runtimeActive) renderMessages();
  if (announce && runtimeActive) setStatus('생성을 중지했습니다.');
}

async function runAssistantGeneration({ text = '', continuation = false }) {
  const input = $('#tua-input');
  const currentCharKey = getCharKey();
  if (roomStateCharKey !== currentCharKey) {
    const loaded = await loadRooms({ expectedLifecycleEpoch: lifecycleEpoch });
    if (!loaded || roomStateCharKey !== currentCharKey) return;
  }
  if (!activeRoomId || !getActiveRoom()) createRoom(false, 'kongtalk', true);
  const initialRoom = getActiveRoom();
  if (continuation && !hasRealConversationMessage(initialRoom)) {
    setStatus('이을 대화가 아직 없어요. 먼저 메시지를 보내 주세요.');
    return;
  }

  const task = {
    id: ++generationTaskCounter,
    roomId: activeRoomId,
    loadingId: '',
    startedAt: Date.now(),
    requestCharKey: roomStateCharKey || getCharKey(),
    persistenceEpoch,
    lifecycleEpoch,
    cancelCleanupComplete: false,
    controller: new AbortController(),
    cancelled: false,
    completed: false,
  };
  activeGenerationTask = task;
  generationInFlight = true;
  setComposerBusy(true);

  try {
    if (!continuation) {
      input.val('');
      autoGrowInput();
      await appendMessage('user', text);
    }
    setPanelVisible(true);

    const room = (roomState.rooms || []).find(item => item.id === task.roomId);
    if (!room) return;
    removeStaleLoadingMessages(room);
    const loadingAt = Date.now();
    task.loadingId = 'msg_loading_' + loadingAt + '_' + Math.random().toString(16).slice(2);
    room.messages.push({ id: task.loadingId, role: 'assistant', content: '...', at: loadingAt, loading: true });
    room.updatedAt = loadingAt;
    await saveRooms();
    renderMessages();
    scrollMessagesToBottom();

    try {
      const reply = continuation
        ? await generateAssistantContinuation(task)
        : await generateAssistantReply(text, task);
      if (task.cancelled || getCharKey() !== task.requestCharKey) return;
      const currentRoom = (roomState.rooms || []).find(item => item.id === task.roomId);
      const msg = currentRoom?.messages?.find(item => item.id === task.loadingId);
      if (msg) {
        const doneAt = Date.now();
        const oldLoadingId = String(task.loadingId || '');
        msg.id = 'msg_' + doneAt + '_' + Math.random().toString(16).slice(2);
        msg.content = sanitizeAssistantReply(reply);
        msg.loading = false;
        msg.at = doneAt;
        currentRoom.lastMessageAt = doneAt;
        currentRoom.updatedAt = doneAt;
        markMessageDeleted(oldLoadingId, doneAt);
      }
      task.completed = true;
      task.loadingId = '';
    } catch (e) {
      if (task.cancelled || isAbortError(e) || getCharKey() !== task.requestCharKey) {
        removeGenerationLoadingMessages(task);
        if (!task.cancelCleanupComplete && !cleanInProgress && task.persistenceEpoch === persistenceEpoch) {
          await saveRooms();
          task.cancelCleanupComplete = true;
        }
        if (runtimeActive && task.lifecycleEpoch === lifecycleEpoch) renderMessages();
        return;
      }
      const currentRoom = (roomState.rooms || []).find(item => item.id === task.roomId);
      const msg = currentRoom?.messages?.find(item => item.id === task.loadingId);
      if (msg) {
        const doneAt = Date.now();
        const oldLoadingId = String(task.loadingId || '');
        msg.id = 'msg_' + doneAt + '_' + Math.random().toString(16).slice(2);
        msg.content = `오류: ${e.message || e}`;
        msg.loading = false;
        msg.error = true;
        msg.at = doneAt;
        currentRoom.updatedAt = doneAt;
        markMessageDeleted(oldLoadingId, doneAt);
      }
      task.completed = true;
      task.loadingId = '';
      addDebugLog('generation.error', '콩고물 톡 생성 실패', { error: String(e?.message || e), stack: String(e?.stack || '') });
      console.error('[TUA] generation failed', e);
    }

    if (!task.cancelled && getCharKey() === task.requestCharKey && task.persistenceEpoch === persistenceEpoch) {
      await saveRooms();
      if (runtimeActive && task.lifecycleEpoch === lifecycleEpoch) renderMessages();
    }
  } finally {
    if (task.cancelled) {
      removeGenerationLoadingMessages(task);
      if (!task.cancelCleanupComplete && !cleanInProgress && task.persistenceEpoch === persistenceEpoch) {
        await saveRooms();
        task.cancelCleanupComplete = true;
      }
      if (runtimeActive && task.lifecycleEpoch === lifecycleEpoch) renderMessages();
    }
    if (activeGenerationTask?.id === task.id) {
      activeGenerationTask = null;
      generationInFlight = false;
      setComposerBusy(false);
    }
  }
}

async function sendCurrentInput() {
  const settings = getSettings();
  if (!settings.enabled) { alert('🐕 콩고물 톡가 비활성화되어 있습니다. 확장 설정에서 활성화해 주세요.'); return; }
  if (generationInFlight) {
    await cancelCurrentGeneration();
    return;
  }
  const text = String($('#tua-input').val() || '').trim();
  await runAssistantGeneration(text ? { text, continuation: false } : { continuation: true });
}

function renderSettings() {
  if ($('#tua-settings').length) return;
  const html = `
  <div id="tua-settings" class="inline-drawer tua-settings-mini">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>🐕 콩고물 톡</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content" style="display:none;">
      <div class="tua-settings-inner">
      <div class="tua-global-profile-box">
        <div class="tua-global-profile-title">연결 프로필</div>
        <div class="tua-profile-row">
          <select id="tua-setting-profile" class="text_pole"></select>
        </div>
      </div>
      <div class="tua-global-debug-box">
        <button type="button" id="tua-show-debug" class="menu_button tua-debug-settings-button">🐞 <span>디버그 로그</span></button>
        <div id="tua-debug-panel" class="tua-settings-debug-panel" style="display:none;">
          <div class="tua-debug-actions">
            <button type="button" id="tua-copy-debug" class="menu_button">로그 복사</button>
            <button type="button" id="tua-clear-debug" class="menu_button">로그 비우기</button>
          </div>
          <textarea id="tua-debug-output" readonly rows="8" placeholder="디버그 로그 버튼을 누르면 최근 콩고물 톡 요청 로그와 설정 정보가 여기에 표시됩니다."></textarea>
        </div>
      </div>
      </div>
    </div>
  </div>`;
  $('#extensions_settings2').append(html);
  hydrateGlobalSettingsUI({ allowCorrection: false });
  refreshProfiles({ silent: true, persist: false });
  $('#tua-setting-profile').on('change input', readGlobalSettingsUI);
  $('#tua-show-debug').on('click', toggleKonggomulDebugDump);
  $('#tua-copy-debug').on('click', copyKonggomulDebugDump);
  $('#tua-clear-debug').on('click', clearKonggomulDebugDump);
}

function hydrateGlobalSettingsUI(options = {}) {
  const s = getSettings();
  const allowCorrection = options.allowCorrection !== false;
  if (s.selectedProfile) {
    const profiles = (s.cachedProfiles || []).map(normalizeConnectionProfile).filter(Boolean);
    const found = profiles.find(p => p.id === s.selectedProfile || p.name === s.selectedProfile);
    if (found) s.selectedProfile = found.id;
    else if (profiles.length && allowCorrection) {
      s.selectedProfile = '';
      s.profileMode = 'current';
      saveSettings();
    }
  }
  renderProfileOptions({ allowCorrection });
  $('#tua-setting-profile').val(s.selectedProfile || '');
}

function readGlobalSettingsUI() {
  const s = getSettings();
  const profileEl = $('#tua-setting-profile');
  if (profileEl.length) s.selectedProfile = profileEl.val() || '';
  s.profileMode = s.selectedProfile ? 'profile' : 'current';
  saveSettings();
  ensureLauncher();
}

function hydratePanelSettingsUI() {
  const s = getSettings();
  $('#tua-panel-tokens').val(s.maxTokens);
  $('#tua-panel-recent').val(s.recentMessages);
  $('#tua-panel-memory').val(getChatMemoryLimit());
  $('#tua-panel-user-nickname').val(s.userKongtalkNickname ?? DEFAULT_SETTINGS.userKongtalkNickname);
  $('#tua-panel-font').val(s.fontSize);
  $('#tua-panel-include-preset').prop('checked', s.includePreset !== false);
  $('#tua-panel-include-lorebook').prop('checked', s.includeLorebook !== false);
  $('#tua-panel-include-extension-memory').prop('checked', s.includeExtensionMemory !== false);
  $('#tua-panel-fixed-scrollbar').prop('checked', s.fixedScrollbar !== false);
  $('#tua-panel-voice-note').val(getVoiceNote());
  $('#tua-panel-coworker-note').val(s.coworkerWorkNote || '');
  $('.tua-theme-buttons button').removeClass('active').filter(`[data-theme="${getThemeKey()}"]`).addClass('active');
}


function renderProfileOptions(options = {}) {
  const s = getSettings();
  const allowCorrection = options.allowCorrection !== false;
  const selects = $('#tua-setting-profile, #tua-panel-profile');
  if (!selects.length) return;
  const profiles = (s.cachedProfiles || []).map(normalizeConnectionProfile).filter(Boolean);
  if (allowCorrection && s.selectedProfile && profiles.length && !profiles.some(p => p.name === s.selectedProfile || p.id === s.selectedProfile)) {
    s.selectedProfile = '';
    s.profileMode = 'current';
    saveSettings();
  }
  selects.each(function () {
    const sel = $(this);
    sel.empty();
    sel.append(`<option value="">메인 API 사용</option>`);
    if (!profiles.length) {
      sel.append(`<option value="" disabled>사용 가능한 프로필 없음</option>`);
    } else {
      for (const p of profiles) {
        sel.append(`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`);
      }
    }
    sel.val(s.selectedProfile || '');
  });
}


function readPanelSettingsUI() {
  const s = getSettings();

  const tokenValue = String($('#tua-panel-tokens').val() ?? '').trim();
  if (tokenValue !== '') {
    const maxTokensRaw = Number(tokenValue);
    if (Number.isFinite(maxTokensRaw)) s.maxTokens = Math.max(100, Math.min(8000, Math.floor(maxTokensRaw)));
  }

  const recentValue = String($('#tua-panel-recent').val() ?? '').trim();
  if (recentValue !== '') {
    const recentRaw = Number(recentValue);
    if (Number.isFinite(recentRaw)) s.recentMessages = Math.max(0, Math.min(100, Math.floor(recentRaw)));
  }

  const memoryValue = String($('#tua-panel-memory').val() ?? '').trim();
  if (memoryValue !== '') {
    const memoryRaw = Number(memoryValue);
    if (Number.isFinite(memoryRaw)) {
      s.chatMemoryLimit = Math.max(5, Math.min(80, Math.floor(memoryRaw)));
      $('#tua-panel-memory').val(s.chatMemoryLimit);
    }
  }

  const nicknameEl = $('#tua-panel-user-nickname');
  if (nicknameEl.length) {
    const nickname = limitGraphemes(nicknameEl.val() ?? '', 4);
    s.userKongtalkNickname = nickname;
    if (String(nicknameEl.val() ?? '') !== nickname) nicknameEl.val(nickname);
  }

  const includePresetEl = $('#tua-panel-include-preset');
  if (includePresetEl.length) s.includePreset = includePresetEl.prop('checked') !== false;
  const includeLorebookEl = $('#tua-panel-include-lorebook');
  if (includeLorebookEl.length) s.includeLorebook = includeLorebookEl.prop('checked') !== false;
  const includeExtensionMemoryEl = $('#tua-panel-include-extension-memory');
  if (includeExtensionMemoryEl.length) s.includeExtensionMemory = includeExtensionMemoryEl.prop('checked') !== false;
  const fixedScrollbarEl = $('#tua-panel-fixed-scrollbar');
  if (fixedScrollbarEl.length) s.fixedScrollbar = fixedScrollbarEl.prop('checked') !== false;

  const fontValue = String($('#tua-panel-font').val() ?? '').trim();
  if (fontValue !== '') {
    const fontRaw = Number(fontValue);
    s.fontSize = Number.isFinite(fontRaw) && fontRaw >= 10 && fontRaw <= 24 ? Math.floor(fontRaw) : DEFAULT_SETTINGS.fontSize;
    $('#tua-panel-font').val(s.fontSize);
  }

  setVoiceNote($('#tua-panel-voice-note').val() || '');
  s.coworkerWorkNote = $('#tua-panel-coworker-note').val() || '';
  saveSettings();
  applyVisualSettings();
  renderAll();
}

function isPanelSizeInputFocused() {
  const active = document.activeElement;
  return !!active && (active.id === 'tua-panel-width' || active.id === 'tua-panel-height');
}


function isCompactViewport() {
  const bounds = getViewportBounds();
  const w = Number(bounds.width) || 0;
  const h = Number(bounds.height) || 0;
  return w <= 640 || h <= 640;
}

function getViewportSafePanelSize(width, height) {
  const base = normalizePanelSize(width, height, false);
  const bounds = getViewportBounds();
  const margin = getPanelViewportMargin();
  const safeW = Math.max(1, (Number(bounds.width) || PANEL_DEFAULT_WIDTH) - margin * 2);
  const safeH = Math.max(1, (Number(bounds.height) || PANEL_DEFAULT_HEIGHT) - margin * 2);
  return {
    width: Math.max(Math.min(PANEL_MIN_WIDTH, safeW), Math.min(base.width, safeW)),
    height: Math.max(Math.min(PANEL_MIN_HEIGHT, safeH), Math.min(base.height, safeH)),
    reset: base.reset
  };
}

function isPanelViewportConstrained() {
  const s = getSettings();
  const base = normalizePanelSize(s.panelWidth, s.panelHeight, false);
  const safe = getViewportSafePanelSize(s.panelWidth, s.panelHeight);
  return Math.abs(base.width - safe.width) > 2 || Math.abs(base.height - safe.height) > 2;
}

function schedulePanelViewportRepair() {
  if (panelViewportRepairRaf) cancelAnimationFrame(panelViewportRepairRaf);
  panelViewportRepairRaf = requestAnimationFrame(() => {
    panelViewportRepairRaf = null;
    if (!panelEl) return;
    applyVisualSettings();
    requestAnimationFrame(() => {
      if (!panelEl || !panelEl.classList.contains('tua-visible')) return;
      applyPanelPosition();
    });
  });
}

function bindPanelViewportRepairEvents() {
  if (panelViewportRepairEventsBound) return;
  window.addEventListener('resize', schedulePanelViewportRepair, { passive: true });
  window.addEventListener('orientationchange', schedulePanelViewportRepair, { passive: true });
  window.visualViewport?.addEventListener?.('resize', schedulePanelViewportRepair, { passive: true });
  window.visualViewport?.addEventListener?.('scroll', schedulePanelViewportRepair, { passive: true });
  panelViewportRepairEventsBound = true;
}

function unbindPanelViewportRepairEvents() {
  if (!panelViewportRepairEventsBound) return;
  window.removeEventListener('resize', schedulePanelViewportRepair);
  window.removeEventListener('orientationchange', schedulePanelViewportRepair);
  window.visualViewport?.removeEventListener?.('resize', schedulePanelViewportRepair);
  window.visualViewport?.removeEventListener?.('scroll', schedulePanelViewportRepair);
  if (panelViewportRepairRaf) {
    cancelAnimationFrame(panelViewportRepairRaf);
    panelViewportRepairRaf = null;
  }
  panelViewportRepairEventsBound = false;
}

function normalizePanelSize(width, height, resetInvalid = true) {
  const w = Number(width);
  const h = Number(height);
  const valid = Number.isFinite(w) && Number.isFinite(h) &&
    w >= PANEL_MIN_WIDTH && w <= PANEL_MAX_WIDTH &&
    h >= PANEL_MIN_HEIGHT && h <= PANEL_MAX_HEIGHT;
  if (!valid && resetInvalid) return { width: PANEL_DEFAULT_WIDTH, height: PANEL_DEFAULT_HEIGHT, reset: true };
  return {
    width: Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, Math.round(Number.isFinite(w) ? w : PANEL_DEFAULT_WIDTH))),
    height: Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, Math.round(Number.isFinite(h) ? h : PANEL_DEFAULT_HEIGHT))),
    reset: false
  };
}

function applyPanelSize(width, height, source = 'manual') {
  const s = getSettings();
  // Drag-resizing should clamp to the allowed min/max size, not reset to the default size.
  // Manual numeric inputs still reset clearly when the entered value is invalid.
  const next = normalizePanelSize(width, height, source === 'manual');
  s.panelWidth = next.width;
  s.panelHeight = next.height;
  saveSettings();
  applyVisualSettings();
  hydratePanelSettingsUI();
  if (next.reset && source === 'manual') setStatus(`창 크기 값이 범위를 벗어나 기본값 ${PANEL_DEFAULT_WIDTH}×${PANEL_DEFAULT_HEIGHT}로 복귀했습니다.`);
  else if (source === 'manual') setStatus(`창 크기를 ${next.width}×${next.height}로 저장했습니다.`);
}

function applyManualPanelSizeFromUI() {
  applyPanelSize($('#tua-panel-width').val(), $('#tua-panel-height').val(), 'manual');
}


function isSimpleThemeKey(themeKey = getThemeKey()) {
  return themeKey === 'blackWhite' || themeKey === 'simple';
}

function applyThemeUI() {
  const themeKey = getThemeKey();
  const theme = getTheme();
  const simple = isSimpleThemeKey(themeKey);
  if (panelEl) {
    panelEl.setAttribute('data-tua-theme', themeKey);
    $('#tua-title-icon').text(theme.titleIcon).toggle(!!theme.titleIcon);
    $('#tua-title-text').text(simple ? '' : '콩톡');
    $('#tua-settings-icon').text(theme.titleIcon).toggle(!!theme.titleIcon);
    $('#tua-settings-title-text').text(simple ? '설정' : '콩고물 톡 설정');
    $('#tua-settings-open').text('⚙');
    $('#tua-new-room').text(simple ? '+' : '＋');
    $('#tua-pin-room').text(simple ? '⌖' : '📌');
    $('#tua-delete-room').text(simple ? '⌫' : '🗑️');
    refreshSendButtonState();
    $('#tua-collapsed-button .tua-collapsed-emoji').text(theme.titleIcon).toggle(!!theme.titleIcon);
  }
  const entryIcon = document.querySelector('#tua-extension-menu-entry .tua-extension-menu-icon');
  if (entryIcon) {
    entryIcon.textContent = theme.menuIcon;
    entryIcon.style.display = theme.menuIcon ? '' : 'none';
  }
}

function applyVisualSettings() {
  const s = getSettings();
  document.documentElement.style.setProperty('--tua-font-size', `${s.fontSize}px`);
  const visualSize = getViewportSafePanelSize(s.panelWidth, s.panelHeight);
  document.documentElement.style.setProperty('--tua-panel-width', `${visualSize.width}px`);
  document.documentElement.style.setProperty('--tua-panel-height', `${visualSize.height}px`);
  if (panelEl) {
    panelEl.classList.toggle('tua-collapsed', !!s.collapsed);
    panelEl.classList.toggle('tua-fixed-scrollbar', s.fixedScrollbar !== false);
  }
  applyRoomActionsCollapseState();
  applyThemeUI();
  applyPanelPosition();
}

function setStatus(_text) { /* v4.5.0: keep settings panel quiet; no visible action status text. */ }

function renderAll() {
  if (!panelEl) return;
  const s = getSettings();
  $('#tua-char-name').text(getCharName());
  const currentMode = getRoomMode();
  $('#tua-mode-badge').text(MODES[currentMode]?.label || 'Mode');
  const activeRoom = getActiveRoom();
  $('#tua-active-room-title').text(`${activeRoom?.pinned ? '📌 ' : ''}${activeRoom?.title || '대화방'}`);
  $('#tua-pin-room').toggleClass('active', !!activeRoom?.pinned).attr('title', activeRoom?.pinned ? '대화방 고정 해제' : '대화방 고정');
  hydratePanelSettingsUI();
  renderRoomList();
  renderMessages();
  applyVisualSettings();
}


function toggleRoomList(force) {
  const list = $('#tua-room-list');
  if (!list.length) return;
  renderRoomList();
  if (typeof force === 'boolean') list.toggleClass('open', force);
  else list.toggleClass('open');
}

function renderRoomList() {
  const list = $('#tua-room-list');
  list.empty();
  for (const room of getSortedRooms()) {
    const count = Array.isArray(room.messages) ? room.messages.length : 0;
    const active = room.id === activeRoomId ? 'active' : '';
    const pinned = room.pinned ? 'pinned' : '';
    const visibleMessages = Array.isArray(room.messages) ? room.messages.filter(msg => isRoomSortConversationMessage(msg, room)) : [];
    const last = visibleMessages.length ? visibleMessages[visibleMessages.length - 1].content : '대화 없음';
    const roomMode = MODES[getRoomMode(room)]?.label || 'Mode';
    const title = `${room.pinned ? '📌 ' : ''}${room.title || defaultRoomTitle(room.createdAt)}`;
    list.append(`<button class="tua-room-item ${active} ${pinned}" data-id="${escapeHtml(room.id)}"><span><b>${escapeHtml(title)}</b><small>${escapeHtml(roomMode)} · ${escapeHtml(String(last).slice(0, 34))}</small></span><em>${count}</em></button>`);
  }
  let roomPressTriggered = false;
  list.find('.tua-room-item').off('.tuaRoom')
    .on('click.tuaRoom', function (e) {
      if (roomPressTriggered) {
        e.preventDefault();
        roomPressTriggered = false;
        return;
      }
      closeSettingsPanel();
      activeRoomId = $(this).data('id');
      $('#tua-room-list').removeClass('open');
      renderAll();
      scrollMessagesToBottom();
    })
    .on('contextmenu.tuaRoom', function (e) {
      e.preventDefault();
      roomPressTriggered = true;
      renameRoomById($(this).data('id'));
      setTimeout(() => { roomPressTriggered = false; }, 80);
    })
    .on('pointerdown.tuaRoom', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      const id = $(this).data('id');
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        roomPressTriggered = true;
        renameRoomById(id);
      }, 620);
    })
    .on('pointerup.tuaRoom pointercancel.tuaRoom pointerleave.tuaRoom', function () {
      clearTimeout(longPressTimer);
      if (roomPressTriggered) setTimeout(() => { roomPressTriggered = false; }, 120);
    });
}

function scrollMessagesToBottom() {
  const box = $('#tua-messages');
  const el = box[0];
  if (!el) return;
  const run = () => { el.scrollTop = el.scrollHeight || 0; };
  run();
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  setTimeout(run, 30);
  setTimeout(run, 120);
}

function renderMessages() {
  const box = $('#tua-messages');
  if (!box.length) return;
  const room = getActiveRoom();
  box.empty();
  hideContextMenu();
  const visibleMessages = (room.messages || []).filter(m => !isOrphanGenerationPlaceholder(m, room.id));
  for (const m of visibleMessages) {
    const roleClass = m.role === 'declaration' ? 'declaration' : (m.role === 'user' ? 'user' : 'assistant');
    const name = m.role === 'declaration' ? '' : (m.role === 'user' ? getUserKongtalkNickname() : getCharName());
    const nameHtml = name ? `<div class="tua-msg-name">${escapeHtml(name)}</div>` : '';
    const lockedClass = m.role === 'declaration' ? ' tua-locked' : '';
    const title = m.role === 'declaration' ? '역할 선언' : '오래 누르면 복사/삭제/RP 반영';
    const html = `
      <div class="tua-msg tua-${roleClass}${lockedClass} ${m.error ? 'tua-error' : ''} ${m.loading ? 'tua-loading' : ''}" data-id="${escapeHtml(m.id)}" tabindex="0" title="${title}">
        ${nameHtml}
        <div class="tua-bubble">${normalizeNewlines(m.content)}</div>
      </div>`;
    box.append(html);
  }
  bindMessagePressHandlers();
  box.scrollTop(box[0]?.scrollHeight || 0);
}


async function copyTextToClipboard(text) {
  const value = String(text ?? '');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      setStatus('복사했습니다.');
      return true;
    }
  } catch (e) {
    console.warn('[TUA] navigator.clipboard failed, using fallback', e);
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    setStatus(ok ? '복사했습니다.' : '복사에 실패했습니다.');
    return ok;
  } catch (e) {
    console.warn('[TUA] copy fallback failed', e);
    setStatus('복사에 실패했습니다.');
    return false;
  }
}

function ensureContextMenu() {
  if (contextMenuEl) return contextMenuEl;
  contextMenuEl = document.createElement('div');
  contextMenuEl.id = 'tua-context-menu';
  contextMenuEl.innerHTML = `
    <button data-action="copy">복사</button>
    <button data-action="send-ooc">RP 반영</button>
    <button data-action="delete" class="danger">삭제</button>`;
  document.body.appendChild(contextMenuEl);
  contextMenuButtonClickHandler = async e => {
    const btn = e.target.closest('button');
    if (!btn || !contextMenuEl) return;
    const id = contextMenuEl.dataset.msgId;
    const msg = getActiveRoom().messages.find(x => x.id === id);
    if (!msg) return hideContextMenu();
    const action = btn.dataset.action;
    if (action === 'copy') await copyTextToClipboard(msg.content);
    if (action === 'delete') deleteMessage(id);
    if (action === 'send-ooc') await summarizeRecentKongtalkToMain();
    hideContextMenu();
  };
  contextMenuDocumentClickHandler = e => {
    if (!contextMenuEl) return;
    if (!contextMenuEl.contains(e.target) && !e.target.closest('.tua-msg')) hideContextMenu();
  };
  contextMenuEl.addEventListener('click', contextMenuButtonClickHandler);
  document.addEventListener('click', contextMenuDocumentClickHandler);
  return contextMenuEl;
}

function hideContextMenu() {
  if (contextMenuEl) contextMenuEl.classList.remove('open');
}

function openContextMenuForMessage(id, x, y) {
  const menu = ensureContextMenu();
  menu.dataset.msgId = id;
  menu.dataset.tuaTheme = getThemeKey();
  menu.style.left = `${Math.max(0, Math.min(x, window.innerWidth - 150))}px`;
  menu.style.top = `${Math.max(0, Math.min(y, window.innerHeight - 112))}px`;
  menu.classList.add('open');
}

function cancelMessageLongPress() {
  clearTimeout(messageLongPressTimer);
  messageLongPressTimer = null;
  messageLongPressState = null;
}

function bindMessagePressHandlers() {
  const box = $('#tua-messages');
  box.off('scroll.tuaPressCancel').on('scroll.tuaPressCancel', cancelMessageLongPress);
  box.find('.tua-msg:not(.tua-locked)').off('.tuaPress')
    .on('contextmenu.tuaPress', function (e) {
      e.preventDefault();
      cancelMessageLongPress();
      openContextMenuForMessage($(this).data('id'), e.clientX, e.clientY);
    })
    .on('pointerdown.tuaPress', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.pointerType === 'mouse' && e.buttons !== 1) return;
      const id = $(this).data('id');
      const x = e.clientX;
      const y = e.clientY;
      cancelMessageLongPress();
      messageLongPressState = { id, x, y };
      messageLongPressTimer = setTimeout(() => {
        if (!messageLongPressState || messageLongPressState.id !== id) return;
        openContextMenuForMessage(id, x, y);
        messageLongPressState = null;
        messageLongPressTimer = null;
      }, MESSAGE_LONG_PRESS_MS);
    })
    .on('pointermove.tuaPress', function (e) {
      if (!messageLongPressState) return;
      const dx = Math.abs(e.clientX - messageLongPressState.x);
      const dy = Math.abs(e.clientY - messageLongPressState.y);
      if (dx > MESSAGE_LONG_PRESS_MOVE_CANCEL_PX || dy > MESSAGE_LONG_PRESS_MOVE_CANCEL_PX) cancelMessageLongPress();
    })
    .on('pointerup.tuaPress pointercancel.tuaPress pointerleave.tuaPress', cancelMessageLongPress);
}

function sendToMainChat(text) {
  const textarea = document.querySelector('#send_textarea, textarea[name="message"], #chat_textarea');
  if (!textarea) { alert('메인 채팅 입력창을 찾지 못했습니다. 복사 기능을 사용해주세요.'); return; }
  textarea.value = text;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  setStatus('RP 입력창에 반영 내용을 삽입했습니다.');
}

function ensureExtensionMenuEntry() {
  const menu = document.querySelector('#extensionsMenu');
  if (!menu) return false;
  if (document.getElementById('tua-extension-menu-entry')) return true;

  const entry = document.createElement('div');
  entry.id = 'tua-extension-menu-entry';
  entry.className = 'list-group-item flex-container flexGap5 interactable tua-extension-menu-entry';
  entry.setAttribute('role', 'button');
  entry.setAttribute('tabindex', '0');
  entry.innerHTML = `<span class="tua-extension-menu-icon extensionsMenuExtensionButton">${getTheme().menuIcon}</span><span class="tua-extension-menu-text">콩고물 톡</span>`;
  entry.addEventListener('click', () => {
    const st = getSettings();
    if (!st.enabled) {
      st.enabled = true;
      saveSettings();
      hydrateGlobalSettingsUI();
    }
    setPanelVisible(true);
  });
  entry.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      entry.click();
    }
  });
  menu.appendChild(entry);
  return true;
}

function ensureLauncher() {
  return ensureExtensionMenuEntry();
}
function autoGrowInput() {
  const el = document.getElementById('tua-input');
  if (!el) return;
  const min = 34;
  el.style.height = `${min}px`;
  el.style.height = `${Math.max(min, el.scrollHeight)}px`;
  el.style.overflowY = 'hidden';
}


function bindRuntimeEvents() {
  const context = ctx();
  if (!chatChangedHandler) {
    chatChangedHandler = async () => {
      if (!runtimeActive || !lifecycleEnabled || cleanInProgress) return;
      const eventEpoch = lifecycleEpoch;
      try {
        // The room state still belongs to the previous character until the new load
        // completes. Cancel first so loading placeholders are saved only to that
        // previous character and can never be copied into the next one.
        if (generationInFlight && activeGenerationTask?.requestCharKey !== getCharKey()) {
          await cancelCurrentGeneration({ persist: true, render: false, announce: false });
        }
        await loadRooms({ expectedLifecycleEpoch: eventEpoch });
      } catch (error) {
        console.warn('[Konggomul] CHAT_CHANGED handler failed', error);
      }
    };
  }
  if (!characterEditedHandler) {
    characterEditedHandler = () => {
      if (!runtimeActive || !lifecycleEnabled || cleanInProgress) return;
      renderAll();
    };
  }
  if (!eventHandlersBound) {
    context.eventSource?.on?.(context.event_types?.CHAT_CHANGED, chatChangedHandler);
    context.eventSource?.on?.(context.event_types?.CHARACTER_EDITED, characterEditedHandler);
    eventHandlersBound = true;
  }
}

function unbindRuntimeEvents() {
  const context = ctx();
  const off = context.eventSource?.off;
  if (eventHandlersBound && typeof off === 'function') {
    try { off.call(context.eventSource, context.event_types?.CHAT_CHANGED, chatChangedHandler); } catch {}
    try { off.call(context.eventSource, context.event_types?.CHARACTER_EDITED, characterEditedHandler); } catch {}
    eventHandlersBound = false;
  }
}


function cleanupRuntimeState() {
  runtimeActive = false;
  unbindRuntimeEvents();
  unbindPanelViewportRepairEvents();
  document.getElementById('tua-extension-menu-entry')?.remove();
  clearTimeout(longPressTimer);
  longPressTimer = null;
  cancelMessageLongPress();
  draggingPanel = null;
  resizingPanel = null;
  collapsedButtonSuppressClick = false;
  document.body.classList.remove('tua-panel-dragging-body', 'tua-panel-resizing-body');
  hideContextMenu();
  if (contextMenuEl) {
    if (contextMenuButtonClickHandler) contextMenuEl.removeEventListener('click', contextMenuButtonClickHandler);
    if (contextMenuDocumentClickHandler) document.removeEventListener('click', contextMenuDocumentClickHandler);
    contextMenuEl.remove();
    contextMenuEl = null;
    contextMenuButtonClickHandler = null;
    contextMenuDocumentClickHandler = null;
  }
  if (panelEl) setPanelVisible(false, { persistPreference: false });
}

function cancelPendingInitialization() {
  if (appReadyInitHandler) {
    try {
      const context = ctx();
      const source = context.eventSource;
      const event = context.event_types?.APP_READY;
      if (typeof source?.off === 'function') source.off(event, appReadyInitHandler);
      else if (typeof source?.removeListener === 'function') source.removeListener(event, appReadyInitHandler);
    } catch {}
    appReadyInitHandler = null;
  }
}

async function init() {
  if (!lifecycleEnabled || cleanInProgress) return false;
  if (initialized) return true;
  if (initPromise) return initPromise;

  const runEpoch = lifecycleEpoch;
  const run = (async () => {
    runtimeActive = true;
    getSettings();
    renderSettings();
    ensurePanel();
    if (!ensureLauncher()) return false;
    applyVisualSettings();
    const loaded = await loadRooms({ expectedLifecycleEpoch: runEpoch });
    if (!loaded || !lifecycleEnabled || cleanInProgress || runEpoch !== lifecycleEpoch) return false;
    bindRuntimeEvents();
    if (getSettings().enabled && getSettings().openOnStart) setPanelVisible(true, { persistPreference: false });
    initialized = true;
    return true;
  })();
  initPromise = run;

  try {
    return await run;
  } finally {
    if (initPromise === run) initPromise = null;
  }
}

function requestInit() {
  void init().catch(error => console.error('[TUA] init failed', error));
}

jQuery(() => {
  if (!lifecycleEnabled) return;
  try {
    const context = ctx();
    appReadyInitHandler = () => {
      if (lifecycleEnabled && !cleanInProgress) requestInit();
    };
    if (context.eventSource && context.event_types?.APP_READY) context.eventSource.on(context.event_types.APP_READY, appReadyInitHandler);
  } catch (e) { console.error('[TUA] init failed', e); }
});

export function onActivate() {
  // SillyTavern may await activate hooks during startup. Initialization is started
  // once from the lifecycle hook and does not poll or schedule fallback retries.
  lifecycleEnabled = true;
  cleanInProgress = false;
  requestInit();
}

export function onEnable() {
  lifecycleEnabled = true;
  cleanInProgress = false;
  lifecycleEpoch += 1;
  requestInit();
}

export async function onDisable() {
  lifecycleEnabled = false;
  lifecycleEpoch += 1;
  roomLoadSequence += 1;
  cancelPendingInitialization();
  cleanupRuntimeState();
  if (generationInFlight) await cancelCurrentGeneration({ persist: true, render: false, announce: false });
  initialized = false;
}

export async function onClean() {
  lifecycleEnabled = false;
  lifecycleEpoch += 1;
  persistenceEpoch += 1;
  roomLoadSequence += 1;
  cleanInProgress = true;
  cancelPendingInitialization();
  cleanupRuntimeState();
  try {
    if (generationInFlight) await cancelCurrentGeneration({ persist: false, render: false, announce: false });
    await roomSaveQueue.catch(() => undefined);
    const context = ctx();
    if (context?.extensionSettings) delete context.extensionSettings[MODULE_NAME];
    context?.saveSettingsDebounced?.();
    roomState = { rooms: [] };
    roomStateCharKey = null;
    activeRoomId = null;
    roomSaveQueue = Promise.resolve();
    try { resizeObserver?.disconnect?.(); } catch {}
    resizeObserver = null;
    panelEl?.remove?.();
    panelEl = null;
    $('#tua-settings').remove();
    initialized = false;
  } catch (error) {
    console.warn('[Konggomul] clean hook failed', error);
  } finally {
    cleanInProgress = false;
  }
}
