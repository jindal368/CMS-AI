-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "last_snapshot" JSONB NOT NULL DEFAULT '{}',
    "last_scan_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_scans" (
    "id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '[]',
    "insights" JSONB NOT NULL DEFAULT '[]',
    "snapshot_before" JSONB NOT NULL DEFAULT '{}',
    "snapshot_after" JSONB NOT NULL DEFAULT '{}',
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_scans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_scans" ADD CONSTRAINT "competitor_scans_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
