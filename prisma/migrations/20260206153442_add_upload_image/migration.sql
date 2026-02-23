-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "url" TEXT NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "thumbnail_url" TEXT,
    "folder" VARCHAR(100) NOT NULL DEFAULT 'general',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "alt" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "images_folder_idx" ON "images"("folder");

-- CreateIndex
CREATE INDEX "images_is_active_is_deleted_idx" ON "images"("is_active", "is_deleted");

-- CreateIndex
CREATE INDEX "images_sort_order_idx" ON "images"("sort_order");

-- CreateIndex
CREATE INDEX "images_created_at_idx" ON "images"("created_at");
