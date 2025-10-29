import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import os from "os";
import path from "path";

// --- Cloudinary Configuration ---
const hasCloudinaryUrl = !!process.env.CLOUDINARY_URL;
const hasCloudinaryParts = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryUrl) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else if (hasCloudinaryParts) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "Cloudinary credentials not fully configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET"
  );
}
// --------------------------------

// Exponential backoff retry wrapper
const withRetries = async (fn, attempts = 5) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = 600 * Math.pow(2, i); // 600ms, 1.2s, 2.4s, ...
      console.warn(`Upload attempt ${i + 1}/${attempts} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
};

// Promise-wrapped Cloudinary calls (avoid SDK version differences)
const uploadLarge = (filePath, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(filePath, options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });

const uploadStandard = (filePath, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });

const streamUploadFromPath = (filePath, options) =>
  new Promise((resolve, reject) => {
    const rs = fs.createReadStream(filePath);
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    rs.on("error", (e) => reject(e));
    rs.pipe(stream);
  });

/**
 * Upload a file on disk to Cloudinary (robust for large files).
 * Returns { url, public_id, raw }
 */
const uploadVideo = async (filePath, folder = "videos") => {
  if (!filePath) throw new Error("uploadVideo: filePath is required");

  if (!hasCloudinaryUrl && !hasCloudinaryParts) {
    throw new Error(
      "Cloudinary credentials missing. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET"
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`uploadVideo: file not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB

  const uploadOptions = {
    resource_type: "video",
    folder,
    use_filename: true,
    unique_filename: false,
    chunk_size: CHUNK_SIZE,
  };

  let result;
  try {
    if (fileSize > LARGE_FILE_THRESHOLD && typeof cloudinary.uploader.upload_large === "function") {
      console.log(`File size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds threshold. Using upload_large.`);
      try {
        result = await withRetries(() => uploadLarge(filePath, uploadOptions));
      } catch (errLarge) {
        console.warn(`upload_large failed (${errLarge.message}). Falling back to stream upload.`);
        result = await withRetries(() => streamUploadFromPath(filePath, uploadOptions));
      }
    } else {
      result = await withRetries(() => uploadStandard(filePath, uploadOptions));
    }

    if (!result) throw new Error("Cloudinary returned an empty response.");
    //! Debugging:
    else console.log(`Cloudinary upload successful: ${filePath}`);
    // Accept multiple possible URL fields from Cloudinary responses
    const url = result.secure_url || result.secureUrl || result.url || result.sec_url || null;

    if (!url) {
      // Try synthesize URL as last resort
      const publicId = result.public_id || result.publicId || null;
      const version = result.version ? `v${result.version}/` : "";
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL && (() => {
        try {
          const m = process.env.CLOUDINARY_URL.match(/@(.+)$/);
          return m ? m[1] : null;
        } catch (_) {
          return null;
        }
      })());

      if (publicId && cloudName) {
        const synthesized = `https://res.cloudinary.com/${cloudName}/video/upload/${version}${publicId}`;
        console.warn("Cloudinary response missing URL; using synthesized URL based on public_id.");
        return { url: synthesized, public_id: publicId, raw: result };
      }

      try {
        console.error("Cloudinary result missing URL. Raw keys:", Object.keys(result));
      } catch {}
      throw new Error("Cloudinary returned an invalid or missing URL.");
    }

    return { url, public_id: result.public_id || result.publicId || null, raw: result };
  } catch (err) {
    console.error(`Cloudinary upload failed for ${filePath}: ${err.message}`);
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
};

/**
 * Upload from a Buffer by writing a temporary file and using uploadVideo.
 */
const uploadVideoFromBuffer = async (buffer, folder = "videos", ext = ".mp4") => {
  if (!buffer) throw new Error("uploadVideoFromBuffer: buffer is required");

  const tmpDir = os.tmpdir();
  const tmpName = `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const tmpPath = path.join(tmpDir, tmpName + ext);
  await fs.promises.writeFile(tmpPath, buffer);
  try {
    return await uploadVideo(tmpPath, folder);
  } finally {
    await fs.promises.unlink(tmpPath).catch(() => {});
  }
};

export { uploadVideoFromBuffer };
export default uploadVideo;