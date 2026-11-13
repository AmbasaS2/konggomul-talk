# 🐕 Konggomul Talk

**Konggomul Talk is a SillyTavern assistant extension for chatting outside the active RP—with the current character or an invited Guest Talk character.**

The character card, persona, and selected RP context can inform the conversation, but Konggomul Talk messages remain separate from the main RP. The former Apply to RP summary/injection feature has been removed.

## 🌍 Interface Language

Konggomul Talk automatically follows the **SillyTavern UI language**. No separate language selector is needed.

- Localized interface: **English, Korean, Japanese, Simplified Chinese, Traditional Chinese, and Spanish**. Other SillyTavern locales fall back to English.
- This applies to extension settings, room and mode controls, the Guest Talk picker, tooltips, and confirmation/error dialogs.
- **Output language is separate**: the Korean / English / English–Korean bilingual options for AI replies work as before. An optional **Auto (SillyTavern UI language)** setting is also available. Character cards, role prompts, and saved conversations are not translated.
- Existing room names that users previously created are kept as-is.

## ⚙️ Extension Settings

Manage the connection API, saved conversation cleanup, and debug logs under **Extensions → Konggomul Talk (콩고물 톡)**.

| Setting | Description |
|---|---|
| **Connection Profile (연결 프로필)** | Selects a connection profile saved in Connection Manager. Leave it blank to use the current main API. |
| **Conversation Data Cleanup (대화 데이터 정리)** | Lets you choose which character's saved Konggomul Talk data to reset, even when another character is currently open. Stored entries that no longer match an installed character are listed as well. All rooms and messages for the selected character are removed and one default Kongtalk room is created. The character voice note and extension settings, including the theme and connection profile, are kept. |
| **🐞 Debug Logs (디버그 로그)** | Shows recent request and error information and lets you copy or clear the logs. |

If a selected dedicated API profile cannot be found, the extension reports an error instead of silently falling back to the main API.

Before resetting saved conversation data, close or refresh SillyTavern on other devices connected as the same user.

## 💬 Konggomul Talk Panel

Choose **Konggomul Talk** from the Extensions menu to open the panel.

**Panel header**

| Control | Action |
|---|---|
| Panel header | Drag the open panel to another position. |
| `—` | Collapses the panel into a small button. |
| `⚙` | Opens the panel settings. |
| `×` | Closes the panel. |
| Collapsed theme icon | Opens the collapsed panel again. The collapsed button can also be dragged. |
| Bottom-right corner | Resizes the panel. |

**Room management**

| Control | Action |
|---|---|
| **Current room title** | Opens the current character's rooms alongside global Guest Talk rooms. |
| `⋯` | Shows or hides the new-room, pin, and delete buttons. |
| `＋` | Selects a mode and creates a new room. |
| `📌` | Pins or unpins the current room at the top of the list. |
| `🗑️` | Deletes the current room. |

Existing rooms remain stored separately for each main RP character. Guest Talk rooms are stored globally, so they can be reopened while any RP character is selected. Butler, Pet, and Coworker modes are retired; their existing rooms now behave as regular Kongtalk rooms while preserving messages and original stored mode identifiers for rollback.

- Select any previous room from the room list. Pinned rooms stay at the top, while unpinned rooms are ordered by most recent conversation activity.
- Right-click or long-press a room title to rename, change its mode, or delete it. Guest Talk rooms retain their chosen guest and cannot change modes.
- Changing an existing room's mode keeps its messages and does not generate a new opening message.
- Each room keeps its mode, messages, answer variants, and pinned state.
- If every normal room is deleted, one default Kongtalk room is created again. Deleting the last Guest Talk room returns you to normal rooms.
- Guest Talk remembers which RP persona and main RP character were last used. If the persona changes, it asks whether to **create a fresh Guest Talk room** or **continue the existing conversation**, preserving all past messages. Changing only the RP with the same persona does not trigger this choice.

