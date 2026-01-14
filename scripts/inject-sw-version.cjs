/**
 * Build script to inject CACHE_VERSION from config.ts into sw.js
 * 
 * This ensures the service worker version stays in sync with the config
 * without requiring manual updates.
 * 
 * Run this before building: npm run inject-sw-version
 * Or it runs automatically as part of: npm run build
 */

const fs = require('fs');
const path = require('path');

// Paths
const configPath = path.join(__dirname, '../src/lib/config.ts');
const swPath = path.join(__dirname, '../public/sw.js');

try {
  // Read config.ts
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Extract CACHE_VERSION using regex
  // Matches: export const CACHE_VERSION = "v3.0";
  const cacheVersionMatch = configContent.match(/export const CACHE_VERSION = ["']([^"']+)["']/);
  
  if (!cacheVersionMatch) {
    throw new Error('Could not find CACHE_VERSION in config.ts');
  }
  
  const cacheVersion = cacheVersionMatch[1];
  console.log(`📦 Found CACHE_VERSION: ${cacheVersion}`);
  
  // Read sw.js
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace the CACHE_VERSION line
  // Matches: const CACHE_VERSION = 'v3.0'; or const CACHE_VERSION = "v3.0";
  const versionRegex = /const CACHE_VERSION = ['"]([^'"]+)['"];?/;
  
  if (!versionRegex.test(swContent)) {
    throw new Error('Could not find CACHE_VERSION in sw.js. Make sure it exists.');
  }
  
  const oldVersion = swContent.match(versionRegex)?.[1];
  
  if (oldVersion === cacheVersion) {
    console.log('✅ Service worker version is already up to date');
    return;
  }
  
  // Replace the version
  swContent = swContent.replace(versionRegex, `const CACHE_VERSION = '${cacheVersion}';`);
  
  // Write back to sw.js
  fs.writeFileSync(swPath, swContent, 'utf8');
  
  console.log(`✅ Updated sw.js: ${oldVersion} → ${cacheVersion}`);
  console.log('✅ Service worker version synced with config.ts');
  
} catch (error) {
  console.error('❌ Error injecting version:', error.message);
  process.exit(1);
}

