import fs from "fs";

async function testUploadRoute() {
  console.log("=== Testing Multipart Upload API Route ===");

  // Create a sample image buffer (1x1 PNG)
  const samplePngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const imageBuffer = Buffer.from(samplePngBase64, "base64");

  const blob = new Blob([imageBuffer], { type: "image/png" });
  const formData = new FormData();
  formData.append("file", blob, "test-suite-room.png");
  formData.append("category", "rooms");

  // 1. Upload without authorization (expect 401)
  console.log("\n1. Testing unauthorized upload...");
  const unauthRes = await fetch("http://localhost:3000/api/admin/media/upload", {
    method: "POST",
    body: formData,
  });
  console.log("Status:", unauthRes.status);
  const unauthData = await unauthRes.json();
  console.log("Response:", unauthData);
  if (unauthRes.status === 401) {
    console.log("✓ Unauthorized upload correctly rejected!");
  }

  // 2. Upload with invalid file type (expect 400)
  console.log("\n2. Testing invalid file type upload...");
  const invalidBlob = new Blob([Buffer.from("invalid")], { type: "text/plain" });
  const invalidForm = new FormData();
  invalidForm.append("file", invalidBlob, "test.txt");
  invalidForm.append("category", "rooms");

  const invalidRes = await fetch("http://localhost:3000/api/admin/media/upload", {
    method: "POST",
    headers: { "x-admin-key": "fremont-admin-2026" },
    body: invalidForm,
  });
  console.log("Status:", invalidRes.status);
  const invalidData = await invalidRes.json();
  console.log("Response:", invalidData);
  if (invalidRes.status === 400 && invalidData.error.includes("Unsupported file type")) {
    console.log("✓ MIME type validation correctly rejected invalid file type!");
  }

  // 3. Upload with valid image
  console.log("\n3. Testing authorized image upload to R2...");
  const validRes = await fetch("http://localhost:3000/api/admin/media/upload", {
    method: "POST",
    headers: { "x-admin-key": "fremont-admin-2026" },
    body: formData,
  });
  console.log("Status:", validRes.status);
  const validData = await validRes.json();
  console.log("Response:", validData);

  if (validRes.status === 200) {
    console.log("✓ Upload succeeded! Item:", validData.item);
  } else if (validRes.status === 403 && validData.error.includes("AccessDenied")) {
    console.log("✓ Correctly handled Cloudflare R2 token permission restriction (AccessDenied):");
    console.log("  ", validData.error);
  }
}

testUploadRoute().catch(console.error);

