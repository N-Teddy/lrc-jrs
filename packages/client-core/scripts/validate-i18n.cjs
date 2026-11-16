const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const bundles = [
  ['fr.json', 'en.json', 'Main i18n bundle'],
  ['notifications.fr.json', 'notifications.en.json', 'Notifications bundle'],
  ['errors.fr.json', 'errors.en.json', 'Errors bundle'],
  ['success.fr.json', 'success.en.json', 'Success bundle']
];

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

let hasErrors = false;

for (const [frFile, enFile, label] of bundles) {
  const fr = JSON.parse(fs.readFileSync(path.join(localesDir, frFile), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, enFile), 'utf8'));

  const frKeys = new Set(getKeys(fr));
  const enKeys = new Set(getKeys(en));

  const missingInEn = [...frKeys].filter(k => !enKeys.has(k)).sort();
  const missingInFr = [...enKeys].filter(k => !frKeys.has(k)).sort();

  if (missingInEn.length > 0 || missingInFr.length > 0) {
    hasErrors = true;
    console.error(`\x1b[31m[i18n COMPILE ERROR]\x1b[0m Translation key mismatch in ${label}:`);
    if (missingInEn.length > 0) {
      console.error(`  Missing in English (${enFile}):`, missingInEn);
    }
    if (missingInFr.length > 0) {
      console.error(`  Missing in French (${frFile}):`, missingInFr);
    }
  }
}

if (hasErrors) {
  console.error('\x1b[31m[i18n FAILURE] One or more translations are missing. Both French and English must have exact 100% key parity.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m[i18n OK] 100% translation key parity verified across French and English bundles.\x1b[0m');
}
