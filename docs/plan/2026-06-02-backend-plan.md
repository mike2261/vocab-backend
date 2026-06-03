# Backend Plan — Spaced Repetition Vocabulary App

## 1. Project Goal

Build the backend for a vocabulary learning app using spaced repetition.

Core flow:

```txt
User adds vocabulary
        ↓
Backend stores vocabulary and review state
        ↓
User opens review queue
        ↓
Backend returns words due for review
        ↓
User rates each word
        ↓
Backend calculates next review date
```

The main goal of this project is not only to build the app, but also to gain practical experience with:

```txt
Node.js backend development
REST API design
PostgreSQL schema design
Prisma migrations
Authentication
Docker and Docker Compose
Server deployment
CI/CD
Logging and error handling
Background jobs later
```

---

## 2. Tech Stack

### Core Backend

```txt
Runtime: Node.js
Language: TypeScript
Framework: Fastify or Express
Database: PostgreSQL
ORM: Prisma
Validation: Zod
Auth: JWT + httpOnly refresh token cookie
Password hashing: bcrypt or argon2
Logging: Pino
Testing: Vitest or Jest
Container: Docker
Local orchestration: Docker Compose
CI/CD: GitHub Actions
Deployment target: Ubuntu server
```

### Recommendation

Use **Fastify** if you want a more modern Node.js backend with good performance and built-in schema support.

Use **Express** if you want the most common and beginner-friendly backend framework.

For this project, recommended choice:

```txt
Node.js + Fastify + TypeScript + Prisma + PostgreSQL
```

Reason:

```txt
Fastify is lightweight
Good TypeScript support
Good performance
Still close to raw Node.js concepts
Less magic than NestJS
Good for learning backend architecture manually
```

---

## 3. Folder Structure

```txt
vocab-backend/
  src/
    app.ts
    server.ts

    config/
      env.ts

    db/
      prisma.ts

    modules/
      auth/
        auth.routes.ts
        auth.controller.ts
        auth.service.ts
        auth.schema.ts

      users/
        users.routes.ts
        users.controller.ts
        users.service.ts
        users.schema.ts

      vocabularies/
        vocabularies.routes.ts
        vocabularies.controller.ts
        vocabularies.service.ts
        vocabularies.schema.ts

      reviews/
        reviews.routes.ts
        reviews.controller.ts
        reviews.service.ts
        reviews.schema.ts
        repetition.ts

    middlewares/
      auth.middleware.ts
      error.middleware.ts

    utils/
      date.ts
      password.ts
      token.ts

  prisma/
    schema.prisma
    migrations/

  tests/
    unit/
    integration/

  Dockerfile
  docker-compose.yml
  .env.example
  package.json
  tsconfig.json
  README.md
```

The goal is to keep a clear separation:

```txt
routes       -> define endpoints
controller   -> handle request and response
service      -> business logic
schema       -> request validation
db/prisma    -> database client
utils        -> reusable helpers
```

---

## 4. Core Features

## Phase 1 — Vocabulary CRUD

### Features

```txt
Create vocabulary
Get vocabulary list
Get vocabulary detail
Update vocabulary
Delete vocabulary
Search vocabulary
Filter by tag/difficulty/source
Pagination
```

### Vocabulary fields

```txt
word
meaning
pronunciation
part_of_speech
example_sentence
note
source
difficulty
tags
```

Example request:

```json
{
  "word": "resilient",
  "meaning": "kiên cường",
  "pronunciation": "/rɪˈzɪliənt/",
  "partOfSpeech": "adjective",
  "exampleSentence": "She is resilient after many failures.",
  "note": "Useful for interview answers.",
  "source": "manual",
  "difficulty": "new",
  "tags": ["interview", "personality"]
}
```

---

## Phase 2 — Spaced Repetition Review

### Features

```txt
Get due words
Review a word
Save review history
Calculate next review date
Track repetition count
Track interval days
Track ease factor
```

