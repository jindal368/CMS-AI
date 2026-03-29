-- CreateTable
CREATE TABLE "seo_audits" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "issues" JSONB NOT NULL DEFAULT '[]',
    "last_audit_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seo_audits_hotel_id_key" ON "seo_audits"("hotel_id");

-- AddForeignKey
ALTER TABLE "seo_audits" ADD CONSTRAINT "seo_audits_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
