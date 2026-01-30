/*
  Warnings:

  - A unique constraint covering the columns `[userId,courseId,type,itemId]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_provider_providerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Grade_userId_courseId_type_itemId_key" ON "Grade"("userId", "courseId", "type", "itemId");
