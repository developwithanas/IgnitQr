/*
  Warnings:

  - You are about to drop the column `aiReviewDraft` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `categories` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `stars` on the `Feedback` table. All the data in the column will be lost.
  - Added the required column `rating` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "aiReviewDraft",
DROP COLUMN "categories",
DROP COLUMN "comment",
DROP COLUMN "stars",
ADD COLUMN     "aiContent" TEXT,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "rating" INTEGER NOT NULL;
