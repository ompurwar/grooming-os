# Grooming OS — Architecture & Data Flow Diagrams

> All diagrams use [Mermaid](https://mermaid.js.org/) syntax and render natively on GitHub.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Client (Browser / PWA)"]
        UI["Next.js React App<br/>(App Router)"]
    end

    subgraph NextServer["Next.js Server (Node.js)"]
        Pages["Server Components<br/>(Pages & Layouts)"]
        API["API Route Handlers<br/>(/api/*)"]
    end

    subgraph ExternalAI["AI Services"]
        OpenAI["OpenAI GPT-4o<br/>(Vision + Text)"]
        Replicate["Replicate<br/>(Virtual Try-On)"]
    end

    subgraph Orchestration["Workflow Orchestration"]
        TemporalCloud["Temporal Cloud"]
        Worker["Temporal Worker<br/>(tsx src/temporal/worker.ts)"]
    end

    subgraph Backend["Backend Services"]
        Supabase["Supabase<br/>(PostgreSQL + Auth + Storage)"]
        Weather["Open-Meteo API<br/>(Weather Context)"]
    end

    UI -->|HTTP Requests| API
    UI -->|RSC Streaming| Pages
    Pages -->|SQL via Supabase Client| Supabase
    API -->|SQL via Supabase Client| Supabase
    API -->|generateObject / embed| OpenAI
    API -->|Prediction API| Replicate
    API -->|Start Workflow| TemporalCloud
    TemporalCloud -->|Dispatch Activity| Worker
    Worker -->|generateObject (Vision)| OpenAI
    Worker -->|Write Results| Supabase
    Replicate -->|Webhook Callback| API
    UI -->|Geolocation → Weather| Weather

    style Client fill:#1a1a2e,stroke:#e94560,color:#eee
    style NextServer fill:#16213e,stroke:#0f3460,color:#eee
    style ExternalAI fill:#0f3460,stroke:#533483,color:#eee
    style Orchestration fill:#533483,stroke:#e94560,color:#eee
    style Backend fill:#1a1a2e,stroke:#e94560,color:#eee
```

---

## 2. Application Route Map

```mermaid
graph LR
    subgraph Public["Public Routes"]
        Landing["/ <br/>Landing Page"]
        Login["/login"]
        Signup["/signup"]
        Onboarding["/onboarding/*"]
    end

    subgraph Dashboard["Dashboard (Authenticated)"]
        Home["/home"]
        Wardrobe["/wardrobe"]
        WardrobeAdd["/wardrobe/add"]
        WardrobeDetail["/wardrobe/:id"]
        Style["/style"]
        StyleGetReady["/style/get-ready"]
        StyleSaved["/style/saved"]
        StyleCapsule["/style/capsule/:id"]
        Groom["/groom"]
        GroomScan["/groom/scan"]
        Profile["/profile"]
        ProfileBody["/profile/body"]
        ProfileSettings["/profile/settings"]
    end

    subgraph APIs["API Routes"]
        AnalyzeBody["POST /api/analyze/body"]
        AnalyzeFace["POST /api/analyze/face"]
        AnalyzeWardrobe["POST /api/analyze/wardrobe"]
        StyleGenerate["POST /api/style/generate"]
        StyleCapsuleGen["POST /api/style/capsule/generate"]
        StyleCapsuleDel["DELETE /api/style/capsule/:id"]
        StyleCapsules["GET /api/style/capsules"]
        StyleGetReadyAPI["GET /api/style/get-ready"]
        StyleCheckExist["POST /api/style/check-existing"]
        StyleTryOn["POST /api/style/try-on"]
        GroomRec["POST /api/groom/recommendations"]
        WebhookVTO["POST /api/webhooks/vto"]
    end

    Landing --> Login
    Landing --> Onboarding
    Login --> Home
    Signup --> Onboarding
    Onboarding --> Home

    Home --> Wardrobe
    Home --> Style
    Home --> Groom
    Home --> Profile

    style Public fill:#1a1a2e,stroke:#e94560,color:#eee
    style Dashboard fill:#16213e,stroke:#0f3460,color:#eee
    style APIs fill:#0f3460,stroke:#533483,color:#eee
```

---

## 3. Database Entity-Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| USERS : "extends"
    USERS ||--o{ BODY_PROFILES : "has"
    USERS ||--o{ FACE_PROFILES : "has"
    USERS ||--o{ STYLE_PREFERENCES : "has"
    USERS ||--o{ WARDROBE_ITEMS : "owns"
    USERS ||--o{ OUTFITS : "creates"
    USERS ||--o{ OUTFIT_HISTORY : "logs"
    USERS ||--o{ GROOMING_RECOMMENDATIONS : "receives"
    USERS ||--o{ MARKETPLACE_RECOMMENDATIONS : "receives"
    USERS ||--o{ CAPSULES : "creates"

    OUTFITS ||--o{ OUTFIT_ITEMS : "contains"
    OUTFIT_ITEMS }o--o| WARDROBE_ITEMS : "references"
    OUTFIT_ITEMS }o--o| MARKETPLACE_ITEMS : "suggests"
    OUTFITS }o--o| CAPSULES : "scoped to"
    OUTFIT_HISTORY }o--|| OUTFITS : "records"

    CAPSULES ||--o{ CAPSULE_ITEMS : "includes"
    CAPSULE_ITEMS }o--|| WARDROBE_ITEMS : "packs"

    MARKETPLACE_RECOMMENDATIONS }o--|| MARKETPLACE_ITEMS : "recommends"
    MARKETPLACE_RECOMMENDATIONS }o--o| OUTFITS : "related to"

    USERS {
        uuid id PK
        text email
        text full_name
        text subscription_tier
        boolean onboarding_completed
    }
    BODY_PROFILES {
        uuid id PK
        uuid user_id FK
        text body_type
        text height_estimate
        jsonb fit_recommendations
    }
    FACE_PROFILES {
        uuid id PK
        uuid user_id FK
        text face_shape
        text skin_tone
        text undertone
        jsonb color_palette
    }
    WARDROBE_ITEMS {
        uuid id PK
        uuid user_id FK
        text image_url
        text category
        text primary_color
        int formality_score
        jsonb ai_tags
        vector embedding
    }
    OUTFITS {
        uuid id PK
        uuid user_id FK
        uuid capsule_id FK
        text occasion
        float confidence_score
        text reasoning
        boolean is_saved
    }
    CAPSULES {
        uuid id PK
        uuid user_id FK
        text title
        text destinations
        int days
        text bag_size
    }
    CAPSULE_ITEMS {
        uuid id PK
        uuid capsule_id FK
        uuid wardrobe_item_id FK
        boolean is_core_item
    }
    MARKETPLACE_ITEMS {
        uuid id PK
        text title
        text category
        decimal price_inr
        text partner_url
    }
```

---

## 4. DFD Level 0 — Context Diagram

```mermaid
graph LR
    User(("👤 User"))
    System["Grooming OS"]
    OpenAI["OpenAI<br/>GPT-4o"]
    Replicate["Replicate<br/>VTO"]
    Supabase["Supabase<br/>DB + Auth + Storage"]
    Weather["Open-Meteo<br/>Weather API"]

    User -->|"Photos, Prompts, Preferences"| System
    System -->|"Outfits, Grooming Recs, Looks"| User

    System -->|"Image + Text Analysis Requests"| OpenAI
    OpenAI -->|"Structured JSON Responses"| System

    System -->|"Try-On Prediction Requests"| Replicate
    Replicate -->|"Generated Images (via Webhook)"| System

    System <-->|"CRUD Operations, Auth, File Storage"| Supabase

    System -->|"Lat/Long Coords"| Weather
    Weather -->|"Temperature, Conditions"| System
```

---

## 5. DFD Level 1 — Major Processes

```mermaid
graph TB
    User(("👤 User"))

    subgraph P1["P1: Authentication & Onboarding"]
        Auth["1.1 Auth<br/>(Login / Signup)"]
        Onboard["1.2 Onboarding<br/>(Style Quiz)"]
    end

    subgraph P2["P2: Body & Face Analysis"]
        BodyAnalysis["2.1 Analyze Body<br/>(2 Photos → GPT-4o Vision)"]
        FaceAnalysis["2.2 Analyze Face<br/>(Photo → GPT-4o Vision)"]
    end

    subgraph P3["P3: Wardrobe Management"]
        Upload["3.1 Upload Item<br/>(Camera / Gallery)"]
        AutoTag["3.2 AI Auto-Tag<br/>(GPT-4o Vision)"]
        Embed["3.3 Generate Embedding<br/>(text-embedding-3-small)"]
        Browse["3.4 Browse Wardrobe"]
    end

    subgraph P4["P4: AI Styling Engine"]
        PromptInput["4.1 Occasion Prompt"]
        WeatherCtx["4.2 Weather Context"]
        SemanticSearch["4.3 Semantic Search<br/>(pgvector RAG)"]
        GenerateLook["4.4 Generate Outfit<br/>(GPT-4o)"]
        SaveLook["4.5 Save / Discard"]
    end

    subgraph P5["P5: Travel Capsule"]
        CapsuleInput["5.1 Trip Details"]
        CapsuleRAG["5.2 Semantic Wardrobe Search"]
        CapsuleCurate["5.3 AI Capsule Curation"]
        CapsuleSave["5.4 Save Capsule"]
    end

    subgraph P6["P6: Grooming Intelligence"]
        GroomScan["6.1 Face Scan"]
        GroomRec["6.2 AI Recommendations<br/>(Hair, Beard, Glasses)"]
        VTO["6.3 Virtual Try-On<br/>(Replicate)"]
    end

    subgraph DS["Data Stores"]
        DB[("Supabase<br/>PostgreSQL")]
        Storage[("Supabase<br/>Storage")]
    end

    User --> Auth --> DB
    User --> Onboard --> DB
    User --> Upload --> Storage
    Upload --> AutoTag
    AutoTag --> DB
    AutoTag --> Embed --> DB
    User --> Browse --> DB

    User --> PromptInput
    PromptInput --> WeatherCtx
    WeatherCtx --> SemanticSearch --> DB
    SemanticSearch --> GenerateLook --> DB
    GenerateLook --> User
    User --> SaveLook --> DB

    User --> CapsuleInput --> CapsuleRAG --> DB
    CapsuleRAG --> CapsuleCurate --> CapsuleSave --> DB

    User --> GroomScan
    GroomScan --> GroomRec --> DB
    GroomRec --> VTO --> User

    User --> BodyAnalysis --> DB
    User --> FaceAnalysis --> DB
```

---

## 6. DFD Level 2 — Wardrobe Upload Flow (Process 3 Detail)

```mermaid
graph TB
    User(("👤 User"))
    Camera["Camera / Gallery<br/>Capture"]
    Crop["Image Cropper<br/>(react-easy-crop)"]
    SupaStorage[("Supabase Storage<br/>(wardrobe-items bucket)")]
    APIRoute["POST /api/analyze/wardrobe"]
    GPT4oVision["OpenAI GPT-4o<br/>Vision Analysis"]
    EmbeddingModel["OpenAI<br/>text-embedding-3-small"]
    DB[("Supabase PostgreSQL<br/>wardrobe_items table")]

    User -->|"Selects / Captures Photo"| Camera
    Camera -->|"Raw Image"| Crop
    Crop -->|"Cropped Blob"| SupaStorage
    SupaStorage -->|"Public URL"| APIRoute
    APIRoute -->|"Image URL"| GPT4oVision
    GPT4oVision -->|"category, color, pattern,<br/>material, formality, ai_tags"| APIRoute
    APIRoute -->|"Tag Description String"| EmbeddingModel
    EmbeddingModel -->|"1536-dim Vector"| APIRoute
    APIRoute -->|"INSERT wardrobe_item<br/>+ embedding"| DB
    DB -->|"Success Response"| User
```

---

## 7. DFD Level 2 — Outfit Generation Flow (Process 4 Detail)

```mermaid
graph TB
    User(("👤 User"))
    StylePage["Style Page<br/>(Prompt + Occasion Chips)"]
    GeoAPI["Browser Geolocation API"]
    WeatherAPI["Open-Meteo<br/>Weather API"]
    EmbedPrompt["OpenAI Embed<br/>(text-embedding-3-small)"]
    PGVector["pgvector RPC<br/>match_wardrobe_items"]
    GPT4o["OpenAI GPT-4o<br/>generateObject"]
    DB[("Supabase PostgreSQL")]
    GetReady["Get Ready Page<br/>(LookCard Component)"]

    User -->|"Types Occasion Prompt"| StylePage
    StylePage -->|"Request Location"| GeoAPI
    GeoAPI -->|"lat, lon"| WeatherAPI
    WeatherAPI -->|"city, temp, condition"| StylePage
    StylePage -->|"POST /api/style/generate<br/>{prompt, weatherContext}"| EmbedPrompt
    EmbedPrompt -->|"Prompt Embedding"| PGVector
    PGVector -->|"Top-N Wardrobe Items"| DB
    DB -->|"Item Details<br/>(id, category, color, tags)"| GPT4o
    GPT4o -->|"Outfit Selection,<br/>Reasoning, Grooming Tips"| DB
    DB -->|"Saved Outfit ID"| GetReady
    GetReady -->|"Full Look Card + VTO"| User
```

---

## 8. DFD Level 2 — Grooming & Virtual Try-On Flow (Process 6 Detail)

```mermaid
graph TB
    User(("👤 User"))
    ScanPage["Groom Scan Page<br/>(CameraCapture)"]
    SupaStorage[("Supabase Storage")]
    GroomAPI["POST /api/groom/recommendations"]
    GPT4o["OpenAI GPT-4o Vision<br/>(Face Analysis)"]
    DB[("Supabase PostgreSQL<br/>grooming_recommendations)"]
    GroomPage["Groom Dashboard<br/>(Recommendation Cards)"]
    TryOnAPI["POST /api/style/try-on"]
    ReplicateAPI["Replicate API<br/>(Virtual Try-On Model)"]
    WebhookAPI["POST /api/webhooks/vto<br/>(Callback)"]

    User -->|"Capture Face Photo"| ScanPage
    ScanPage -->|"Upload Image"| SupaStorage
    SupaStorage -->|"Photo URL"| GroomAPI
    GroomAPI -->|"Face Image"| GPT4o
    GPT4o -->|"face_shape, hair recs,<br/>beard recs, glasses recs"| GroomAPI
    GroomAPI -->|"INSERT recommendations"| DB
    DB -->|"Recommendation List"| GroomPage
    GroomPage -->|"User Selects Style"| User

    User -->|"Try This Look"| TryOnAPI
    TryOnAPI -->|"face_url + style_ref"| ReplicateAPI
    ReplicateAPI -->|"Async Processing..."| WebhookAPI
    WebhookAPI -->|"UPDATE visualization_url"| DB
    DB -->|"Rendered Preview"| GroomPage
    GroomPage -->|"Virtual Try-On Result"| User
```

---

## 9. Component Hierarchy Diagram

```mermaid
graph TB
    subgraph RootLayout["Root Layout (src/app/layout.tsx)"]
        subgraph AuthGroup["(auth) Route Group"]
            LoginPage["/login"]
            SignupPage["/signup"]
            OnboardingPages["/onboarding/*<br/>(Style Quiz)"]
        end

        subgraph DashLayout["(dashboard) Layout<br/>+ BottomNav"]
            HomePage["/home"]

            subgraph WardrobeSection["Wardrobe"]
                WardrobePage["/wardrobe"]
                WardrobeAddPage["/wardrobe/add<br/>+ ImageCropper"]
                WardrobeDetailPage["/wardrobe/:id"]
            end

            subgraph StyleSection["Styling"]
                StylePage["/style<br/>(Daily + Capsule Mode)"]
                GetReadyPage["/style/get-ready<br/>+ LookCard"]
                SavedPage["/style/saved"]
                CapsuleDetailPage["/style/capsule/:id<br/>+ DeleteCapsuleButton"]
            end

            subgraph GroomSection["Grooming"]
                GroomPage["/groom"]
                GroomScanPage["/groom/scan<br/>+ CameraCapture"]
            end

            subgraph ProfileSection["Profile"]
                ProfilePage["/profile"]
                ProfileBodyPage["/profile/body"]
                ProfileSettingsPage["/profile/settings"]
            end
        end

        LandingPage["/ (Landing Page)"]
    end

    style RootLayout fill:#1a1a2e,stroke:#e94560,color:#eee
    style DashLayout fill:#16213e,stroke:#0f3460,color:#eee
    style AuthGroup fill:#0f3460,stroke:#533483,color:#eee
```

---

## 10. Temporal Workflow Architecture

```mermaid
sequenceDiagram
    participant Client as Browser Client
    participant API as Next.js API Route
    participant TC as Temporal Cloud
    participant Worker as Temporal Worker
    participant OpenAI as OpenAI GPT-4o
    participant DB as Supabase DB

    Note over Client,DB: Wardrobe Upload Workflow
    Client->>API: POST /api/analyze/wardrobe<br/>{imageUrl}
    API->>TC: startWorkflow<br/>(processWardrobeUploadWorkflow)
    API-->>Client: 202 Accepted<br/>{workflowId}
    TC->>Worker: dispatch activity<br/>(analyzeWardrobeItemImage)
    Worker->>OpenAI: generateObject (GPT-4o Vision)<br/>{image, schema}
    OpenAI-->>Worker: {category, color, pattern,<br/>material, formality, ai_tags}
    Worker-->>TC: Activity Complete
    TC->>DB: Save analysis result

    Note over Client,DB: Styling Workflow
    Client->>API: POST /api/style/generate<br/>{prompt, weatherContext}
    API->>TC: startWorkflow<br/>(generateStylingWorkflow)
    TC->>Worker: dispatch activity<br/>(generateOutfitRecommendation)
    Worker->>OpenAI: generateObject (GPT-4o)<br/>{wardrobe, occasion, body}
    OpenAI-->>Worker: {items, reasoning,<br/>grooming_notes, hairstyle}
    Worker-->>TC: Activity Complete
    TC-->>API: Workflow Result
    API->>DB: INSERT outfit + outfit_items
    API-->>Client: {outfitId}
```

---

## 11. Authentication & Session Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Browser as Browser
    participant NextServer as Next.js Server
    participant Supabase as Supabase Auth

    User->>Browser: Navigate to /login
    Browser->>NextServer: GET /login
    NextServer-->>Browser: Login Page (Client Component)

    User->>Browser: Enter email + password
    Browser->>Supabase: supabase.auth.signInWithPassword()
    Supabase-->>Browser: Set session cookies<br/>(access_token, refresh_token)
    Browser->>NextServer: Redirect to /home

    Note over Browser,Supabase: Subsequent Requests
    Browser->>NextServer: GET /home (with cookies)
    NextServer->>Supabase: createServerClient(cookies)<br/>supabase.auth.getSession()
    Supabase-->>NextServer: {session, user}
    NextServer-->>Browser: Rendered Dashboard

    Note over Browser,Supabase: API Calls
    Browser->>NextServer: POST /api/style/generate
    NextServer->>Supabase: createServerClient(cookies)<br/>supabase.auth.getUser()
    Supabase-->>NextServer: {user} (RLS enforced)
    NextServer-->>Browser: {outfitId}
```

---

## 12. Deployment Topology

```mermaid
graph TB
    subgraph UserDevice["User Device"]
        Browser["Browser / PWA"]
    end

    subgraph Vercel["Vercel (or Node.js Host)"]
        NextApp["Next.js 16 App<br/>(SSR + API Routes)"]
    end

    subgraph TemporalCloud["Temporal Cloud"]
        TemporalServer["Temporal Server<br/>(Workflow Orchestration)"]
    end

    subgraph WorkerHost["Worker Process<br/>(Long-Running)"]
        TemporalWorker["Temporal Worker<br/>(npm run worker)"]
    end

    subgraph SupabaseCloud["Supabase Cloud"]
        SupaAuth["Auth Service"]
        SupaDB["PostgreSQL<br/>+ pgvector"]
        SupaStorage["Object Storage<br/>(Images)"]
    end

    subgraph AIProviders["AI Providers"]
        OpenAI["OpenAI API"]
        Replicate["Replicate API"]
    end

    subgraph ExternalAPIs["External APIs"]
        OpenMeteo["Open-Meteo<br/>Weather"]
        Ngrok["ngrok tunnel<br/>(Dev Only)"]
    end

    Browser <-->|HTTPS| NextApp
    NextApp <-->|HTTPS| SupaAuth
    NextApp <-->|SQL + REST| SupaDB
    NextApp <-->|REST| SupaStorage
    NextApp <-->|gRPC| TemporalServer
    TemporalServer <-->|gRPC| TemporalWorker
    TemporalWorker -->|HTTPS| OpenAI
    NextApp -->|HTTPS| OpenAI
    NextApp -->|HTTPS| Replicate
    Replicate -->|Webhook via ngrok| NextApp
    Browser -->|HTTPS| OpenMeteo

    style UserDevice fill:#1a1a2e,stroke:#e94560,color:#eee
    style Vercel fill:#16213e,stroke:#0f3460,color:#eee
    style TemporalCloud fill:#533483,stroke:#e94560,color:#eee
    style WorkerHost fill:#533483,stroke:#e94560,color:#eee
    style SupabaseCloud fill:#0f3460,stroke:#e94560,color:#eee
    style AIProviders fill:#1a1a2e,stroke:#533483,color:#eee
    style ExternalAPIs fill:#1a1a2e,stroke:#0f3460,color:#eee
```
