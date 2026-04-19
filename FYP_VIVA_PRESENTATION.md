# FYP Viva Presentation — Skill Exchange Platform
## Georges Sassine | Kingston University | 2025–2026
### 20-Slide Structure | ~20 Minutes

---

## SLIDE 1 — Title Slide

**Title:** SkillSwap: A Peer-to-Peer Skill Exchange Platform for University Students

**Subtitle:** Final Year Project — BSc Computer Science

**Presented by:** Ali Assi


**Kingston University London**

> **Speaker Notes:**
> "Good morning/afternoon. My name is ALI ASSI, and today I'll be presenting my final year project — a peer-to-peer skill exchange platform designed specifically for university students. I'll walk you through the problem I set out to solve, the decisions I made during design and development, a full demonstration of the working system, and an honest evaluation of what I achieved."

---

## SLIDE 2 — The Problem

**Title:** The Problem

- University students possess diverse skills but lack a structured way to exchange them
- Existing peer support is informal, untracked, and unreliable
- Students pay for tutoring and services they could get free from peers
- No trust or accountability mechanism exists for informal skill sharing
- Talented students have no visibility — their skills go undiscovered

> **Speaker Notes:**
> "Before I describe what I built, let me explain WHY I built it. University campuses are full of talented students — someone is great at Python, another at graphic design, another at music. But there's no structured way for them to find each other, exchange skills, and build trust. What happens instead? Students either pay for expensive tutoring, post on random group chats hoping someone replies, or simply never discover that a classmate two rows away could have helped them. The problem isn't a lack of skills — it's a lack of a system to connect, exchange, and verify those skills reliably."

---

## SLIDE 3 — Prior Work & Existing Solutions

**Title:** Existing Solutions & Their Limitations

| Platform | What It Does | Limitation |
|----------|-------------|------------|
| **Fiverr / Upwork** | Freelance marketplaces | Monetary — excludes students without budgets |
| **UniDays** | Student discounts | Consumption-focused, not skill-sharing |
| **Facebook Groups** | Informal peer requests | No accountability, no tracking, no trust system |
| **TimeBank apps** | Time-based exchange | Not designed for academic/student context |
| **University tutoring** | Formal peer tutoring | Limited subjects, bureaucratic, not peer-to-peer |

**Key gap:** No platform combines skill matching, credit-based exchange, reputation tracking, and real-time communication in a student-only environment.

> **Speaker Notes:**
> "I researched existing platforms. Fiverr and Upwork are monetary — they don't work for students exchanging skills for free. Facebook groups are chaotic with no accountability. TimeBanking apps exist but aren't designed for a university context. University tutoring programs cover limited subjects and aren't truly peer-to-peer. The gap I identified was clear: there's no platform that combines skill discovery, a non-monetary exchange mechanism, reputation tracking, and real-time communication — all restricted to verified university students."

---

## SLIDE 4 — Aims & Objectives

**Title:** Project Aim & Objectives

**Aim:** To design and develop a mobile platform that enables Kingston University students to discover, exchange, and track skill-based services using a virtual credit system.

**Objectives:**
1. Implement secure, university-restricted authentication
2. Build a service marketplace with search, filtering, and categorisation
3. Develop a virtual credit system with atomic transaction processing
4. Create real-time messaging for service coordination
5. Implement a reputation system based on peer reviews
6. Build AI-powered service discovery
7. Develop an admin dashboard for platform moderation

> **Speaker Notes:**
> "My aim was to build a fully functional mobile platform where Kingston University students can exchange skills without money. I broke this down into seven concrete objectives — each one maps directly to a feature I implemented. By the end of this presentation, I'll evaluate whether each of these was achieved."

---

## SLIDE 5 — Technology Decisions

**Title:** Technology Stack & Justification

