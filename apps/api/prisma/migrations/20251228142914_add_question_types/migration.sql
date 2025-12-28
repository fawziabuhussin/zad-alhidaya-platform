-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "choices" TEXT,
    "correctIndex" INTEGER,
    "points" REAL NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExamQuestion" ("choices", "correctIndex", "createdAt", "examId", "id", "order", "points", "prompt") SELECT "choices", "correctIndex", "createdAt", "examId", "id", "order", "points", "prompt" FROM "ExamQuestion";
DROP TABLE "ExamQuestion";
ALTER TABLE "new_ExamQuestion" RENAME TO "ExamQuestion";
CREATE INDEX "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");
CREATE INDEX "ExamQuestion_order_idx" ON "ExamQuestion"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
