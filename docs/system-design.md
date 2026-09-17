# System Design — Grip

> Interview prep + job hunt toolkit. Cross-platform monorepo (web + mobile) backed by Supabase.

---

## 1. Monorepo Overview

```mermaid
graph TD
    ROOT["grip (root)\npnpm workspaces"]

    ROOT --> CORE["📦 packages/core\n@grip-apps/core\nShared business logic"]
    ROOT --> WEB["🌐 apps/web\nReact 19 + Vite SPA"]
    ROOT --> MOBILE["📱 apps/mobile\nReact Native + Expo"]
    ROOT --> DB["🗄️ supabase/\nPostgreSQL + RLS\nmigrations & schema"]

    CORE --> WEB
    CORE --> MOBILE
    WEB --> DB
    MOBILE --> DB
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant App as Web / Mobile App
    participant Supa as Supabase Auth
    participant DB as PostgreSQL

    User->>App: Open app
    App->>Supa: onAuthStateChange()
    Supa-->>App: No session → redirect to SignIn

    User->>App: Sign in (email / GitHub OAuth)
    App->>Supa: signInWithOAuth() or signInWithPassword()
    Supa-->>DB: auth.users row created (first time)
    DB-->>DB: Trigger → create profiles row
    Supa-->>App: Session token (JWT)
    App-->>User: Navigate to main tabs

    Note over App,Supa: Session auto-refreshes<br/>Mobile: persisted to AsyncStorage
```

---

## 3. Core Package — Module Map

```mermaid
graph LR
    subgraph CORE ["@grip-apps/core  (pure JS, no framework)"]
        API["api.js\nData layer — all Supabase\nCRUD & RPC calls"]
        QUIZ["quiz.js\nshuffle / buildDrill\nselectDrillTechs"]
        DIFF["difficulty.js\n4 tiers: Newbie→Overlord\nXP per tier"]
        GAME["gamification.js\nXP rules, RANKS ladder\nrankForXp()"]
        ACC["accuracy.js\ndaily accuracy\ntimeline builder"]
        ARCH["arch.js\n13 node types\nevaluate() scoring"]
        CONTACTS["contacts.js\n5 statuses, 50+ roles\nisDue() checks"]
        GITHUB["githubTechs.js\nfetch public repos\nlanguage → tech map"]
        PREP["prepData.js\n100+ techs + questions\ncategories array"]
        SCENARIOS["scenarios.js\n100 arch scenarios\n+ custom builder"]
        USER["user.js\nPROFILE_FIELDS\nform ↔ DB transform"]
        AUTH["auth.js\nfriendlyAuthError()"]
        TOKENS["tokens.js\nDesign tokens\ncolors / spacing / type"]
        I18N["i18n.js\nt() strings\n~120 keys"]

        API --> ACC
        API --> GAME
        API --> DIFF
        API --> QUIZ
        ARCH --> SCENARIOS
    end
```

---

## 4. Web App — Tab Structure

```mermaid
graph TD
    MAIN["App.jsx\nAuth gate · Header · Tab router"]

    MAIN --> PREP_TAB["🎯 Interview Prep\nInterviewPrep.jsx"]
    MAIN --> STORIES_TAB["📝 Story Bank\nStoryBank.jsx"]
    MAIN --> BOARD_TAB["🏗️ Arch Board\nArchBoard.jsx"]
    MAIN --> QUEST_TAB["🗺️ Quest\nQuest.tsx"]
    MAIN --> PROFILE_TAB["👤 Profile\nProfile.tsx"]

    subgraph SHARED_COMPONENTS ["Shared Web Components"]
        ACC_CHART["AccuracyChart"]
        CELEBRATE["CelebrationOverlay"]
        COMBOBOX["Combobox"]
        POE["PoeAssistant\n(Poe mascot)"]
        BRAND_ICON["BrandIcon"]
    end

    PREP_TAB --> ACC_CHART
    PREP_TAB --> CELEBRATE
    PREP_TAB --> COMBOBOX
    PREP_TAB --> POE
```

---

## 5. Mobile App — Tab Structure

