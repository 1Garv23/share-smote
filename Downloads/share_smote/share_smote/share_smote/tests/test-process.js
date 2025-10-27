import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const PROCESS_URL = `${BASE_URL}/api/auth/process`;
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZThiOGZhMGM5ZDE3MjBiYzE0MWIyMyIsImlhdCI6MTc2MDQzNDMyOCwiZXhwIjoxNzYxMDM5MTI4\nfQ.H8MT66c8NCa-6Ip0_bHxvlVNzXE6LeRA096moGEl50o`'.replace('`','').replace('\n','');

const zipFiles = [
  './valid-input.zip',
  './invalid-input.zip',
];


// - k_neighbour: required integer, must be > 1
// - target_ratio: optional; if provided, must be between 0.0 and 1.0; frontend sends 'null' string when empty
// - random_state: required integer (any integer)
//
// We'll generate a matrix of combinations including edge cases.

const kNeighbourValues = [
  5,          // valid default
  2,          // valid boundary
  1,          // invalid (<2)
  0,          // invalid
  -3,         // invalid
  100,        // valid
  'abc',      // invalid non-integer
];

const targetRatioValues = [
  '',         // frontend would send 'null'
  '0.0',      // valid boundary
  '1.0',      // valid boundary
  '0.25',     // valid
  '1.01',     // invalid (>1.0)
  '-0.1',     // invalid (<0.0)
  'abc',      // invalid non-numeric
  'null',     // explicit 'null' string
];

const randomStateValues = [
  42,         // valid default
  0,          // valid integer
  -1,         // valid integer (if backend allows any int)
  999999,     // valid large int
  'abc',      // invalid non-integer
];

function toReadableName(v) {
  if (v === '') return '(empty)';
  return String(v);
}

function getFilenameFromDisposition(disposition) {
  if (!disposition) return null;
  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
    }
  }
  const plainMatch = /filename\s*=\s*\"?([^\";]+)\"?/i.exec(disposition);
  if (plainMatch) {
    return plainMatch[1];
  }
  return null;
}

async function sendOne(filePath, k_neighbour, target_ratio, random_state) {
  const label = `[file=${path.basename(filePath)} k=${toReadableName(k_neighbour)} tr=${toReadableName(target_ratio)} rs=${toReadableName(random_state)}]`;
  console.log(`\n=== Sending ${label} ===`);

  let fileBuffer;
  try {
    fileBuffer = await fs.promises.readFile(filePath);
  } catch (e) {
    console.error(`File read failed for ${filePath}: ${e.message}`);
    return { ok: false, status: 0, error: `file read error: ${e.message}` };
  }

  // Construct FormData 
  // - zipFile: .zip file
  // - k_neighbour: as set
  // - target_ratio: targetRatio || 'null' (frontend sends 'null' string when empty)
  // - random_state
  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: 'application/zip' });
  // Use the actual filename so server-side parsers resemble the browser upload
  form.append('zipFile', blob, path.basename(filePath));
  form.append('k_neighbour', k_neighbour);
  form.append('target_ratio', target_ratio === '' ? 'null' : target_ratio);
  form.append('random_state', random_state);

  const res = await fetch(PROCESS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: form,
  });

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (contentType.includes('application/json')) {
      try {
        const json = await res.json();
        if (json && json.message) message = json.message;
      } catch {
      }
    } else {
      try {
        const text = await res.text();
        if (text) message = `${message}: ${text}`;
      } catch {
      }
    }
    console.error(`Error for ${label}: ${message}`);
    return { ok: false, status: res.status, error: message };
  }

  const disposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
  let filename = getFilenameFromDisposition(disposition) || `result-${Date.now()}.zip`;

  const arrayBuf = await res.arrayBuffer();
  const outPath = path.join(__dirname, filename);
  await fs.promises.writeFile(outPath, Buffer.from(arrayBuf));
  console.log(`Success for ${label}: saved -> ${filename}`);
  return { ok: true, status: res.status, file: filename };
}

async function main() {
  const results = [];

  for (const z of zipFiles) {
    for (const k of kNeighbourValues) {
      for (const tr of targetRatioValues) {
        for (const rs of randomStateValues) {
          const r = await sendOne(z, k, tr, rs);
          results.push({ zip: path.basename(z), k, tr, rs, ...r });
        }
      }
    }
  }

  // Write a CSV summary for quick filtering
  const lines = [
    'zip,k_neighbour,target_ratio,random_state,ok,status,file,error',
    ...results.map(r =>
      [
        r.zip,
        JSON.stringify(r.k),
        JSON.stringify(r.tr),
        JSON.stringify(r.rs),
        r.ok ? 1 : 0,
        r.status ?? '',
        r.file ?? '',
        r.error ? JSON.stringify(r.error).replace(/\n/g, ' ') : '',
      ].join(',')
    ),
  ];
  const summaryPath = path.join(__dirname, `process-test-summary-${Date.now()}.csv`);
  await fs.promises.writeFile(summaryPath, lines.join('\n'));
  console.log(`\nWrote summary CSV: ${summaryPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
