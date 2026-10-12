import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup() {
  const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/api/data');
  for (const name of ['e2e.sqlite', 'e2e.sqlite-wal', 'e2e.sqlite-shm']) {
    fs.rmSync(path.join(dataDir, name), { force: true });
  }
}