```mermaid
graph TD
    LAYOUT["_layout.tsx\nAuth gate · AsyncStorage cache · GestureHandler"]

    LAYOUT --> IDX["🎯 index.tsx\nQuiz / Drill"]
    LAYOUT --> STORIES_M["📝 stories.tsx\nStory Bank"]
    LAYOUT --> BOARD_M["🏗️ board.tsx\nArch Board"]
    LAYOUT --> QUEST_M["🗺️ quest.tsx\nHiring Pipeline"]
    LAYOUT --> PROFILE_M["👤 profile.tsx\nProfile Form"]

    subgraph MOBILE_LIB ["lib/"]
        SUPA_M["supabase.ts\nAsyncStorage session"]
        API_M["api.ts\ncreateApi(supabase)"]
        UI_STORE["uiStore.ts\ntab bar zen mode"]
    end

    subgraph MOBILE_COMP ["components/"]
        SIGNIN["SignIn.tsx"]
        FLIP["FlipCard.tsx\nswipeable quiz card"]
        DRILL_SESSION["DrillSession.tsx"]
        DIFF_PICKER["DifficultyPicker.tsx"]
        STATS["StatsBar.tsx\nXP + accuracy"]
    end

    LAYOUT --> SUPA_M
    LAYOUT --> API_M
    IDX --> FLIP
    IDX --> DRILL_SESSION
    IDX --> DIFF_PICKER
```

---

## 6. Data Layer — API Surface

```mermaid
graph LR
    subgraph API_METHODS ["createApi(supabase) — 23+ methods"]
        direction TB
        Q["Quiz\ngetQuestions()\nrecordAnswer()\ngetScores()\naddXp()\nresetScores()"]
        C["Quest contact data\nlistContacts()\nupsertContact()\ndeleteContact()\naddRetro()\ndeleteRetro()"]
        S["Stories\nlistStories()\nupsertStory()\ndeleteStory()"]
        B["Boards\nlistBoards()\nupsertBoard()\ndeleteBoard()"]
        SC["Scenarios\nlistCustomScenarios()\nupsertCustomScenario()\ndeleteCustomScenario()"]
        U["User\ngetUser()\nupdateProfile()\ngetAccuracyTimeline()\nlistStatusEvents()"]
    end

    SUPA["Supabase Client"]
    API_METHODS --> SUPA
```

---

