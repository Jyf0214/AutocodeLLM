import 'next-ws/server';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const standalonePath = path.join(__dirname, '.next/standalone/server.js');

await import(standalonePath);
