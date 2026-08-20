-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "clientRating" INTEGER,
ADD COLUMN     "clientRatingComment" TEXT,
ADD COLUMN     "ratedAt" TIMESTAMP(3);
