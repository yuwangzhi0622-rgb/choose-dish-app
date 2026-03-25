import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const client = createClient({
  url: databaseUrl,
  authToken,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "Dish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "spiceLevel" INTEGER NOT NULL DEFAULT 0,
    "sweetnessLevel" INTEGER NOT NULL DEFAULT 0,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "prepTime" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  // Migrate existing Dish table: add new columns if they don't exist
  `ALTER TABLE "Dish" ADD COLUMN "imageUrl" TEXT`,
  `ALTER TABLE "Dish" ADD COLUMN "spiceLevel" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Dish" ADD COLUMN "sweetnessLevel" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Dish" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'medium'`,
  `ALTER TABLE "Dish" ADD COLUMN "prepTime" INTEGER`,
  `ALTER TABLE "Dish" ADD COLUMN "description" TEXT`,
  `CREATE TABLE IF NOT EXISTS "Combo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "ComboDish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comboId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    CONSTRAINT "ComboDish_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComboDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "MealRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "mealType" TEXT NOT NULL DEFAULT 'lunch',
    "mealTime" TEXT,
    "chef" TEXT,
    "personCount" INTEGER NOT NULL DEFAULT 2,
    "comboId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealRecord_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  // Migrate existing MealRecord table: add new columns if they don't exist
  `ALTER TABLE "MealRecord" ADD COLUMN "mealType" TEXT NOT NULL DEFAULT 'lunch'`,
  `ALTER TABLE "MealRecord" ADD COLUMN "mealTime" TEXT`,
  `ALTER TABLE "MealRecord" ADD COLUMN "chef" TEXT`,
  `ALTER TABLE "MealRecord" ADD COLUMN "personCount" INTEGER NOT NULL DEFAULT 2`,
  `CREATE TABLE IF NOT EXISTS "MealDish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealRecordId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    CONSTRAINT "MealDish_mealRecordId_fkey" FOREIGN KEY ("mealRecordId") REFERENCES "MealRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ComboDish_comboId_dishId_key" ON "ComboDish"("comboId", "dishId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MealDish_mealRecordId_dishId_key" ON "MealDish"("mealRecordId", "dishId")`,
];

for (const sql of statements) {
  try {
    await client.execute(sql);
  } catch (e) {
    // Ignore "duplicate column" errors from ALTER TABLE migrations
    if (!e.message?.includes("duplicate column")) {
      console.warn(`Warning: ${e.message}`);
    }
  }
}

await client.close();
console.log(`Database initialized: ${databaseUrl}`);