| Layer | Technology | Why This Choice |
|-------|-----------|----------------|
| **Frontend** | React Native (Expo) | Cross-platform (iOS + Android) from single codebase; rapid prototyping |
| **Backend** | Node.js + Express | JavaScript end-to-end; non-blocking I/O for real-time chat |
| **Database** | MySQL | Relational data (users↔services↔transactions); ACID compliance for credit transfers |
| **Real-time** | Socket.IO | WebSocket abstraction for live chat, typing indicators, online status |
| **Auth** | JWT + bcrypt | Stateless authentication; industry-standard password hashing |
| **Security** | Helmet + CORS + Parameterised SQL | Defence against XSS, CSRF, SQL injection |

> **Speaker Notes:**
> "Every technology choice was deliberate. I chose React Native with Expo because I needed cross-platform delivery without maintaining two codebases. MySQL over MongoDB because my data is highly relational — users have services, services have transactions, transactions have reviews — and I needed ACID compliance for the credit transfer system where atomicity is critical. Socket.IO was chosen for real-time chat because it handles WebSocket fallbacks gracefully. Security wasn't an afterthought — I used Helmet for HTTP headers, bcrypt for password hashing, JWT for stateless auth, and parameterised queries throughout to prevent SQL injection."

---

## SLIDE 6 — System Architecture

**Title:** System Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              React Native (Expo)                 │
│   Auth Context → Navigation → Screens → Services │
└───────────────┬──────────────┬──────────────────┘
                │ HTTP/REST    │ WebSocket
                ▼              ▼
┌───────────────────────────────────────────────┐
│           Node.js + Express Server            │
│  Routes → Controllers → Middleware            │
│                    │                          │
│              Socket.IO Server                 │
└───────────────────┬───────────────────────────┘
                    │ mysql2/promise
                    ▼