### Review ratings

```txt
forgot
hard
good
easy
```

### Simple repetition algorithm

Initial version:

```txt
Forgot -> review again in 1 day
Hard   -> review again in 2 days or interval * 1.2
Good   -> interval * ease factor
Easy   -> interval * ease factor * 1.3
```

Later, the algorithm can be replaced with:

```txt
SM-2
FSRS
Custom adaptive algorithm
```

---

## Phase 3 — Auth

### Features

```txt
Register
Login
Logout
Refresh token
Get current user
Protect vocabulary/review APIs
```

### Auth strategy

```txt
Access token: short-lived JWT
Refresh token: httpOnly cookie
Password hash: bcrypt or argon2
```

Access token can be sent in:

```txt
Authorization: Bearer <token>
```

Refresh token should be stored in an httpOnly cookie.

---

## Phase 4 — Backend Quality

Add production-style backend practices:

```txt
Input validation with Zod
Global error handler
Request logging
Response format standardization
Pagination helper
Database transaction examples
Rate limiting
CORS config
Health check endpoint
```

Health check:

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-02T00:00:00.000Z"
}
```

---

## Phase 5 — Background Jobs Later

For AI features or daily reminders, add:

```txt
Redis
BullMQ
Worker process
Job retry
Job status tracking
```

Potential jobs:

```txt
Generate example sentences
Generate story from selected words
Generate quiz
Send daily review reminder
Recalculate review schedule
```

Do not add BullMQ in the MVP. Add it after the core review flow works.

---

## 5. Database Design

Use PostgreSQL with Prisma.

### Main tables

```txt
users
vocabularies
vocabulary_tags
review_states
review_logs
```

---

## 5.1 User

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  displayName  String?

  vocabularies Vocabulary[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

---

## 5.2 Vocabulary

```prisma
model Vocabulary {
  id              String   @id @default(uuid())

  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  word            String
  meaning         String
  pronunciation   String?
  partOfSpeech    String?
  exampleSentence String?
  note            String?

  source          String   @default("manual")
  difficulty      String   @default("new")

  tags            VocabularyTag[]
  reviewState     ReviewState?
  reviewLogs      ReviewLog[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([word])
  @@map("vocabularies")
}
```

---

## 5.3 VocabularyTag

```prisma
model VocabularyTag {
  id           String     @id @default(uuid())

  vocabularyId String
  vocabulary   Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  tag          String

  createdAt    DateTime   @default(now())

  @@index([vocabularyId])
  @@index([tag])
  @@unique([vocabularyId, tag])
  @@map("vocabulary_tags")
}
```

---

## 5.4 ReviewState

```prisma
model ReviewState {
  vocabularyId    String     @id
  vocabulary      Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  repetitionCount Int        @default(0)
  intervalDays    Int        @default(0)
  easeFactor      Decimal    @default(2.50)

  lastReviewedAt  DateTime?
  nextReviewAt    DateTime   @default(now())

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([nextReviewAt])
  @@map("review_states")
}
```

---

## 5.5 ReviewLog

```prisma
model ReviewLog {
  id                   String     @id @default(uuid())

  vocabularyId          String
  vocabulary            Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  rating                String

  previousIntervalDays  Int?
  nextIntervalDays      Int?

  reviewedAt            DateTime   @default(now())

  @@index([vocabularyId])
  @@index([reviewedAt])
  @@map("review_logs")
}
```

---

## 6. API Design

Base URL:

```txt
/api
```

---

## 6.1 Auth APIs

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Register

```http
POST /api/auth/register
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "Mike"
}
```

---

## 6.2 Vocabulary APIs

```http
POST   /api/vocabularies
GET    /api/vocabularies
GET    /api/vocabularies/due
GET    /api/vocabularies/:id
PATCH  /api/vocabularies/:id
DELETE /api/vocabularies/:id
```

### Create vocabulary

```http
POST /api/vocabularies
```

Body:

```json
{
  "word": "resilient",
  "meaning": "kiên cường",
  "exampleSentence": "She is resilient after many failures.",
  "partOfSpeech": "adjective",
  "tags": ["interview", "personality"]
}
```

### Get vocabularies

```http
GET /api/vocabularies?page=1&pageSize=20&search=resilient&tag=interview
```

### Get due vocabularies

```http
GET /api/vocabularies/due
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "word": "resilient",
      "meaning": "kiên cường",
      "exampleSentence": "She is resilient after many failures.",
      "reviewState": {
        "intervalDays": 3,
        "repetitionCount": 2,
        "nextReviewAt": "2026-06-02T00:00:00.000Z"
      }
    }
  ]
}
```

---

## 6.3 Review APIs

```http
POST /api/reviews/:vocabularyId
GET  /api/reviews/history
```

### Review a word

```http
POST /api/reviews/:vocabularyId
```

Body:

```json
{
  "rating": "good"
}
```

Backend should:

```txt
Find vocabulary
Check ownership
Find review state
Calculate next review date
Update review state
Insert review log
Return updated review state
```

This operation should use a database transaction.

---

## 7. Repetition Algorithm

File:

```txt
src/modules/reviews/repetition.ts
```

Example:

```ts
export type ReviewRating = "forgot" | "hard" | "good" | "easy";

