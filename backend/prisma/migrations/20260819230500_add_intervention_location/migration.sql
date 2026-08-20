-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ProjectRequest" ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION;
