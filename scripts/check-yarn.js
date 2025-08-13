#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking package manager configuration...\n');

// Check if yarn.lock exists
const yarnLockExists = fs.existsSync(path.join(process.cwd(), 'yarn.lock'));
const packageLockExists = fs.existsSync(path.join(process.cwd(), 'package-lock.json'));

if (yarnLockExists && !packageLockExists) {
  console.log('✅ Yarn is configured correctly');
  console.log('   - yarn.lock found');
  console.log('   - package-lock.json not found');
} else if (packageLockExists && !yarnLockExists) {
  console.log('❌ npm is being used instead of Yarn');
  console.log('   - package-lock.json found');
  console.log('   - yarn.lock not found');
  console.log('\nTo switch to Yarn:');
  console.log('1. Delete package-lock.json');
  console.log('2. Delete node_modules/');
  console.log('3. Run: yarn install');
} else if (yarnLockExists && packageLockExists) {
  console.log('⚠️  Both package managers detected');
  console.log('   - yarn.lock found');
  console.log('   - package-lock.json found');
  console.log('\nRecommendation: Choose one package manager and remove the other lock file');
} else {
  console.log('❓ No lock files found');
  console.log('   - Run: yarn install');
}

console.log('\n📋 Available Yarn commands:');
console.log('   yarn install          - Install dependencies');
console.log('   yarn dev              - Start development server');
console.log('   yarn build            - Build for production');
console.log('   yarn db:generate      - Generate Prisma client');
console.log('   yarn db:push          - Push schema to database');
console.log('   yarn db:migrate       - Run database migrations');
console.log('   yarn db:seed          - Seed database');
console.log('   yarn db:studio        - Open Prisma Studio');
