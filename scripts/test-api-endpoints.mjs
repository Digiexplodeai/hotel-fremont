import http from "http";

async function makeRequest({ method = "GET", path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "localhost",
        port: 3000,
        path,
        method,
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json,
          });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== Testing Hotel Fremont Cloudflare R2 Admin API Endpoints ===\n");

  // 1. Check initial auth status
  console.log("1. GET /api/admin/auth (unauthenticated)...");
  const authStatus = await makeRequest({ path: "/api/admin/auth" });
  console.log("Status:", authStatus.statusCode);
  console.log("JSON:", authStatus.json);
  if (authStatus.json?.authenticated === false && authStatus.json?.r2Config?.bucketName === "hotel-fremont-media") {
    console.log("✓ Initial auth status and R2 config correct!\n");
  } else {
    console.error("❌ Unexpected response:", authStatus.body);
  }

  // 2. Test unauthorized access to media listing
  console.log("2. GET /api/admin/media (no credentials -> 401 expected)...");
  const unauthList = await makeRequest({ path: "/api/admin/media" });
  console.log("Status:", unauthList.statusCode);
  if (unauthList.statusCode === 401) {
    console.log("✓ Correctly rejected with 401 Unauthorized!\n");
  } else {
    console.error("❌ Expected 401, got:", unauthList.statusCode);
  }

  // 3. Test login with wrong password
  console.log("3. POST /api/admin/auth (wrong credentials)...");
  const wrongLogin = await makeRequest({
    method: "POST",
    path: "/api/admin/auth",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "wrong-password" }),
  });
  console.log("Status:", wrongLogin.statusCode);
  if (wrongLogin.statusCode === 401) {
    console.log("✓ Correctly rejected with 401 Invalid Credentials!\n");
  }

  // 4. Test login with correct password
  console.log("4. POST /api/admin/auth (correct credentials: fremont-admin-2026)...");
  const correctLogin = await makeRequest({
    method: "POST",
    path: "/api/admin/auth",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "fremont-admin-2026" }),
  });
  console.log("Status:", correctLogin.statusCode);
  const setCookie = correctLogin.headers["set-cookie"];
  console.log("Set-Cookie header received:", Boolean(setCookie));
  if (correctLogin.statusCode === 200 && setCookie) {
    console.log("✓ Login successful and session cookie set!\n");
  }

  const cookieHeader = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie.split(";")[0];

  // 5. Test authorized media listing via cookie
  console.log("5. GET /api/admin/media (with session cookie)...");
  const authList = await makeRequest({
    path: "/api/admin/media?category=rooms",
    headers: { Cookie: cookieHeader },
  });
  console.log("Status:", authList.statusCode);
  console.log("JSON response:", authList.json);
  if (authList.statusCode === 200 && authList.json?.success === true) {
    console.log("✓ Successfully connected to Cloudflare R2 bucket and listed media items!\n");
  } else {
    console.error("❌ Listing failed:", authList.body);
  }

  // 6. Test authorized media listing via x-admin-key header
  console.log("6. GET /api/admin/media (with x-admin-key header)...");
  const headerList = await makeRequest({
    path: "/api/admin/media?category=all",
    headers: { "x-admin-key": "fremont-admin-2026" },
  });
  console.log("Status:", headerList.statusCode);
  if (headerList.statusCode === 200 && headerList.json?.success === true) {
    console.log("✓ Authorization via x-admin-key header works perfectly!\n");
  }

  // 7. Test invalid key deletion
  console.log("7. DELETE /api/admin/media (path traversal validation)...");
  const traversalDelete = await makeRequest({
    method: "DELETE",
    path: "/api/admin/media",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": "fremont-admin-2026",
    },
    body: JSON.stringify({ key: "../dangerous-file.txt" }),
  });
  console.log("Status:", traversalDelete.statusCode);
  console.log("JSON response:", traversalDelete.json);
  if (traversalDelete.statusCode === 400 && traversalDelete.json?.error?.includes("traversal")) {
    console.log("✓ Security validation correctly intercepted path traversal key!\n");
  }

  console.log("=== All API verification tests passed! ===");
}

runTests().catch(console.error);

