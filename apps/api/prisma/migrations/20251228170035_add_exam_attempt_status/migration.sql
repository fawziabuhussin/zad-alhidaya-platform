-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "score" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExamAttempt" ("answers", "examId", "id", "score", "startedAt", "submittedAt", "userId") SELECT "answers", "examId", "id", "score", "startedAt", "submittedAt", "userId" FROM "ExamAttempt";
DROP TABLE "ExamAttempt";
ALTER TABLE "new_ExamAttempt" RENAME TO "ExamAttempt";
CREATE INDEX "ExamAttempt_examId_idx" ON "ExamAttempt"("examId");
CREATE INDEX "ExamAttempt_userId_idx" ON "ExamAttempt"("userId");
CREATE INDEX "ExamAttempt_status_idx" ON "ExamAttempt"("status");
CREATE UNIQUE INDEX "ExamAttempt_examId_userId_key" ON "ExamAttempt"("examId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
