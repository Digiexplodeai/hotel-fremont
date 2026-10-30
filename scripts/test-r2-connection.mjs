import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// Simple .env.local parser
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "hotel-fremont-media";
const publicUrl = process.env.PUBLIC_R2_PUBLIC_URL || "https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev";

console.log("Testing R2 connection...");
console.log("Account ID:", accountId);
console.log("Bucket:", bucketName);
console.log("Public URL:", publicUrl);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function run() {
  try {
    console.log("\n1. Testing HeadBucket...");
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log("✓ Bucket exists and credentials are valid!");

    console.log("\n2. Testing ListObjectsV2...");
    const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 10 }));
    console.log("✓ ListObjects successful! Total objects found:", listRes.KeyCount || 0);
    if (listRes.Contents && listRes.Contents.length > 0) {
      console.log("Sample objects:");
      listRes.Contents.forEach(c => console.log(` - ${c.Key} (${c.Size} bytes)`));
    } else {
      console.log(" (Bucket is currently empty)");
    }

    console.log("\n3. Testing PutObject (temporary test file)...");
    const testKey = `test/connection-test-${Date.now()}.txt`;
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: Buffer.from("Hotel Fremont R2 Storage Connection Test Successful"),
      ContentType: "text/plain",
    }));
    console.log(`✓ PutObject successful! Key: ${testKey}`);

    console.log("\n4. Testing DeleteObject...");
    await s3.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }));
    console.log("✓ DeleteObject successful!");

    console.log("\n🎉 ALL R2 OPERATIONS (HEAD, LIST, PUT, DELETE) SUCCEEDED WITH HOTEL FREMONT BUCKET!");
  } catch (err) {
    console.error("❌ R2 test failed:", err);
    process.exit(1);
  }
}

run();
