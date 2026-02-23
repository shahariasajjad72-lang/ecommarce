-- CreateTable
CREATE TABLE "attribute_values" (
    "id" TEXT NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "attribute_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_sets" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),

    CONSTRAINT "attribute_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "attribute_set_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attribute_values_attribute_id_idx" ON "attribute_values"("attribute_id");

-- CreateIndex
CREATE INDEX "attribute_values_is_active_is_deleted_idx" ON "attribute_values"("is_active", "is_deleted");

-- CreateIndex
CREATE INDEX "attribute_values_sort_order_idx" ON "attribute_values"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_sets_slug_key" ON "attribute_sets"("slug");

-- CreateIndex
CREATE INDEX "attribute_sets_slug_idx" ON "attribute_sets"("slug");

-- CreateIndex
CREATE INDEX "attribute_sets_is_active_is_deleted_idx" ON "attribute_sets"("is_active", "is_deleted");

-- CreateIndex
CREATE INDEX "attribute_sets_sort_order_idx" ON "attribute_sets"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_slug_key" ON "attributes"("slug");

-- CreateIndex
CREATE INDEX "attributes_attribute_set_id_idx" ON "attributes"("attribute_set_id");

-- CreateIndex
CREATE INDEX "attributes_slug_idx" ON "attributes"("slug");

-- CreateIndex
CREATE INDEX "attributes_is_active_is_deleted_idx" ON "attributes"("is_active", "is_deleted");

-- CreateIndex
CREATE INDEX "attributes_sort_order_idx" ON "attributes"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_attribute_set_id_slug_key" ON "attributes"("attribute_set_id", "slug");

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_attribute_set_id_fkey" FOREIGN KEY ("attribute_set_id") REFERENCES "attribute_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
