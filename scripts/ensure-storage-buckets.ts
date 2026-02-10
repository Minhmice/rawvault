/**
 * Ensures RawVault storage buckets exist (rawvault-original, rawvault-derivatives).
 * Run once after migrations: npx tsx scripts/ensure-storage-buckets.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Buckets are private. Access: only owner via RLS/signed URLs; job processor uses service role.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const BUCKETS = [
  { name: "rawvault-original", public: false },
  { name: "rawvault-derivatives", public: false },
] as const;

async function main() {
  const { data: existing } = await supabase.storage.listBuckets();
  const names = new Set((existing ?? []).map((b) => b.name));

  for (const { name, public: isPublic } of BUCKETS) {
    if (names.has(name)) {
      console.log(`Bucket ${name} already exists`);
      continue;
    }
    const { data, error } = await supabase.storage.createBucket(name, {
      public: isPublic,
      fileSizeLimit: 52428800, // 50MB for original
    });
    if (error) {
      console.error(`Failed to create bucket ${name}:`, error.message);
      process.exit(1);
    }
    console.log(`Created bucket: ${name}`);
  }
}

main();
