import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function writeBugReport(testName: string, endpoint: string, details: any) {
  const assetsDir = path.resolve(__dirname, '../../assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bug-report-${timestamp}.md`;
  const filepath = path.join(assetsDir, filename);
  
  const report = `# Bug Report - ${testName}

**Date:** ${new Date().toISOString()}
**Endpoint:** ${endpoint}
**Status:** Server-side bug (test expects correct behavior)

## Details
\`\`\`json
${JSON.stringify(details, null, 2)}
\`\`\`

## Next Steps
- Fix the server-side issue
- Re-run the test to verify
`;
  
  fs.writeFileSync(filepath, report);
  console.log(`Bug report written to: ${filepath}`);
  return filepath;
}