type ReviewStateInput = {
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
};

export function calculateNextReview(
  state: ReviewStateInput,
  rating: ReviewRating
) {
  let nextIntervalDays = state.intervalDays;
  let nextEaseFactor = state.easeFactor;
  let nextRepetitionCount = state.repetitionCount;

  if (rating === "forgot") {
    nextIntervalDays = 1;
    nextEaseFactor = Math.max(1.3, state.easeFactor - 0.2);
    nextRepetitionCount = 0;
  }

  if (rating === "hard") {
    nextIntervalDays = Math.max(2, Math.ceil(state.intervalDays * 1.2));
    nextEaseFactor = Math.max(1.3, state.easeFactor - 0.1);
    nextRepetitionCount += 1;
  }

  if (rating === "good") {
    nextIntervalDays =
      state.intervalDays === 0
        ? 1
        : Math.ceil(state.intervalDays * state.easeFactor);

    nextRepetitionCount += 1;
  }

  if (rating === "easy") {
    nextIntervalDays =
      state.intervalDays === 0
        ? 3
        : Math.ceil(state.intervalDays * state.easeFactor * 1.3);

    nextEaseFactor = state.easeFactor + 0.15;
    nextRepetitionCount += 1;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + nextIntervalDays);

  return {
    repetitionCount: nextRepetitionCount,
    intervalDays: nextIntervalDays,
    easeFactor: nextEaseFactor,
    nextReviewAt,
  };
}
```

---

## 8. Docker Plan

## 8.1 Docker Compose for local development

```yaml
services:
  api:
    build: .
    container_name: vocab_api
    restart: unless-stopped
    ports:
      - "4000:4000"
    env_file:
      - .env
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    container_name: vocab_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: vocab_app
      POSTGRES_USER: vocab_user
      POSTGRES_PASSWORD: vocab_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 8.2 Dockerfile

```dockerfile
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable && pnpm prisma generate
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["node", "dist/server.js"]
```

---

## 9. CI/CD Plan

Use GitHub Actions.

Recommended deployment model:

```txt
GitHub Actions self-hosted runner installed on Ubuntu server
```

Why:

```txt
Server may be behind NAT/CGNAT
No need to SSH from GitHub into server
Runner connects outward to GitHub
Deployment runs directly on server
```

Workflow:

```txt
Push main
  ↓
GitHub Actions job starts
  ↓
Checkout code
  ↓
Install dependencies
  ↓
Run lint
  ↓
Run tests
  ↓
Run Prisma migrations
  ↓
Docker Compose rebuild and restart
```

