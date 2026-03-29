-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "brand_theme" JSONB,
ADD COLUMN     "locked_sections" JSONB NOT NULL DEFAULT '[]';
