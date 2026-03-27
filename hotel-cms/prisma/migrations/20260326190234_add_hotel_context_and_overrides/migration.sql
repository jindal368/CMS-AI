-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "custom_css" TEXT,
ADD COLUMN     "custom_html" TEXT,
ADD COLUMN     "custom_mode" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "hotel_contexts" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "brandVoice" TEXT NOT NULL DEFAULT '',
    "styleNotes" TEXT NOT NULL DEFAULT '',
    "pastDecisions" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "renderedHtml" JSONB NOT NULL DEFAULT '{}',
    "renderedCss" TEXT NOT NULL DEFAULT '',
    "last_snapshot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotel_contexts_hotel_id_key" ON "hotel_contexts"("hotel_id");

-- AddForeignKey
ALTER TABLE "hotel_contexts" ADD CONSTRAINT "hotel_contexts_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
