/*
  Warnings:

  - You are about to drop the column `requisitionId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,requisitionId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requisitionId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_requisitionId_key";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "requisitionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "requisitionId",
ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "requisitions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "requisitions_userId_key" ON "requisitions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "requisitions_requisitionId_key" ON "requisitions"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_userId_requisitionId_key" ON "transactions"("userId", "requisitionId");

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisitions"("requisitionId") ON DELETE CASCADE ON UPDATE CASCADE;
