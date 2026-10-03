import "server-only";
import { createAdminClient } from "./admin";

const BUCKET_NAME = "jetfood-operational-data";
let bucketEnsured = false;

async function ensureBucket() {
  if (bucketEnsured) return;
  try {
    const admin = createAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await admin.storage.createBucket(BUCKET_NAME, {
        public: false,
      });
    }
    bucketEnsured = true;
  } catch {
    // Ignore bucket check errors
  }
}

export async function readCloudJson<T>(fileName: string, defaultValue: T): Promise<T> {
  try {
    await ensureBucket();
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from(BUCKET_NAME).download(fileName);
    if (error || !data) {
      return defaultValue;
    }
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return defaultValue;
  }
}

export async function writeCloudJson<T>(fileName: string, value: T): Promise<boolean> {
  try {
    await ensureBucket();
    const admin = createAdminClient();
    const payload = JSON.stringify(value, null, 2);
    const { error } = await admin.storage.from(BUCKET_NAME).upload(fileName, payload, {
      contentType: "application/json",
      upsert: true,
    });
    return !error;
  } catch {
    return false;
  }
}
