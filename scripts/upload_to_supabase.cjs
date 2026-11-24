// scripts/upload_to_supabase.cjs
// Run:  node scripts/upload_to_supabase.cjs
// Requires: supabase/storage_setup.sql to have been run first in Supabase Dashboard

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

// ── Read .env ─────────────────────────────────────────────────────────────────
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const getEnv = (key) => {
  const m = envContent.match(new RegExp(`${key}=["']?([^"'\\r\\n]+)`));
  return m ? m[1].trim() : '';
};

const SUPABASE_URL      = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const FILES = [
  // [ localPath,                    storageName,              category,   mime ]
  ['logo.png',                   'logo.png',               'logo',    'image/png'  ],
  ['logo.jpg',                   'logo.jpg',               'logo',    'image/jpeg' ],
  ['work.jfif',                  'work.jfif',              'logo',    'image/jpeg' ],
  ['favicon.png',                'favicon.png',            'favicon', 'image/png'  ],
  ['favicon-logo.jpg',           'favicon-logo.jpg',       'favicon', 'image/jpeg' ],
];

async function uploadAll() {
  console.log('🔗  Connecting to Supabase:', SUPABASE_URL, '\n');

  // Check bucket exists
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error('❌  Could not list buckets:', bErr.message);
    console.log('\n👉  Have you run  supabase/storage_setup.sql  in the Supabase Dashboard?');
    process.exit(1);
  }

  const hasBucket = Array.isArray(buckets) && buckets.some(b => b.id === 'pictures');
  if (!hasBucket) {
    console.error("❌  Bucket 'pictures' not found.");
    console.log('\n👉  Run  supabase/storage_setup.sql  in Supabase Dashboard → SQL Editor, then retry.');
    process.exit(1);
  }

  console.log("✅  Bucket 'pictures' found. Starting uploads…\n");

  const results = [];

  for (const [filename, remoteName, category, mime] of FILES) {
    const localPath = path.join(PUBLIC_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.warn(`⚠   File not found, skipping: ${filename}`);
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const { data, error } = await supabase.storage
      .from('pictures')
      .upload(remoteName, buffer, { contentType: mime, upsert: true });

    if (error) {
      console.error(`❌  Upload failed for ${remoteName}:`, error.message);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pictures')
      .getPublicUrl(remoteName);

    console.log(`✅  ${remoteName}`);
    console.log(`    ${publicUrl}\n`);
    results.push({ remoteName, publicUrl, category });

    // Try to register in public.pictures table (may fail if table not created yet, that's fine)
    try {
      await supabase.from('pictures').upsert({
        id:         path.parse(remoteName).name.replace('@', '_'),
        name:       remoteName,
        category,
        url:        publicUrl,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}
  }

  if (results.length === 0) {
    console.error('❌  No files were uploaded successfully.');
    process.exit(1);
  }

  // Print env variable snippet
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('All uploads done! Public URLs:');
  for (const r of results) {
    console.log(`  ${r.category.padEnd(8)} | ${r.remoteName.padEnd(26)} | ${r.publicUrl}`);
  }

  // Find logo URL for reference
  const logoResult = results.find(r => r.remoteName === 'logo.png');
  if (logoResult) {
    console.log('\n📌  Example – use in your app as:');
    console.log(`  <img src="${logoResult.publicUrl}" alt="logo" />`);
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
}

uploadAll();