┌───────────────────────────────────────────────┐
│              MySQL Database                   │
│  8 Tables: users, skills, services,           │
│  transactions, reviews, messages,             │
│  notifications, reports                       │
└───────────────────────────────────────────────┘
```

- **11 API route groups**, **30+ REST endpoints**
- **8 normalised database tables** with foreign key relationships
- **Dual communication:** REST API + WebSocket for real-time features

> **Speaker Notes:**
> "Here's the high-level architecture. The frontend is a React Native app that communicates with the backend via two channels: REST API for CRUD operations and WebSocket via Socket.IO for real-time chat. The backend follows an MVC-inspired pattern — routes map to controllers, middleware handles authentication and error handling, and the data layer uses MySQL with connection pooling. The database has 8 normalised tables with proper foreign key relationships. This isn't a simple CRUD app — it has 30+ endpoints handling complex business logic like atomic credit transfers and reputation recalculation."

---

## SLIDE 7 — Database Design

**Title:** Database Design — 8 Normalised Tables

**Key design decisions:**
- `users` table with role-based access (student/admin) and account status management
- `transactions` table with state machine (pending → accepted → in_progress → completed)
- `reviews` linked to transactions with unique constraint (one review per participant per transaction)
- Credits stored as integers on the user record — updated atomically via MySQL transactions
- `reputation_score` recalculated as AVG of all received ratings on every new review

**Relationships:**
- Users → Services (1:many)
- Services → Transactions (1:many)
- Transactions → Reviews (1:many, max 2)
- Users ↔ Messages (many:many via sender/receiver)

> **Speaker Notes:**
> "The database was designed with data integrity as the priority. The transaction table implements a state machine — a transaction can only move through valid states: pending to accepted, accepted to in-progress, in-progress to completed. This prevents invalid state transitions. Credits are updated using MySQL's BEGIN/COMMIT/ROLLBACK — if the debit succeeds but the credit fails, the entire operation rolls back. The reputation score isn't cached — it's recalculated as the average of ALL received ratings every time a new review is submitted, ensuring accuracy."

---

## SLIDE 8 — Authentication & Security (Feature Demo)

**Title:** Secure Authentication — University-Restricted Access

**Key features:**
- Registration restricted to `@kingston.ac.uk` email domain
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with 7-day expiry for session persistence
- Account status enforcement (active / suspended / deleted)
- Auto-login on app restart via secure token storage

[INSERT SCREENSHOT HERE – Registration screen showing Kingston email validation]
**Comment:** Upload a screenshot of the RegistrationScreen showing the email field with Kingston email format and the registration form

[INSERT SCREENSHOT HERE – Login screen]
**Comment:** Upload a screenshot of the LoginScreen showing the Kingston-branded login form

> **Speaker Notes:**
> "Security was a core requirement. Registration is restricted to Kingston email addresses only — the system validates the @kingston.ac.uk domain. Passwords are never stored in plain text; they're hashed using bcrypt with 10 salt rounds. On login, the server issues a JWT token that persists across sessions, so users don't need to log in every time they open the app. If an admin suspends an account, the middleware blocks all API requests for that user immediately."

---

## SLIDE 9 — Profile Setup (Feature Demo)

**Title:** Guided Profile Setup — 3-Step Wizard

**Flow:**
1. **Step 1:** Profile photo + Bio
2. **Step 2:** Skills offered & Skills needed (chip selection from categories)
3. **Step 3:** Major & Academic year

- Skills are categorised: Programming, Design, Tutoring, Language, Music, Writing
- Profile data drives the skill matching algorithm

[INSERT SCREENSHOT HERE – ProfileSetupScreen Step 2 showing skill chip selection]
**Comment:** Upload a screenshot of ProfileSetupScreen showing the skills offered/needed chip selector interface

> **Speaker Notes:**
> "After registration, users go through a guided 3-step profile setup. This isn't just for display — the skills they select here directly feed into the matching algorithm I'll show you later. Users pick from predefined skill categories for both what they can offer and what they need. This structured approach ensures consistent data for matching, rather than free-text that would be hard to compare."

---

## SLIDE 10 — Service Marketplace (Feature Demo)

**Title:** Service Marketplace — Browse, Search & Filter

**Features:**
- Category filter chips (Tutoring, Design, Programming, Language, Music, Writing, Other)
- Full-text search across title and description
- Service cards showing: provider name, credit cost, duration, rating
- Paginated results (max 50 per page)
- View count tracking per service

[INSERT SCREENSHOT HERE – BrowseServicesScreen showing category filters and service cards]
**Comment:** Upload a screenshot of BrowseServicesScreen with category chips visible and at least 2-3 service cards displayed

[INSERT SCREENSHOT HERE – ServiceRequestOfferScreen in view mode showing service details]
**Comment:** Upload a screenshot of the service detail view showing full service info, provider profile, and the Request button

> **Speaker Notes:**
> "The marketplace is the core of the platform. Students can browse all available services, filter by category using these chips, or search by keyword. Each service card shows the provider's name, credit cost, estimated duration, and their reputation rating. When you tap a service, you see the full details including the provider's profile and a credit check — the system tells you whether you have enough credits to request this service. The backend handles pagination, search indexing across title and description, and automatically increments view counts."

---

## SLIDE 11 — Transaction & Credit System (Feature Demo)

**Title:** Virtual Credit System — Atomic Transaction Processing

**The Credit Flow:**
```
New user starts with 100 credits
        ↓
Requests a service (e.g., 15 credits)
        ↓
Provider accepts → status: in_progress
        ↓
Requester completes verification checklist
        ↓
ATOMIC TRANSFER: Requester −15 | Provider +15
        ↓
