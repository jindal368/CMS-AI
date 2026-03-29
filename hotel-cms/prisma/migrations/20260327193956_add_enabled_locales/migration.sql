-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "enabled_locales" JSONB NOT NULL DEFAULT '["en"]';