## 7. Database Schema

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        string email
        jsonb raw_user_meta_data
    }
    PROFILES {
        uuid id PK
        int xp
        string display_name
        string github_url
        string linkedin_url
        string timezone
        string target_role
        bool use_github_techs_for_prep
        bool onboarding_completed
    }
    CONTACTS {
        uuid id PK
        uuid user_id FK
        string name
        string status
        string role
        string link
        text notes
        date next_action_date
    }
    RETROS {
        uuid id PK
        uuid contact_id FK
        string round
        text questions_asked
        text went_well
        text to_improve
    }
    STORIES {
        uuid id PK
        uuid user_id FK
        string title
        string competency
        text situation
        text task
        text action
        text result
    }
    ANSWER_EVENTS {
        uuid id PK
        uuid user_id FK
        string tech
        bool correct
        string source
        string difficulty
        timestamptz created_at
    }
    ARCH_BOARDS {
        uuid id PK
        uuid user_id FK
        string title
        uuid scenario_id
        jsonb nodes
        jsonb edges
    }
    CUSTOM_SCENARIOS {
        uuid id PK
        uuid user_id FK
        string name
        text brief
        int budget
        jsonb checks
    }
    STATUS_EVENTS {
        uuid id PK
        uuid user_id FK
        uuid contact_id FK
        string status
        timestamptz created_at
    }
    QUESTIONS {
        uuid id PK
        string tech
        string category
        string difficulty
        text prompt
        jsonb options
        int correct
        text explanation
    }

    AUTH_USERS ||--|| PROFILES : "trigger creates"
    PROFILES ||--o{ CONTACTS : owns
    CONTACTS ||--o{ RETROS : has
    PROFILES ||--o{ STORIES : owns
    PROFILES ||--o{ ANSWER_EVENTS : owns
    PROFILES ||--o{ ARCH_BOARDS : owns
    PROFILES ||--o{ CUSTOM_SCENARIOS : owns
    CONTACTS ||--o{ STATUS_EVENTS : tracks
```

---

## 8. Quiz / Drill Data Flow

```mermaid
flowchart TD
    A([User selects tech + difficulty]) --> B["getQuestions(techs, difficulty, limit)\n→ SELECT from questions table"]
    B --> C["quiz.js: shuffle() + buildDrill()\n→ ordered card set"]
    C --> D["Render FlipCard / DragCard UI"]
    D --> E{User answers}
    E -->|correct| F["recordAnswer(tech, true, source, difficulty)"]
    E -->|wrong| F
    F --> G["INSERT answer_events"]
    F --> H["RPC add_xp(difficultyXp)\n→ UPDATE profiles.xp"]
    H --> I["React Query refetch getScores()"]
    I --> J{Rank up?}
    J -->|yes| K["CelebrationOverlay\nrank-up toast"]
    J -->|no| L{Perfect drill?}
    L -->|yes| M["CelebrationOverlay\n+30 XP bonus"]
    L -->|no| N([Continue or exit drill])
```

---

## 9. GitHub Tech Signal Flow

```mermaid
flowchart LR
    A([User enables\nuse_github_techs_for_prep]) --> B["githubTechs.js:\nfetchGithubTechSignals(username)"]
    B --> C["GitHub API\n/users/:username/repos\n(public, unauthenticated)"]
    C --> D["For each repo:\n/repos/:owner/:repo/languages"]
    D --> E["githubLanguagesToPrepTechs()\nlanguage → known tech mapping"]
    E --> F["Prepend 'From GitHub' category\nto prep tech list"]
    F --> G["selectDrillTechs(): weakest-first\nweighted by wrong answer ratio"]
    G --> H([Personalized drill order])
```

---

## 10. Hiring Pipeline Flow

```mermaid
stateDiagram-v2
    [*] --> Contacted : Add contact
    Contacted --> Applied : Submit application
    Applied --> Interviewing : Screening pass
    Interviewing --> Offer : Accepted
    Interviewing --> Rejected : Declined
    Applied --> Rejected : No response
    Offer --> [*] : Accepted / Declined

    note right of Interviewing
        Each round → addRetro()
        INSERT retros row
        User logs: questions asked,
        went_well, to_improve
    end note

    note right of Contacted
        isDue(contact) checks
        next_action_date vs today
        → due-date banner in UI
    end note
```

---

## 11. Architecture Board Flow

```mermaid
flowchart TD
    A([User opens Arch Board]) --> B{New or Load?}
    B -->|New| C["Select scenario from\n100 presets or custom"]
    B -->|Load| D["listBoards()\n→ SELECT arch_boards"]
    C --> E["Canvas: add nodes\n13 types: Client, API Gateway,\nDB, CDN, Queue, etc."]
    D --> E
    E --> F["Draw edges\nbetween nodes"]
    F --> G["arch.js evaluate(scenario, nodes, edges)\n→ run checks, score, cost"]
    G --> H{Pass checks?}
    H -->|warnings| I["Show score + warnings panel"]
    H -->|pass| J["Green score display"]
    I --> K["Refine design"]
    K --> E
    J --> L["upsertBoard(board)\n→ UPSERT arch_boards\n(nodes+edges as JSONB)"]
```

---

## 12. State Management

```mermaid
graph TD
    subgraph SERVER_STATE ["Server State — React Query"]
        SCORES["useScores()\nprofiles.xp + answer_events"]
        CONTACTS_Q["useContacts()\ncontacts table"]
        STORIES_Q["useStories()\nstories table"]
        BOARDS_Q["useBoards()\narch_boards table"]
        ACCURACY_Q["useAccuracyTimeline()\nanswer_events daily agg"]
        GITHUB_Q["useGithubTechs()\nGitHub public API"]
    end

    subgraph UI_STATE ["UI State — React useState"]
        ACTIVE_TAB["activeTab"]
        DRILL_STATE["drillSession\ncurrent card index"]
        CELEBRATE["celebrationState"]
    end

    subgraph AUTH_STATE ["Auth State — Supabase"]
        SESSION["session (JWT)\nonAuthStateChange()"]
    end

    subgraph MOBILE_CACHE ["Mobile Only — AsyncStorage"]
        PERSIST["QueryClient persisted\n24h TTL\noffline reads instant"]
    end

    SERVER_STATE --> UI_STATE
    AUTH_STATE --> UI_STATE
    SERVER_STATE --> MOBILE_CACHE
```

---

## 13. Full System Overview

```mermaid
graph TB
    USER([👤 User])

    subgraph CLIENTS ["Client Apps"]
        WEB_APP["🌐 Web App\nReact 19 / Vite\nBrowser"]
        MOBILE_APP["📱 Mobile App\nReact Native / Expo\niOS + Android"]
    end

    subgraph CORE_PKG ["@grip-apps/core (shared)"]
        BUSINESS["Business Logic\nquiz · arch · contacts\ngamification · accuracy"]
        DATA_API["Data API\ncreateApi(supabase)\n23+ methods"]
    end

    subgraph BACKEND ["Backend — Supabase (hosted PostgreSQL)"]
        AUTH_SVC["Auth Service\nemail / GitHub OAuth"]
        DB_SVC["PostgreSQL\nRLS: user_id = auth.uid()"]
        RPC["RPC Functions\nadd_xp()\ncreate_profile_for_auth_user()"]
    end

    subgraph EXTERNAL ["External APIs"]
        GITHUB_API["GitHub Public API\nrepos + languages\n(unauthenticated)"]
    end

    USER --> WEB_APP
    USER --> MOBILE_APP

    WEB_APP --> BUSINESS
    WEB_APP --> DATA_API
    MOBILE_APP --> BUSINESS
    MOBILE_APP --> DATA_API

    DATA_API --> AUTH_SVC
    DATA_API --> DB_SVC
    DATA_API --> RPC

    BUSINESS --> GITHUB_API
```
