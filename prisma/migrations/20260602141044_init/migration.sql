-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "pronunciationUk" TEXT,
    "pronunciationUs" TEXT,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_tags" (
    "id" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meanings" (
    "id" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "translation" TEXT,
    "cefrLevel" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meanings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examples" (
    "id" TEXT NOT NULL,
    "meaningId" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "translation" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_states" (
    "vocabularyId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 1,
    "repetitionCount" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DECIMAL(65,30) NOT NULL DEFAULT 2.50,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_states_pkey" PRIMARY KEY ("vocabularyId")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "previousStage" INTEGER,
    "nextStage" INTEGER,
    "previousIntervalDays" INTEGER,
    "nextIntervalDays" INTEGER,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "userId" TEXT NOT NULL,
    "stageThresholds" JSONB NOT NULL DEFAULT '{"1":0,"2":1,"3":4,"4":15,"5":60}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "vocabularies_userId_idx" ON "vocabularies"("userId");

-- CreateIndex
CREATE INDEX "vocabularies_word_idx" ON "vocabularies"("word");

-- CreateIndex
CREATE INDEX "vocabulary_tags_vocabularyId_idx" ON "vocabulary_tags"("vocabularyId");

-- CreateIndex
CREATE INDEX "vocabulary_tags_tag_idx" ON "vocabulary_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_tags_vocabularyId_tag_key" ON "vocabulary_tags"("vocabularyId", "tag");

-- CreateIndex
CREATE INDEX "meanings_vocabularyId_idx" ON "meanings"("vocabularyId");

-- CreateIndex
CREATE INDEX "examples_meaningId_idx" ON "examples"("meaningId");

-- CreateIndex
CREATE INDEX "review_states_nextReviewAt_idx" ON "review_states"("nextReviewAt");

-- CreateIndex
CREATE INDEX "review_states_stage_idx" ON "review_states"("stage");

-- CreateIndex
CREATE INDEX "review_logs_vocabularyId_idx" ON "review_logs"("vocabularyId");

-- CreateIndex
CREATE INDEX "review_logs_reviewedAt_idx" ON "review_logs"("reviewedAt");

-- AddForeignKey
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_tags" ADD CONSTRAINT "vocabulary_tags_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meanings" ADD CONSTRAINT "meanings_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examples" ADD CONSTRAINT "examples_meaningId_fkey" FOREIGN KEY ("meaningId") REFERENCES "meanings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_states" ADD CONSTRAINT "review_states_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
