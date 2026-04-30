import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function domainFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return domainFiles(path);
    }

    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('forms domain boundary', () => {
  it('does not import API/shared contract types', () => {
    const files = domainFiles(__dirname);

    for (const file of files) {
      expect(readFileSync(file, 'utf8')).not.toContain('@topcv/shared');
    }
  });
});
