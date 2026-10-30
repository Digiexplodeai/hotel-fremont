/**
 * Client-Side Image Pre-Processing Utility
 * - Strips EXIF & GPS metadata via HTML5 Canvas redraw
 * - Resizes to max width/height (default 2400px)
 * - Converts to optimized WebP format
 * - Generates tiny 16x16 Base64 blurDataURL placeholder
 */

export interface ProcessedImageResult {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  blurDataUrl: string;
}

export interface ProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.85)
  format?: "image/webp" | "image/png" | "image/jpeg";
}

/**
 * Loads a File/Blob into an HTMLImageElement
 */
function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image file."));
    };
    img.src = url;
  });
}

/**
 * Generates a tiny 16x16 blurred placeholder Data URL
 */
function generateBlurDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = Math.max(1, Math.round((16 * img.height) / img.width));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Draw scaled down
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.3);
}

/**
 * Pre-processes an image file on the client before direct R2 upload
 */
export async function processImageBeforeUpload(
  file: File,
  options: ProcessOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 2400,
    maxHeight = 2400,
    quality = 0.85,
    format = file.type === "image/png" && file.name.includes("logo") ? "image/png" : "image/webp",
  } = options;

  const img = await loadImage(file);
  let { width, height } = img;

  // Scale down if exceeds max dimensions
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw to canvas - this automatically strips EXIF, GPS, camera metadata
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas 2D rendering context.");
  }

  // Preserve alpha if transparent
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Generate tiny blur placeholder
  const blurDataUrl = generateBlurDataUrl(img);

  // Convert to Blob
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas conversion to Blob failed."));
      },
      format,
      quality
    );
  });

  return {
    blob,
    width,
    height,
    sizeBytes: blob.size,
    mimeType: format,
    blurDataUrl,
  };
}

