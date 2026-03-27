-- CreateEnum
CREATE TYPE "HotelCategory" AS ENUM ('luxury', 'boutique', 'business', 'resort', 'budget');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('home', 'rooms', 'gallery', 'contact', 'about', 'dining', 'spa', 'events', 'custom');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('draft', 'published', 'rejected', 'rolled_back');

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "HotelCategory" NOT NULL,
    "contact_info" JSONB NOT NULL,
    "seo_config" JSONB NOT NULL DEFAULT '{}',
    "default_locale" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "color_tokens" JSONB NOT NULL,
    "typography" JSONB NOT NULL,
    "spacing" JSONB NOT NULL,
    "base_template" TEXT NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "page_type" "PageType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "meta_tags" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "component_variant" TEXT NOT NULL,
    "props" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "components" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "default_props" JSONB NOT NULL,
    "prop_schema" JSONB NOT NULL,
    "render_template" TEXT NOT NULL,
    "category_affinity" JSONB NOT NULL DEFAULT '[]',
    "tier_requirement" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "pricing" JSONB NOT NULL,
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "max_guests" INTEGER NOT NULL DEFAULT 2,
    "images" JSONB NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL DEFAULT '',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "variants" JSONB NOT NULL DEFAULT '{}',
    "mime_type" TEXT NOT NULL DEFAULT 'image/jpeg',
    "file_size" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_versions" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "version_num" INTEGER NOT NULL,
    "diff_patch" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "model_tier" INTEGER NOT NULL DEFAULT 0,
    "model_used" TEXT NOT NULL DEFAULT 'none',
    "description" TEXT NOT NULL DEFAULT '',
    "status" "VersionStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "themes_hotel_id_key" ON "themes"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_hotel_id_slug_locale_key" ON "pages"("hotel_id", "slug", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "components_variant_key" ON "components"("variant");

-- CreateIndex
CREATE UNIQUE INDEX "schema_versions_hotel_id_version_num_key" ON "schema_versions"("hotel_id", "version_num");

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema_versions" ADD CONSTRAINT "schema_versions_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