## 🗂️ Conversation Modes

| Mode | Description |
|---|---|
| **Kongtalk (콩톡)** | The default mode for freely chatting with the current character outside the RP. |
| **RP Assistant Mode (RP 어시 모드)** | Discusses the current RP from outside the scene: situation and emotional-flow reading, scene direction, possible actions, and sample lines. It writes OOC only when the user explicitly asks for OOC. |
| **Guest Talk (게스트톡)** | Invites any installed character—even from a different story—to talk privately with the **current RP persona** (the same person playing in the active RP). The guest card determines the speaker; the current RP character card, active lorebook, accessible memories, and recent RP messages provide context. Established guest relationships and first-hand RP events are respected; unrelated guests do not automatically know the persona. The latest Guest Talk question also participates in dynamic lorebook keyword scanning. |
| **Parallel Universe AU (Watching RP)** | Creates a separate modern AU person with the original character's name, face, age, core personality, and way of speaking, but a different modern job and a newly generated relationship with the current user. They watch the main RP together as a show. |
| **Parallel Universe AU (Watching RP) 🙃** | Creates a separate modern AU person with the original character's name, face, and age, but an opposite core personality and way of speaking, a different life and job, and a newly generated relationship with the current user. They watch the main RP together as a show. |

When a new room is created, its opening is prepared for the selected mode.

- **Kongtalk and Guest Talk** open with the current theme's starting icon. Guest Talk first asks you to choose a character: the five most recently selected guests are shown first, with search and a scrollable full character list.
- **RP Assistant mode** begins with the character reading the assigned role declaration and reacting in their own way.
- **Parallel Universe AU modes** begin with a newly generated AU profile and a reaction to the current RP scene as a show.

## ✉️ Chatting

| Action | Result |
|---|---|
| **Enter a message and press Send** | Generates the character's reply in the current room. |
| **Press Send with an empty input** | Continues naturally from the latest conversation. |
| **Press Send while an AI reply is being generated** | Stops the current generation. |

**Message menu**

Right-click or long-press a message to open its menu.

| Menu item | Action |
|---|---|
| **Copy** | Copies the message text. |
| **Regenerate (다시 생성)** | Regenerates the latest eligible AI response. The new response is saved as another answer variant instead of replacing the previous one. |
| **Delete** | Deletes the selected message. |
| **Reply** | Quotes a chosen message above the composer. Send a normal reply and both the quote and message are saved; the model receives the quoted text as part of the conversation. |

After a response has multiple variants, use the `‹` and `›` arrows beneath it to switch between them. The selected variant remains active and is used as conversation history for later replies.

## 🎛️ Panel Settings

Use `⚙` in the panel header to adjust the current character and Konggomul Talk display settings.

**Display and reply settings**

| Setting | Description |
|---|---|
| **Theme** | Selects Konggomul, Choco Strawberry, Melon Soda, Simple MacBook, or Custom. |
| **Response sentence count** | Uses automatic length or targets 1–3, 2–5, 6–10, or 11–18 sentences for normal replies. |
| **Output language** | Selects Korean, English, English/Korean bilingual, or optional **Auto** (the current SillyTavern interface language). Existing preferences are not changed. In bilingual mode, every English sentence is followed on the next line by its Korean translation in brackets. |
| **Fixed scrollbar** | Switches between the themed fixed scrollbar and the browser's default scrollbar. |
| **User Kongtalk nickname** | Sets the name or emoji shown beside user messages. Up to four characters are displayed; leave it blank to hide the label. |
| **Chat font size** | Adjusts the font size of Konggomul Talk messages. |

**Character and work settings**

| Setting | Description |
|---|---|
| **Character voice note** | Records speech style and answer preferences for the current speaker. Guest Talk keeps these notes per invited guest without modifying the main RP character's note. |

**Context settings**

The character card, user/persona information, the current room's previous conversation, and the character voice note are included as core context. The following options can be adjusted as needed; their default values are enabled.