Example workflow:

```yaml
name: Deploy Backend

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: self-hosted

    steps:
      - uses: actions/checkout@v4

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run typecheck
        run: pnpm typecheck

      - name: Run tests
        run: pnpm test

      - name: Run database migrations
        run: pnpm prisma migrate deploy

      - name: Deploy containers
        run: docker compose up -d --build

      - name: Show containers
        run: docker ps
```

---

## 10. Environment Variables

`.env.example`

```env
NODE_ENV=development
PORT=4000

DATABASE_URL="postgresql://vocab_user:vocab_password@postgres:5432/vocab_app?schema=public"

JWT_ACCESS_SECRET="change-me-access"
JWT_REFRESH_SECRET="change-me-refresh"

ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

CORS_ORIGIN="http://localhost:3000"
```

Never commit real `.env`.

---

## 11. Backend Learning Checklist

While building this project, focus on these backend skills:

```txt
HTTP method design
REST API conventions
Request validation
Error handling
Service layer design
Database schema design
Database migration
Foreign keys and indexes
Transactions
Pagination
Search/filter queries
Authentication
Authorization
Cookie security
Docker Compose networking
Environment variables
CI/CD pipeline
Production deployment
Logging
Testing
```

---

## 12. Suggested Milestones

## Milestone 1 — Project Setup

```txt
Initialize Node.js + TypeScript project
Setup Fastify
Add health check API
Setup env validation
Setup Prisma + PostgreSQL
Run first migration
Docker Compose up successfully
```

Done when:

```txt
GET /health returns ok
PostgreSQL runs in Docker
Prisma can connect to database
```

---

## Milestone 2 — Vocabulary CRUD

```txt
Create vocabulary table
Create vocabulary API
List vocabulary API
Update vocabulary API
Delete vocabulary API
Add tags
Add pagination
Add search
```

Done when:

```txt
You can add and list words from API client
```

---

## Milestone 3 — Review System

```txt
Create review state on vocabulary creation
Get due words
Review word with rating
Calculate next review date
Insert review log
Use transaction for review update
```

Done when:

```txt
A word disappears from due queue after review
The next review date changes correctly
Review log is saved
```

---

## Milestone 4 — Auth

```txt
Register
Login
Refresh token
Logout
Protect routes
Associate vocabularies with users
```

Done when:

```txt
Each user only sees their own vocabularies
```

---

## Milestone 5 — Tests

```txt
Unit test repetition algorithm
Unit test services
Integration test vocabulary API
Integration test review API
```

Done when:

```txt
CI can run tests before deploy
```

---

## Milestone 6 — Server Deployment

```txt
Install Docker on Ubuntu server
Clone repo
Create production .env
Run docker compose up -d
Check logs
Expose API through Cloudflare Tunnel later
```

Done when:

```txt
API is running on Ubuntu server
```

---

## Milestone 7 — CI/CD

```txt
Install GitHub Actions self-hosted runner
Create deploy workflow
Run migrations in pipeline
Rebuild containers on push to main
```

Done when:

```txt
Push to main automatically deploys backend
```

---

## 13. Later Extensions

After backend MVP is stable, add:

```txt
Redis cache
BullMQ worker
AI story generation
AI quiz generation
Daily review reminder
User stats
Review streak
Import vocabulary from CSV
Export vocabulary
Admin dashboard
OpenAPI/Swagger docs
```

---

## 14. Recommended Build Order

Do not build everything at once.

Recommended order:

```txt
1. Health check
2. PostgreSQL + Prisma
3. Vocabulary CRUD
4. Review state
5. Due review API
6. Review action API
7. Auth
8. Tests
9. Docker production setup
10. CI/CD
11. Cloudflare Tunnel
12. AI/background jobs
```

This order keeps the project focused and prevents infrastructure from blocking the core product.
