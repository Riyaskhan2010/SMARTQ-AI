#!/usr/bin/env node
/**
 * use-postgres.js
 * Switches schema.prisma to PostgreSQL for production.
 * Run: node scripts/use-postgres.js
 */
const fs = require('fs');
const path = require('path');

const src  = path.join(__dirname, '../prisma/schema.prod.prisma');
const dest = path.join(__dirname, '../prisma/schema.prisma');

fs.copyFileSync(src, dest);
console.log('✅ schema.prisma switched to PostgreSQL (production)');
console.log('   Run: npx prisma generate && npx prisma db push');