| Setting | Controls |
|---|---|
| **Include preset** | When a dedicated connection profile is used, determines whether the request includes that profile's preset. Turning it off can reduce token usage and the influence of RP preset style or rules. |
| **Include lorebook** | Determines whether dynamically activated lorebooks and World Info are included. |
| **Include extension memory** | Determines whether accessible memory and summary text exposed by SillyTavern or other extensions is included. If none is exposed in the current environment, this context remains empty. |
| **Recent RP messages to read** | Sets how many recent main RP messages are used as reference for the character's voice, relationship, and current situation. |
| **Kongtalk memory range** | Sets how many previous messages from the current room are used when generating a reply. |
| **View last AI request context** | In Advanced settings, shows the exact prompt parts Konggomul Talk sent on the last request for this room, without another AI call. It is kept only in memory, not chat data; a connection profile/provider may add preset material later. |
| **Target response tokens** | Sets the target capacity for Konggomul Talk responses. The selected sentence count and the current request still determine the actual length. |

## 🎨 Themes

| Theme | Style |
|---|---|
| **🐕 Konggomul** | A warm default messenger theme inspired by injeolmi, soybean powder, and milk tea. |
| **🍓 Choco Strawberry** | A sweet, bouncy theme inspired by strawberry chocolate. |
| **🥤 Melon Soda** | A fresh and playful theme inspired by melon soda. |
| **⌘ Simple MacBook** | A clean black-and-white, symbol-focused theme with a MacBook-like feel. |
| **🧸 Custom** | Follows the current SillyTavern theme colors, including the fixed scrollbar arrow color. Its displayed name, main icon, and send icon can also be overridden through SillyTavern custom CSS. |

Changing the theme updates the panel, send button, collapsed button, and starting icon together.

## 💾 Backup and Storage

| Feature | Description |
|---|---|
| **Conversation data management** | In Advanced settings, use a **dropdown** to choose **Current RP character** or **All Guest Talk**, then use the shared **Export / Import / Reset** buttons in one row. The selected scope determines which data is affected. |
| **Current RP character** | Export saves the current character's rooms, messages, modes, answer variants, pinned states and voice note. Import replaces this character's saved conversation data. Reset removes this character's rooms and messages, recreating a default room while preserving the voice note and extension settings. |
| **All Guest Talk** | Export, import and reset work on the global Guest Talk conversation store only. Backups preserve guest character identifiers, messages, answer variants, voice notes and recent guest choices. |

Normal rooms remain stored per main character in SillyTavern's extension settings; Guest Talk rooms live in a separate global store and stay accessible when the active RP changes. Guest Talk always reads the currently open RP, not a permanently pinned old chat. Phone and desktop connecting as the same user to the same server can access the same saved data. Browser-local copies from older versions are no longer read or merged.

The panel position and size, theme, character voice note, coworker work note, reply settings, and context settings are also retained. Quoted-message references and Guest Talk persona history are included in room backups. No automatic retrieval of old RP messages or spontaneous first messages was added.

---

# 🐕 콩고물 톡

**콩고물 톡은 현재 캐릭터 또는 별도로 초대한 게스트 캐릭터와 RP 밖에서 채팅할 수 있는 SillyTavern 어시스턴트 확장입니다.**

캐릭터 카드, 페르소나와 현재 RP 맥락을 참고해 대화하지만, 콩고물 톡 메시지는 메인 RP에 섞이지 않습니다. 기존 'RP 반영' 요약·주입 기능은 제거되었습니다.

## 🌍 화면 언어

콩고물 톡은 **SillyTavern에서 선택한 UI 언어를 자동으로 따라갑니다.** 콩톡에 별도 언어 선택기는 없습니다.

