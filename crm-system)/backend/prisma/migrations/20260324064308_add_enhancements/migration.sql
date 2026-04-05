-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "assignedToId" INTEGER,
ADD COLUMN     "expectedCloseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
