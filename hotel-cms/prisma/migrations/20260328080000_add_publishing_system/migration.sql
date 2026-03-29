-- AlterTable: Organization — add customDomain and published
ALTER TABLE "organizations" ADD COLUMN "custom_domain" TEXT;
ALTER TABLE "organizations" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "organizations_custom_domain_key" ON "organizations"("custom_domain");

-- AlterTable: Hotel — add hotelSlug and publishedAt
ALTER TABLE "hotels" ADD COLUMN "hotel_slug" TEXT;
ALTER TABLE "hotels" ADD COLUMN "published_at" TIMESTAMP(3);