- 화면 지원 언어: **영어·한국어·일본어·중국어 간체·중국어 번체·스페인어**. 그 외 SillyTavern 언어에서는 영어로 표시됩니다.
- 확장 설정, 대화방·모드 관리, 게스트톡 캐릭터 선택, 버튼 설명, 확인·오류 창에 적용됩니다.
- **AI 답변 언어는 별개의 설정**입니다. 기존 한국어·영어·영한 병기 옵션은 그대로 유지되고, 원하는 사람만 **자동(실리태번 UI 언어)**을 선택할 수 있습니다. 또한 캐릭터 시트·역할 프롬프트·저장된 대화 내용은 번역하지 않습니다.
- 기존에 저장한 대화방 이름은 변경하지 않습니다.

## ⚙️ 확장 설정

**Extensions → 콩고물 톡**에서 연결 API, 저장된 대화 데이터 정리와 디버그 로그를 관리합니다.

| 설정 | 설명 |
|---|---|
| **연결 프로필** | Connection Manager에 저장된 연결 프로필을 선택합니다. 비워두면 현재 메인 API를 사용합니다. |
| **대화 데이터 정리** | 현재 열어 둔 캐릭터와 관계없이, 저장 데이터가 있는 캐릭터 중 초기화할 대상을 선택합니다. 현재 설치된 캐릭터와 매칭되지 않은 저장 데이터도 목록에 표시됩니다. 선택한 캐릭터의 모든 방과 메시지가 삭제되고 기본 콩톡 방 1개가 새로 만들어집니다. 캐릭터 말투 메모와 테마·연결 프로필을 포함한 확장 설정은 유지됩니다. |
| **🐞 디버그 로그** | 최근 요청과 오류 정보를 확인하고, 로그를 복사하거나 비웁니다. |

선택한 전용 API 프로필을 찾을 수 없으면 메인 API로 자동 변경하지 않고 오류를 표시합니다.

저장된 대화 데이터를 초기화하기 전에, 같은 사용자로 접속한 다른 기기의 SillyTavern을 닫거나 새로고침해 주세요.

## 💬 콩고물 톡 패널

확장 메뉴의 **콩고물 톡**을 누르면 패널이 열립니다.

**패널 상단**

| 조작 | 기능 |
|---|---|
| 패널 상단 바 | 열린 패널을 다른 위치로 끌어서 옮깁니다. |
| `—` | 패널을 작은 버튼으로 접습니다. |
| `⚙` | 패널 설정을 엽니다. |
| `×` | 패널을 닫습니다. |
| 접힌 테마 아이콘 | 접어둔 패널을 다시 펼칩니다. 접힌 버튼도 끌어서 옮길 수 있습니다. |
| 오른쪽 아래 모서리 | 패널 크기를 조절합니다. |

**대화방 관리**

| 조작 | 기능 |
|---|---|
| **현재 방 이름** | 현재 캐릭터의 대화방과 게스트톡 대화방 목록을 엽니다. |
| `⋯` | 새 방, 고정, 삭제 버튼을 펼치거나 접습니다. |
| `＋` | 모드를 선택해 새 대화방을 만듭니다. |
| `📌` | 현재 방을 목록 상단에 고정하거나 해제합니다. |
| `🗑️` | 현재 방을 삭제합니다. |

기존 대화방은 현재 RP 캐릭터별로 따로 저장되고, 게스트톡 대화방은 어느 RP에서도 접근할 수 있도록 별도 공통 저장 영역에 보관됩니다. 집사·펫·직장 동료 모드는 제거했지만 예전 대화방과 메시지는 삭제하지 않습니다. 기존 방은 일반 콩톡으로 동작하며 되돌리기를 위해 기존 모드 식별자는 유지합니다.