Both can leave reviews
```

**Technical depth:**
- MySQL `BEGIN` / `COMMIT` / `ROLLBACK` for atomicity
- Prevents: self-requests, duplicate pending requests, insufficient credits
- State machine: `pending → accepted → in_progress → completed/cancelled/disputed`
- Scheduled date validation (must be future date)

[INSERT SCREENSHOT HERE – ServiceCompletionScreen showing the 4-item verification checklist]
**Comment:** Upload a screenshot of ServiceCompletionScreen with the checklist items visible (service performed, quality met, duration as described, communication satisfactory)

> **Speaker Notes:**
> "This is where the system shows real depth. Every new user starts with 100 virtual credits. When you request a service, the system validates you have enough credits, prevents you from requesting your own service, and blocks duplicate pending requests. The transaction follows a strict state machine — pending, accepted, in-progress, completed. The critical part is the completion step: the requester goes through a 4-item verification checklist, and only then does the credit transfer happen. This transfer uses a MySQL transaction — BEGIN, debit the requester, credit the provider, COMMIT. If anything fails mid-way, the entire operation rolls back. This is the same principle banks use for money transfers."

---

## SLIDE 12 — Real-Time Chat System (Feature Demo)

**Title:** Real-Time Messaging — Socket.IO Integration

**Features:**
- Conversation list with unread message counts
- Real-time message delivery via WebSocket
- Typing indicators and online status tracking
- Message persistence in MySQL
- Read receipts (mark as read when conversation opened)

**Backend events:**
- `user_online` → tracks active users
- `send_message` → persists + delivers + notifies
- `typing` / `stop_typing` → live indicators
- `mark_as_read` → updates DB + notifies sender

[INSERT SCREENSHOT HERE – MessagesListScreen showing conversation list with unread badges]
**Comment:** Upload a screenshot of MessagesListScreen showing multiple conversations, unread count badges, and the AI Service Finder card at top

[INSERT SCREENSHOT HERE – ChatScreen showing a conversation with message bubbles]
**Comment:** Upload a screenshot of ChatScreen showing sent/received message bubbles in a conversation

> **Speaker Notes:**
> "The chat system uses Socket.IO for real-time communication. When a user sends a message, it's simultaneously saved to the database AND pushed to the recipient via WebSocket if they're online. The conversation list shows unread counts, and messages are automatically marked as read when the conversation is opened. The backend tracks online users in memory and broadcasts typing indicators in real-time. This dual approach — REST for history, WebSocket for live delivery — ensures messages are never lost even if the recipient is offline."

---

## SLIDE 13 — AI Service Finder (Feature Demo)

**Title:** AI-Powered Service Discovery

**How it works:**
1. User types natural language query (e.g., "I need help with Python programming")
2. System extracts keywords and removes stop words
3. Subject detection maps synonyms (e.g., "coding" → "programming")
4. Database searched using LIKE queries across title, description, category
5. Results formatted with provider name, credits, rating
6. Conversation saved to database for context

**Key design decision:** Rule-based NLP — no external API dependency, fully self-contained, zero cost

[INSERT SCREENSHOT HERE – ChatScreen in AI mode showing a search query and formatted results]
**Comment:** Upload a screenshot of ChatScreen with isAI mode active, showing a user query like "I need help with programming" and the AI's formatted response with service suggestions

> **Speaker Notes:**
> "I integrated an AI-powered service finder accessible directly from the chat screen. Users can ask in natural language — 'I need help with Python' or 'Can someone teach me guitar?' — and the system extracts keywords, maps synonyms to categories, and searches the database. I made a deliberate decision to use rule-based NLP rather than calling an external LLM API. Why? Because it keeps the system self-contained, has zero running cost, has no latency from API calls, and for the specific use case of service search, keyword extraction is sufficient. The results are formatted with provider details and users can navigate directly to the service listing."

---

## SLIDE 14 — Reviews & Reputation System (Feature Demo)

**Title:** Peer Review & Dynamic Reputation

**System design:**
- Reviews linked to completed transactions only
- 1-5 star rating + text comment + tags (Professional, Helpful, Patient, etc.)
- One review per participant per transaction (enforced by unique constraint)
- `reputation_score = AVG(all received ratings)` — recalculated on every new review
- Reputation displayed on profiles and service cards

[INSERT SCREENSHOT HERE – FeedbackReputationScreen showing star rating selection and review form]
**Comment:** Upload a screenshot of FeedbackReputationScreen showing the interactive star rating, text review input, and tag selection chips

> **Speaker Notes:**
> "Trust is essential for a peer exchange platform. After every completed transaction, both participants can leave a review — a star rating from 1 to 5, a text comment, and descriptive tags. The system enforces that you can only review someone you've actually transacted with, and only once per transaction. The reputation score isn't a simple average of recent reviews — it's recalculated as the mean of ALL received ratings every time a new review comes in. This score is displayed everywhere — on profiles, service cards, and search results — creating accountability."

---

## SLIDE 15 — Skill Matching Algorithm (Feature Demo)

**Title:** Intelligent Skill Matching

**Algorithm:**
- Compares user's **needed skills** against all available **service offerings**
- Generates a **match percentage score** based on skill overlap
- Results sortable by: Best Match, Rating, Credits (Low → High)
- Filterable by category

**Why this matters:** Passive discovery — users find relevant services without searching

[INSERT SCREENSHOT HERE – SkillMatchingScreen showing match cards with percentage scores]
**Comment:** Upload a screenshot of SkillMatchingScreen showing matched services with percentage scores, provider info, and Contact/Request buttons

> **Speaker Notes:**
> "Beyond active search, I implemented a skill matching algorithm. It takes the skills a user said they NEED during profile setup and compares them against all available service offerings. Each match gets a percentage score based on skill overlap. This enables passive discovery — users open the matching screen and immediately see relevant services ranked by how well they match their needs, without typing a single search query. They can also filter by category and sort by rating or credit cost."

---

## SLIDE 16 — Admin Dashboard (Feature Demo)

**Title:** Admin Dashboard — Platform Governance

**Three management areas:**

| Tab | Capabilities |
|-----|-------------|
| **Users** | View all users, search, suspend/activate/delete accounts |
| **Services** | View all listings, remove inappropriate content |
| **Statistics** | Total users, services, transactions, reports, credits in circulation |

- Report workflow: `pending → reviewing → resolved / dismissed`
- Admin actions generate automatic notifications to affected users
- Role-based access: admin endpoints protected by middleware

[INSERT SCREENSHOT HERE – AdminDashboardScreen showing the Statistics tab with platform metrics]
**Comment:** Upload a screenshot of AdminDashboardScreen Statistics tab showing cards with total users, services, transactions, reports, and credits circulating

[INSERT SCREENSHOT HERE – AdminDashboardScreen showing the Users tab with action buttons]
**Comment:** Upload a screenshot of AdminDashboardScreen Users tab showing the user list with suspend/activate/delete action buttons

> **Speaker Notes:**
> "The admin dashboard provides full platform governance. It has three tabs: Users — where the admin can search, view, suspend, activate, or permanently delete accounts; Services — where inappropriate listings can be removed; and Statistics — showing platform health metrics like total users, active services, completed transactions, and total credits in circulation. When an admin suspends a user, a notification is automatically created explaining why. All admin endpoints are protected by double middleware — first authentication, then role verification."

---

## SLIDE 17 — Notification & Reporting System (Feature Demo)

**Title:** Notifications & Content Moderation

**Notifications:**
- Triggered by: transaction updates, new messages, reviews, admin actions
- All/Unread filter with type-based icons
- Mark individual or all as read

**Reporting:**
- 5 report categories: Inappropriate Content, Spam, Harassment, Fraud, Other
- Reports include description and user/service identification
- Admin reviews with status updates and notes

[INSERT SCREENSHOT HERE – NotificationsScreen showing different notification types]
**Comment:** Upload a screenshot of NotificationsScreen showing various notification types (transaction, review, chat, system) with icons and timestamps

[INSERT SCREENSHOT HERE – ReportModerationScreen showing the report submission form]
**Comment:** Upload a screenshot of ReportModerationScreen showing reason selection and description field

> **Speaker Notes:**
> "The notification system keeps users informed about everything happening on their account — transaction updates, new messages, reviews received, and admin actions. Users can filter between all and unread notifications. For content moderation, users can report inappropriate content or behaviour with one of five predefined reasons plus a description. These reports flow to the admin dashboard where they're reviewed, investigated, and resolved or dismissed with notes."

---

## SLIDE 18 — Testing & Validation

**Title:** Testing Strategy

**System Testing:**
- End-to-end API testing across all 30+ endpoints
- State transition testing for transaction lifecycle
- Edge case validation: duplicate requests, insufficient credits, self-requests, invalid state transitions
- Database integrity checks: foreign keys, unique constraints, atomic operations

**Usability Testing:**
- Profile setup wizard tested for completion flow
- Service request-to-completion flow validated end-to-end
- Chat system tested for message delivery and persistence
- Admin workflow tested for user management actions

**Security Testing:**
- Authentication bypass attempts
- SQL injection prevention verified (parameterised queries throughout)
- Unauthorised access to admin endpoints
- Suspended account access blocking

> **Speaker Notes:**
> "Testing covered three areas. System testing validated all 30+ API endpoints, focusing on edge cases — what happens if someone tries to request their own service? What if they don't have enough credits? What if a transaction is already completed and someone tries to cancel it? The state machine rejects all invalid transitions. Usability testing followed complete user flows from registration to service completion. Security testing verified that parameterised queries block SQL injection, that non-admin users can't access admin endpoints, and that suspended accounts are blocked at the middleware level."

---

## SLIDE 19 — Critical Evaluation & Future Work

**Title:** Critical Evaluation

**✅ What was achieved:**
- All 7 core objectives implemented and functional
- Full-stack system with 30+ endpoints, 8 database tables, 17 screens
- Atomic credit transfer system with database-level integrity
- Working AI service discovery without external API dependency
- Complete admin governance tools

**⚠️ Honest limitations:**
- Frontend Socket.IO client not integrated — chat uses HTTP polling, not true real-time on the client side
- Portfolio screen is UI-only — no backend CRUD implemented
- Calendar booking is display-only — no slot reservation logic
- File/image uploads not implemented — avatars use placeholders
- No automated test suite (unit/integration tests) — testing was manual

**🔮 Future work:**
- Integrate Socket.IO client for true real-time chat experience
- Implement file upload service (AWS S3 / Cloudinary) for avatars and portfolios
- Add automated testing with Jest + Supertest for API, React Native Testing Library for UI
- Deploy to cloud (AWS/Railway for backend, Expo EAS for mobile builds)
- Expand beyond Kingston — multi-university support with domain-based verification
- Integrate with university timetable APIs for smarter scheduling

> **Speaker Notes:**
> "Let me be honest about what I achieved and what I didn't. All seven core objectives were met — the system works end-to-end with authentication, marketplace, credit exchange, chat, reviews, AI search, and admin tools. However, there are real limitations. The Socket.IO backend is fully implemented but the frontend client isn't connected — chat currently works via HTTP requests, not true WebSocket. The portfolio and calendar features are partially implemented — UI exists but backend logic is missing. There's no automated test suite; all testing was manual. For future work, beyond finishing incomplete features, I'd deploy to cloud infrastructure, implement automated CI/CD testing, and expand the platform to support multiple universities with domain-based verification."

---

## SLIDE 20 — Reflection & Closing

**Title:** Personal Reflection

**What I learned:**
- Building a state machine for transactions taught me about data integrity at the database level — I now understand why financial systems use atomic operations
- Choosing rule-based NLP over an LLM API taught me that the right solution isn't always the most complex one
- Designing the credit system forced me to think about edge cases I'd never have considered — race conditions, double-spending, rollback scenarios

**What I'd do differently:**
- Start with automated testing from Sprint 1 — manual testing became a bottleneck as the system grew
- Implement Socket.IO on the frontend earlier — retrofitting real-time features is harder than building them in from the start
- Use TypeScript from the beginning — the project grew large enough that type safety would have prevented several bugs

**Key takeaway:** The biggest challenge wasn't coding individual features — it was making them work together as a coherent system where authentication, credits, transactions, reviews, and notifications all interact reliably.

> **Speaker Notes:**
> "On a personal level, this project taught me more than any module. Building the credit transfer system forced me to understand database transactions at a fundamental level — BEGIN, COMMIT, ROLLBACK aren't just SQL keywords, they're the difference between a system that works and one that corrupts data. I learned that choosing the simpler solution — rule-based NLP instead of an expensive LLM API — was actually the better engineering decision for this context. If I started again, I'd adopt TypeScript from day one and write automated tests from the first sprint. The most valuable lesson? Individual features are straightforward. Making them work together reliably as a system — that's where real software engineering happens."

> "Thank you. I'm happy to take any questions."

---

## APPENDIX — Prompt for Slide Design Tool

Use the following prompt in **Gamma.app**, **Beautiful.ai**, **Canva AI**, or **Google Slides + Gemini** to generate the visual presentation:

---

```
Create a 20-slide professional academic presentation for a Final Year Project (FYP) viva at Kingston University.

