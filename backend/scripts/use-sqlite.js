#!/usr/bin/env node
/**
 * use-sqlite.js
 * Switches schema.prisma to SQLite for local development.
 * Run: node scripts/use-sqlite.js
 */
const fs = require('fs');
const path = require('path');

const src  = path.join(__dirname, '../prisma/schema.sqlite.prisma');
const dest = path.join(__dirname, '../prisma/schema.prisma');

fs.copyFileSync(src, dest);
console.log('✅ schema.prisma switched to SQLite (local dev)');
console.log('   Run: npx prisma generate && node prisma/seed.js');