- 방 목록에서 이전 대화방으로 이동할 수 있습니다. 고정한 방은 상단에 유지되고, 고정하지 않은 방은 최근 대화 순으로 정렬됩니다.
- 방 이름을 우클릭하거나 길게 누르면 이름을 바꾸고, 모드를 변경하거나, 방을 삭제할 수 있습니다. 게스트톡 방은 초대한 캐릭터와 모드를 유지하며 모드 변경은 지원하지 않습니다.
- 기존 방의 모드를 변경해도 메시지는 유지되며 새 시작 메시지는 생성되지 않습니다.
- 각 방의 모드, 메시지, 답변 버전과 고정 상태가 그대로 유지됩니다.
- 일반 대화방을 모두 삭제하면 기본 콩톡 방이 다시 만들어집니다. 게스트톡의 마지막 방을 삭제하면 일반 대화방 목록으로 돌아갑니다.
- 게스트톡은 마지막 페르소나와 RP 캐릭터를 기록합니다. 페르소나가 바뀌면 **새 게스트톡 방 만들기 / 기존 방 이어가기**를 선택할 수 있어. 이전 메시지는 삭제하지 않으며, 페르소나는 그대로이고 RP만 바뀌었다면 묻지 않습니다.

## 🗂️ 대화 모드

| 모드 | 설명 |
|---|---|
| **콩톡** | RP 밖에서 현재 캐릭터와 자유롭게 대화하는 기본 모드입니다. |
| **RP 어시 모드** | 현재 캐릭터와 RP 밖에서 장면 상황, 감정선, 다음 전개, 가능한 행동과 예시 대사를 상의합니다. OOC는 사용자가 명시적으로 요청했을 때만 작성합니다. |
| **게스트톡** | 설치된 다른 캐릭터를 초대해 **현재 RP의 페르소나 본인**과 별도로 대화합니다. 다른 세계관 캐릭터도 초대할 수 있습니다. 게스트 캐릭터 시트는 화자의 인격, 현재 RP 캐릭터 시트·로어북·접근 가능한 메모리·최근 대화는 상황과 관계를 이해하는 자료입니다. 게스트가 RP에서 실제로 겪은 사건과 기존 관계는 유지하되, 인연 없는 캐릭터에게 친분을 만들어 주지는 않습니다. 방금 보낸 콩톡 질문도 로어북 키워드 검사에 포함됩니다. |
| **평행우주AU(Watching RP)** | 원래 캐릭터와 같은 이름, 얼굴, 나이, 핵심 성격과 말투를 가지지만, 다른 현대 직업과 새로 정해진 현재 사용자와의 관계를 가진 별개의 현대 AU 인물과 메인 RP를 작품처럼 함께 보며 대화합니다. |
| **평행우주AU(Watching RP)🙃** | 원래 캐릭터와 같은 이름, 얼굴과 나이를 가지지만, 핵심 성격과 말투는 반대이고 삶·직업·현재 사용자와의 관계는 새로 정해진 별개의 현대 AU 인물과 메인 RP를 작품처럼 함께 보며 대화합니다. |

새 대화방을 만들면 선택한 모드에 맞는 시작 메시지가 자동으로 준비됩니다.

- **콩톡과 게스트톡**는 현재 테마의 시작 아이콘으로 열립니다. 게스트톡는 처음에 캐릭터를 선택하며, 최근 게스트 5명·이름 검색·스크롤되는 전체 목록을 제공합니다.
- **RP 어시 모드**는 캐릭터가 부여된 역할 선언문을 읽고 자기 방식대로 반응하며 시작합니다.
- **평행우주AU**는 새로 생성된 AU 프로필과 현재 RP 장면을 작품으로 본 반응으로 시작합니다.

## ✉️ 대화하기

| 조작 | 기능 |
|---|---|
| **메시지 입력 + 전송 버튼 클릭** | 현재 방에서 캐릭터의 답변을 생성합니다. |
| **빈 입력창 + 전송 버튼 클릭** | 직전 대화를 자연스럽게 이어서 답변을 생성합니다. |
| **AI 답변 생성 중 전송 버튼 클릭** | 생성 중인 답변을 중지합니다. |

**메시지 메뉴**