Title: "SkillSwap: A Peer-to-Peer Skill Exchange Platform for University Students"
Author: Georges Sassine
Style: Clean, modern, minimal — dark blue (#1a1a2e) and teal (#16a085) accent colours. White backgrounds with subtle gradients. Sans-serif fonts (Inter or Montserrat).

Slide structure:
1. Title slide — project name, author, university, date
2. The Problem — 5 bullet points about why students need a skill exchange platform
3. Prior Work — comparison table of existing solutions and their limitations
4. Aims & Objectives — 1 aim + 7 numbered objectives
5. Technology Stack — table with technology, layer, and justification
6. System Architecture — architecture diagram (frontend → API → database)
7. Database Design — 8 tables with key relationships described
8. Authentication & Security — features + 2 screenshot placeholders
9. Profile Setup Wizard — 3-step flow + screenshot placeholder
10. Service Marketplace — search/filter features + 2 screenshot placeholders
11. Transaction & Credit System — credit flow diagram + screenshot placeholder
12. Real-Time Chat — Socket.IO features + 2 screenshot placeholders
13. AI Service Finder — how it works (5 steps) + screenshot placeholder
14. Reviews & Reputation — system design + screenshot placeholder
15. Skill Matching Algorithm — algorithm description + screenshot placeholder
16. Admin Dashboard — 3-tab table + 2 screenshot placeholders
17. Notifications & Reporting — features + 2 screenshot placeholders
18. Testing & Validation — 3 testing areas (system, usability, security)
19. Critical Evaluation & Future Work — achieved / limitations / future (3 sections)
20. Reflection & Closing — personal learning, what I'd do differently, thank you

Rules:
- Max 5 bullet points per slide
- Large screenshot placeholder boxes where indicated
- No paragraphs — short phrases only
- Include speaker notes for each slide
- Professional academic tone
- Kingston University branding colours where possible
```

---

## APPENDIX — Screenshots Checklist

Take these screenshots from the running application and insert them into the corresponding slides:

| Slide | Screenshot Needed | Description |
|-------|------------------|-------------|
| 8 | Registration Screen | Show the form with Kingston email field and validation |
| 8 | Login Screen | Show the Kingston-branded login form |
| 9 | Profile Setup Step 2 | Show the skill chip selector (offered/needed) |
| 10 | Browse Services | Show category chips + service cards with provider info |
| 10 | Service Detail | Show full service view with provider profile + Request button |
| 11 | Service Completion | Show the 4-item verification checklist |
| 12 | Messages List | Show conversations with unread badges + AI Finder card |
| 12 | Chat Conversation | Show sent/received message bubbles |
| 13 | AI Chat Mode | Show natural language query + formatted service results |
| 14 | Feedback Screen | Show star rating + review form + tag chips |
| 15 | Skill Matching | Show match cards with percentage scores |
| 16 | Admin Stats | Show Statistics tab with platform metric cards |
| 16 | Admin Users | Show Users tab with action buttons |
| 17 | Notifications | Show various notification types with icons |
| 17 | Report Form | Show reason selection + description field |
