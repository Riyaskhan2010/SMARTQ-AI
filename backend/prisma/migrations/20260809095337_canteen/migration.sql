-- CreateTable
CREATE TABLE "canteen_orgs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL DEFAULT '07:00',
    "closeTime" TEXT NOT NULL DEFAULT '21:00',
    "lastOrderNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "canteen_counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canteenOrgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "canteen_counters_canteenOrgId_fkey" FOREIGN KEY ("canteenOrgId") REFERENCES "canteen_orgs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canteenCounterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "mealPeriod" TEXT NOT NULL DEFAULT 'ALL',
    "avgPrepTime" INTEGER NOT NULL DEFAULT 5,
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "menu_items_canteenCounterId_fkey" FOREIGN KEY ("canteenCounterId") REFERENCES "canteen_counters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "canteen_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canteenOrgId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "estimatedReadyTime" INTEGER,
    "actualReadyTime" INTEGER,
    "placedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "prepStartAt" DATETIME,
    "readyAt" DATETIME,
    "collectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "canteen_orders_canteenOrgId_fkey" FOREIGN KEY ("canteenOrgId") REFERENCES "canteen_orgs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "canteen_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "canteenCounterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "canteen_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "canteen_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "canteen_order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "canteen_order_items_canteenCounterId_fkey" FOREIGN KEY ("canteenCounterId") REFERENCES "canteen_counters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "canteen_orgs_organizationId_key" ON "canteen_orgs"("organizationId");