메시지를 우클릭하거나 길게 누르면 메뉴가 열립니다.

| 메뉴 | 기능 |
|---|---|
| **복사** | 메시지 내용을 복사합니다. |
| **다시 생성** | 다시 생성할 수 있는 가장 최근 AI 답변을 새로 생성합니다. 새 답변은 기존 답변을 덮어쓰지 않고 다른 답변 버전으로 저장됩니다. |
| **삭제** | 선택한 메시지를 삭제합니다. |
| **답장** | 기존 메시지를 골라 인용한 뒤 답장합니다. 인용 내용은 대화 기록과 AI 요청에도 함께 포함됩니다. |

하나의 답변에 여러 버전이 생기면 아래의 `‹`와 `›` 화살표로 전환합니다. 현재 선택한 버전이 그대로 유지되며 이후 답변의 대화 기록에 사용됩니다.

## 🎛️ 패널 설정

패널 상단의 `⚙`에서 현재 캐릭터와 콩고물 톡 화면에 적용할 설정을 조절합니다.

**화면과 답변 설정**

| 설정 | 설명 |
|---|---|
| **테마** | 콩고물, 초코딸기, 메론소다, 심플 맥북, 커스텀 중에서 선택합니다. |
| **답변 문장 수** | 자동 길이를 사용하거나 일반 답변을 1~3, 2~5, 6~10, 11~18문장 중 하나의 범위로 생성하도록 지정합니다. |
| **출력 언어** | 한국어·영어·영한 병기 또는 **자동(실리태번 UI 언어)** 중 선택합니다. 기존 사용자 설정은 변경하지 않습니다. 영한 병기는 영문 한 문장 다음 줄에 한국어 번역을 대괄호로 표시합니다. |
| **스크롤 바 고정** | 테마에 맞춘 고정 스크롤바와 브라우저 기본 스크롤바를 전환합니다. |
| **유저 콩톡 닉네임** | 유저 메시지 옆에 표시할 이름이나 이모지를 정합니다. 화면에는 최대 4글자까지 표시되며, 비워두면 표시하지 않습니다. |
| **채팅창 폰트 크기** | 콩고물 톡 메시지의 글씨 크기를 조절합니다. |

**캐릭터와 업무 설정**

| 설정 | 설명 |
|---|---|
| **캐릭터 말투 고정 메모** | 현재 대화 상대의 말투와 답변 성향을 적습니다. 게스트톡에서는 초대한 캐릭터별로 따로 저장되어 메인 RP 캐릭터의 메모를 덮어쓰지 않습니다. |

**반영 범위 설정**

캐릭터 카드, 유저·페르소나 정보, 현재 콩고물 톡 방의 이전 대화와 캐릭터 말투 고정 메모는 기본 맥락으로 반영됩니다. 아래 항목도 기본값은 모두 반영하도록 설정되어 있으며, 필요에 따라 포함 여부와 범위를 조절할 수 있습니다.

| 설정 | 조절하는 내용 |
|---|---|
| **프리셋 포함** | 전용 연결 프로필을 사용할 때 그 요청에 선택한 프로필의 프리셋을 포함할지 정합니다. 끄면 토큰 사용량과 RP 프리셋의 문체·규칙 영향을 줄일 수 있습니다. |
| **로어북 포함** | 현재 맥락에서 동적으로 활성화된 로어북과 월드 인포를 반영할지 정합니다. |
| **확장 메모리 포함** | SillyTavern이나 다른 확장이 접근 가능하게 제공한 메모리·요약 정보를 반영할지 정합니다. 현재 환경에서 노출된 정보가 없으면 이 맥락은 빈 상태로 남습니다. |
| **최근 RP 읽을 메시지 수** | 캐릭터의 말투, 관계성과 현재 상황을 참고할 메인 RP 범위를 정합니다. |
| **콩톡 기억 범위** | 답변할 때 참고할 현재 대화방의 이전 메시지 수를 정합니다. |
| **마지막 AI 요청 맥락 확인** | 고급 설정에서 현재 방의 마지막 AI 요청에 콩톡이 보낸 프롬프트를 보여줍니다. AI를 추가 호출하지 않고, 내용은 채팅 데이터가 아닌 메모리에만 남습니다. 연결 프로필·제공자가 추가하는 프리셋은 별도로 적용될 수 있습니다. |
| **답변 목표 토큰 수** | 콩고물 톡 답변의 목표 용량을 조절합니다. 실제 길이는 선택한 문장 수와 현재 요청에 따라 달라집니다. |

