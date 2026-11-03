-- CreateEnum
CREATE TYPE "CoupleStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('MEMORY', 'ANNIVERSARY', 'DAILY_MOMENT', 'VIDEO_NOTE');

-- CreateEnum
CREATE TYPE "MilestoneCategory" AS ENUM ('FIRST_MEET', 'FIRST_DATE', 'OFFICIAL_COUPLE', 'TRIP', 'ENGAGEMENT', 'WEDDING', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "partner_id" UUID,
    "couple_id" UUID,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couples" (
    "id" UUID NOT NULL,
    "user1_id" UUID NOT NULL,
    "user2_id" UUID,
    "anniversary_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canonical_timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "pairing_code" VARCHAR(6),
    "pairing_code_expires_at" TIMESTAMPTZ(3),
    "status" "CoupleStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "couples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "couple_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT,
    "media_urls" TEXT[],
    "location" JSONB,
    "post_type" "PostType" NOT NULL DEFAULT 'MEMORY',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL,
    "couple_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "event_date" DATE NOT NULL,
    "media_url" TEXT,
    "category" "MilestoneCategory" NOT NULL DEFAULT 'CUSTOM',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_capsules" (
    "id" UUID NOT NULL,
    "couple_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "unlock_at" TIMESTAMPTZ(3) NOT NULL,
    "is_opened" BOOLEAN NOT NULL DEFAULT false,
    "opened_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_capsules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_questions" (
    "id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "active_date" DATE,

    CONSTRAINT "daily_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_answers" (
    "id" UUID NOT NULL,
    "couple_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_partner_id_key" ON "users"("partner_id");

-- CreateIndex
CREATE INDEX "users_couple_id_idx" ON "users"("couple_id");

-- CreateIndex
CREATE UNIQUE INDEX "couples_pairing_code_key" ON "couples"("pairing_code");

-- CreateIndex
CREATE INDEX "couples_pairing_code_status_idx" ON "couples"("pairing_code", "status");

-- CreateIndex
CREATE INDEX "couples_user1_id_user2_id_idx" ON "couples"("user1_id", "user2_id");

-- CreateIndex
CREATE INDEX "posts_couple_id_created_at_id_idx" ON "posts"("couple_id", "created_at" DESC, "id");

-- CreateIndex
CREATE INDEX "milestones_couple_id_event_date_idx" ON "milestones"("couple_id", "event_date" DESC);

-- CreateIndex
CREATE INDEX "time_capsules_couple_id_unlock_at_idx" ON "time_capsules"("couple_id", "unlock_at" ASC);

-- CreateIndex
CREATE INDEX "time_capsules_is_opened_unlock_at_idx" ON "time_capsules"("is_opened", "unlock_at");

-- CreateIndex
CREATE UNIQUE INDEX "daily_questions_active_date_key" ON "daily_questions"("active_date");

-- CreateIndex
CREATE INDEX "daily_answers_couple_id_question_id_idx" ON "daily_answers"("couple_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_answers_couple_id_question_id_user_id_key" ON "daily_answers"("couple_id", "question_id", "user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couples" ADD CONSTRAINT "couples_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couples" ADD CONSTRAINT "couples_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_capsules" ADD CONSTRAINT "time_capsules_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_capsules" ADD CONSTRAINT "time_capsules_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_answers" ADD CONSTRAINT "daily_answers_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_answers" ADD CONSTRAINT "daily_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_answers" ADD CONSTRAINT "daily_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "daily_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
