# Database Schema Design

## Tables

```
users
vocabularies
vocabulary_tags
meanings
examples
review_states
review_logs
user_settings
```

---

## Entity Relationship

```
Vocabulary (headword)
 ├── VocabularyTag[]       — searchable tags
 ├── Meaning[]             — one per definition/part-of-speech sense
 │    └── Example[]        — one or more sentences per meaning
 ├── ReviewState           — spaced repetition state
 └── ReviewLog[]           — review history
```

This mirrors the Cambridge Dictionary layout:
- A word has multiple meanings grouped by part of speech
- Each meaning carries its own definition, CEFR level, and example sentences

---

## User

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?  // null for Google-only accounts
  displayName  String?

  googleId     String?  @unique  // Google OAuth sub
  avatarUrl    String?           // from Google profile picture

  vocabularies Vocabulary[]
  settings     UserSettings?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

---

## Vocabulary

Holds only the headword and shared metadata. All definitions live in `Meaning`.

```prisma
model Vocabulary {
  id               String   @id @default(uuid())

  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  word             String
  pronunciationUk  String?  // IPA: /ˈres.ɪ.lənt/
  pronunciationUs  String?  // IPA: /ˈres.ɪ.lənt/
  note             String?  // personal notes

  source           String   @default("manual")

  tags             VocabularyTag[]
  meanings         Meaning[]
  reviewState      ReviewState?
  reviewLogs       ReviewLog[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
  @@index([word])
  @@map("vocabularies")
}
```

---

## Meaning

One record per distinct definition. A word can have many meanings across different parts of speech.

```prisma
model Meaning {
  id           String     @id @default(uuid())

  vocabularyId String
  vocabulary   Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  partOfSpeech String     // noun | verb | adjective | adverb | phrase | ...
  definition   String     // English definition text
  translation  String?    // user's native language translation (e.g., Vietnamese)
  cefrLevel    String?    // A1 | A2 | B1 | B2 | C1 | C2
  orderIndex   Int        @default(0) // display order on the detail page

  examples     Example[]

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([vocabularyId])
  @@map("meanings")
}
```

---

## Example

One or more example sentences per meaning.

```prisma
model Example {
  id          String   @id @default(uuid())

  meaningId   String
  meaning     Meaning  @relation(fields: [meaningId], references: [id], onDelete: Cascade)

  sentence    String   // example sentence in English
  translation String?  // optional translation
  orderIndex  Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([meaningId])
  @@map("examples")
}
```

---

## VocabularyTag

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

## ReviewState

Tracks the current spaced repetition state and learning stage for each vocabulary.
Review is at the word level — you review the whole word, not individual meanings.

```prisma
model ReviewState {
  vocabularyId    String     @id

  vocabulary      Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  stage           Int        @default(1)   // 1–5: New → Mastered (see IDEA.md)

  repetitionCount Int        @default(0)
  intervalDays    Int        @default(0)
  easeFactor      Decimal    @default(2.50)

  lastReviewedAt  DateTime?
  nextReviewAt    DateTime   @default(now())

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([nextReviewAt])
  @@index([stage])
  @@map("review_states")
}
```

---

## ReviewLog

```prisma
model ReviewLog {
  id           String     @id @default(uuid())

  vocabularyId String
  vocabulary   Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  rating       String     // forgot | hard | good | easy

  previousStage        Int?
  nextStage            Int?
  previousIntervalDays Int?
  nextIntervalDays     Int?

  reviewedAt   DateTime   @default(now())

  @@index([vocabularyId])
  @@index([reviewedAt])
  @@map("review_logs")
}
```

---

## UserSettings

```prisma
model UserSettings {
  userId String @id

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Maps stage number to minimum intervalDays for that stage label
  // Default: { "1": 0, "2": 1, "3": 4, "4": 15, "5": 60 }
  stageThresholds Json @default("{\"1\":0,\"2\":1,\"3\":4,\"4\":15,\"5\":60}")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_settings")
}
```

---

## Word Detail Page — Data Shape

When the frontend opens a word detail page, the API returns:

```json
{
  "id": "uuid",
  "word": "resilient",
  "pronunciationUk": "/rɪˈzɪl.i.ənt/",
  "pronunciationUs": "/rɪˈzɪl.i.ənt/",
  "note": "Useful for interview answers.",
  "source": "manual",
  "tags": ["interview", "personality"],
  "meanings": [
    {
      "id": "uuid",
      "partOfSpeech": "adjective",
      "definition": "able to be happy, successful, etc. again after something difficult or bad has happened",
      "translation": "kiên cường, có khả năng phục hồi",
      "cefrLevel": "B2",
      "orderIndex": 0,
      "examples": [
        {
          "id": "uuid",
          "sentence": "She is a resilient person who bounced back quickly after losing her job.",
          "translation": "Cô ấy là người kiên cường và nhanh chóng phục hồi sau khi mất việc.",
          "orderIndex": 0
        }
      ]
    }
  ],
  "reviewState": {
    "stage": 2,
    "intervalDays": 3,
    "repetitionCount": 1,
    "nextReviewAt": "2026-06-05T00:00:00.000Z"
  }
}
```

---

## Changes vs Previous Version

| What changed | Why |
|---|---|
| Removed `meaning`, `partOfSpeech`, `exampleSentence` from `Vocabulary` | Moved to child models |
| Removed `difficulty` from `Vocabulary` | Covered by `stage` in `ReviewState` |
| New `Meaning` model | One row per definition, supports multiple per word |
| New `Example` model | One or more sentences per meaning |
| `pronunciationUk` + `pronunciationUs` split | Cambridge shows both accents separately |
| `Vocabulary.meanings Meaning[]` relation | Head word → definitions |
| `Meaning.examples Example[]` relation | Definition → sentences |