## 🎨 테마

| 테마 | 특징 |
|---|---|
| **🐕 콩고물** | 인절미·콩고물·밀크티 색감을 담은 포근한 기본 메신저 테마입니다. |
| **🍓 초코딸기** | 딸기 초콜릿 색감을 담은 달콤하고 통통 튀는 테마입니다. |
| **🥤 메론소다** | 메론소다의 청량하고 귀여운 분위기를 담은 테마입니다. |
| **⌘ 심플 맥북** | 맥북 감성을 담은 기호 중심의 깔끔한 흑백 테마입니다. |
| **🧸 커스텀** | 현재 SillyTavern 테마 색상을 따르며 고정 스크롤바 화살표 색상에도 적용됩니다. SillyTavern 커스텀 CSS로 표시 이름, 메인 아이콘과 전송 아이콘도 덮어쓸 수 있습니다. |

테마를 바꾸면 패널과 전송 버튼, 접힌 버튼과 시작 아이콘도 함께 바뀝니다.

## 💾 백업과 저장

| 기능 | 설명 |
|---|---|
| **대화 데이터 관리** | 고급 설정의 **선택 박스**에서 **현재 RP 캐릭터 / 게스트톡 전체** 중 대상을 고르고, 한 줄로 배치된 **내보내기·가져오기·초기화** 버튼을 사용합니다. 선택한 대상에만 적용됩니다. |
| **현재 RP 캐릭터** | 내보내기는 현재 캐릭터의 대화방, 메시지, 모드, 답변 버전, 고정 상태와 말투 메모를 저장합니다. 가져오기는 해당 캐릭터의 데이터를 백업 내용으로 교체하고, 초기화는 대화 기록을 지우고 기본 방을 다시 만들되 말투 메모와 확장 설정을 유지합니다. |
| **게스트톡 전체** | 게스트톡 공통 저장 영역만 별도로 내보내기·가져오기·초기화합니다. 백업에는 캐릭터 식별자, 대화 기록, 답변 버전, 말투 메모와 최근 선택 목록이 포함됩니다. |

일반 대화방은 현재 RP 캐릭터별로 저장되고 게스트톡 방은 별도 공통 저장 영역에 저장됩니다. 게스트 방은 메인 RP가 바뀌어도 접근할 수 있으며, 매번 현재 열려 있는 RP를 참고합니다(과거 RP 고정 기능은 아직 제공하지 않습니다). 같은 서버·사용자로 접속하면 폰과 컴퓨터에서 같은 내역을 사용합니다. 이전 버전의 브라우저 로컬 사본은 읽거나 병합하지 않습니다.

패널 위치와 크기, 테마, 캐릭터 말투 메모, 답변 설정과 반영 범위 설정도 유지됩니다. 이전 직장 동료 업무 메모 데이터는 삭제하지 않습니다. 인용 답장 정보와 게스트톡 페르소나 전환 기록은 백업에 포함됩니다. 오래된 RP 자동 검색이나 캐릭터 자동 선톡 기능은 추가하지 않았습니다.

---

## Copyright & License

Copyright © 2026 AmbasaS2  
Licensed under the GNU Affero General Public License v3.0.  
https://github.com/AmbasaS2

The full license text is provided in the `LICENSE` file.
