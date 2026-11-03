import { NextRequest, NextResponse } from "next/server";
import {
  HeadBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUser } from "@/actions/auth";
import { getR2Client } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Disabled in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Diagnostic endpoint disabled in production." },
      { status: 404 }
    );
  }

  // Authorization: allow authenticated admin, or local development inspection
  const user = await getCurrentUser();
  const isDev = process.env.NODE_ENV !== "production";

  if (!user && !isDev) {
    return NextResponse.json(
      { error: "Unauthorized: Admin session required." },
      { status: 401 }
    );
  }

  const accountId = process.env.R2_ACCOUNT_ID || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "hotel-fremont-media";
  const publicUrl = process.env.PUBLIC_R2_PUBLIC_URL || "https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev";

  // Step 1.a: Environment variables summary (NEVER print secret values)
  const envReport = {
    R2_ACCOUNT_ID: {
      isSet: Boolean(accountId),
      length: accountId.length,
      value: accountId, // Account ID is public/non-secret
    },
    R2_ACCESS_KEY_ID: {
      isSet: Boolean(accessKeyId),
      length: accessKeyId.length,
      prefix: accessKeyId ? `${accessKeyId.substring(0, 6)}...` : "",
    },
    R2_SECRET_ACCESS_KEY: {
      isSet: Boolean(secretAccessKey),
      length: secretAccessKey.length, // NEVER print secret values
    },
    R2_BUCKET_NAME: {
      isSet: Boolean(bucketName),
      length: bucketName.length,
      value: bucketName,
    },
    PUBLIC_R2_PUBLIC_URL: {
      isSet: Boolean(publicUrl),
      length: publicUrl.length,
      value: publicUrl,
    },
    account_id_in_use: accountId,
    bucket_name_in_use: bucketName,
  };

  const s3 = getR2Client();

  // Step 1.b: HeadBucket on hotel-fremont-media
  let headBucketResult: any = null;
  try {
    const headRes = await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    headBucketResult = {
      success: true,
      httpStatusCode: headRes.$metadata?.httpStatusCode || 200,
      region: headRes.BucketRegion || "auto",
      message: "Bucket exists and is accessible for read metadata.",
    };
  } catch (err: any) {
    headBucketResult = {
      success: false,
      httpStatusCode: err.$metadata?.httpStatusCode || 500,
      code: err.name || err.Code || "Unknown",
      message: err.message,
    };
  }

  // Step 1.c: Server-side PutObject of a tiny test file, then DeleteObject
  const testObjectKey = "diagnostics/test.txt";
  const testPayload = "Hotel Fremont R2 server-side diagnostic payload";
  let directPutResult: any = null;
  let directDeleteResult: any = null;

  try {
    const putRes = await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testObjectKey,
        Body: Buffer.from(testPayload),
        ContentType: "text/plain",
      })
    );
    directPutResult = {
      success: true,
      httpStatusCode: putRes.$metadata?.httpStatusCode || 200,
      key: testObjectKey,
    };

    // If PUT succeeded, clean up with DeleteObject
    try {
      const delRes = await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testObjectKey,
        })
      );
      directDeleteResult = {
        success: true,
        httpStatusCode: delRes.$metadata?.httpStatusCode || 200,
      };
    } catch (delErr: any) {
      directDeleteResult = {
        success: false,
        httpStatusCode: delErr.$metadata?.httpStatusCode,
        code: delErr.name || delErr.Code,
        message: delErr.message,
      };
    }
  } catch (err: any) {
    directPutResult = {
      success: false,
      httpStatusCode: err.$metadata?.httpStatusCode || 403,
      code: err.name || err.Code || "AccessDenied",
      message: err.message,
    };
  }

  // Step 1.d: Generate a presigned PUT URL exactly like the real flow does and PUT from server with fetch
  let presignFetchResult: any = null;
  try {
    const presignCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testObjectKey,
      ContentType: "text/plain",
    });

    const presignedUrl = await getSignedUrl(s3, presignCommand, {
      expiresIn: 600,
      signableHeaders: new Set(["host", "content-type"]),
    });

    const parsedUrl = new URL(presignedUrl);
    const presignMetadata = {
      endpointUrl: `${parsedUrl.origin}${parsedUrl.pathname}`,
      host: parsedUrl.host,
      signedHeaders: parsedUrl.searchParams.get("X-Amz-SignedHeaders"),
      algorithm: parsedUrl.searchParams.get("X-Amz-Algorithm"),
      credentialScope: parsedUrl.searchParams.get("X-Amz-Credential"),
      expiresInSeconds: parsedUrl.searchParams.get("X-Amz-Expires"),
    };

    const fetchResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
      },
      body: testPayload,
    });

    const responseStatus = fetchResponse.status;
    const responseStatusText = fetchResponse.statusText;
    const responseHeaders: Record<string, string> = {};
    fetchResponse.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const xmlBody = await fetchResponse.text();

    // Extract <Code> and <Message> from XML
    const codeMatch = xmlBody.match(/<Code>(.*?)<\/Code>/);
    const messageMatch = xmlBody.match(/<Message>(.*?)<\/Message>/);

    presignFetchResult = {
      success: fetchResponse.ok,
      httpStatus: responseStatus,
      httpStatusText: responseStatusText,
      presignMetadata,
      responseHeaders,
      xmlBody,
      extractedCode: codeMatch ? codeMatch[1] : null,
      extractedMessage: messageMatch ? messageMatch[1] : null,
    };
  } catch (err: any) {
    presignFetchResult = {
      success: false,
      error: err.message || "Failed executing presigned PUT fetch",
    };
  }

  // Root cause determination
  let diagnosedRootCause = "Unknown";
  if (
    directPutResult?.code === "AccessDenied" ||
    presignFetchResult?.extractedCode === "AccessDenied" ||
    presignFetchResult?.httpStatus === 403
  ) {
    diagnosedRootCause =
      "Cloudflare R2 API Token permission error: The active token was created with 'Object Read-Only' instead of 'Object Read & Write'. Cloudflare R2 returns 403 AccessDenied for PutObject/DeleteObject and omits CORS headers on 403 responses.";
  } else if (
    presignFetchResult?.extractedCode === "SignatureDoesNotMatch"
  ) {
    diagnosedRootCause =
      "Signature mismatch: Request headers or checksums do not match the presigned signature.";
  } else if (
    presignFetchResult?.success &&
    directPutResult?.success
  ) {
    diagnosedRootCause = "None - Cloudflare R2 writes and presigned PUTs are succeeding!";
  }

  const report = {
    timestamp: new Date().toISOString(),
    environment: envReport,
    diagnostics: {
      headBucket: headBucketResult,
      directServerPut: directPutResult,
      directServerDelete: directDeleteResult,
      presignedPutServerFetch: presignFetchResult,
    },
    rootCause: diagnosedRootCause,
  };

  return NextResponse.json(report, { status: 200 });
}
