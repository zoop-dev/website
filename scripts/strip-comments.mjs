// git clean filter: strips comments from source as it's staged, so the copy
// stored/pushed to GitHub has none while the working tree stays commented.
// Reads file content on stdin, writes the stripped content to stdout.
import fs from 'node:fs';
import { stripContent } from './strip-lib.mjs';

const input = fs.readFileSync(0, 'utf8');
process.stdout.write(stripContent(process.argv[2] || '', input));
