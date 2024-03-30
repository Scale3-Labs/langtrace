/*
  Warnings:

  - You are about to drop the column `cloud` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "cloud",
DROP COLUMN "model";

-- DropTable
DROP TABLE "Conversation";
