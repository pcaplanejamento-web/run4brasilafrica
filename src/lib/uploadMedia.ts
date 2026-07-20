/**
 * Shared media-upload logic used by the admin `ImageUpload` and the unified
 * `HeroImageField` (banner). Compresses images in the browser, then uploads to
 * Cloudinary (when configured) or to /api/media (Cloudflare KV), returning the
 * served URL. Kept UI-agnostic so any component can reuse it.
 */

export interface CloudinaryConfig {
  cloudName?: string;
  uploadPreset?: string;
}

export interface UploadResult {
  url?: string;
  error?: string;
  /** "not_configured" when the media binding is missing (local dev). */
  code?: string;
}

/**
 * Downscale + re-encode an image in the browser before upload, to cut file size
 * (lighter site, faster mobile). Exports **WebP** so logo transparency is kept
 * (JPEG would fill it black). SVG/GIF are left untouched (vector/animated), and
 * if compression doesn't actually shrink the file the original is used.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<File> {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/webp", quality),
    );
    if (!blob || blob.size >= file.size) return file; // no real gain
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file; // any failure → upload the original untouched
  }
}

/** Upload a file and get back its served URL (or an error/code). */
export async function uploadMedia(
  rawFile: File,
  opts: { video?: boolean; cloudinary?: CloudinaryConfig } = {},
): Promise<UploadResult> {
  const { video = false, cloudinary } = opts;
  try {
    // Images are compressed client-side first; videos upload as-is.
    const file = video ? rawFile : await compressImage(rawFile);

    // Cloudinary path (unsigned, direct from the browser) when configured.
    if (cloudinary?.cloudName && cloudinary?.uploadPreset) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", cloudinary.uploadPreset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${video ? "video" : "image"}/upload`,
        { method: "POST", body: fd },
      );
      const data = (await res.json()) as {
        secure_url?: string;
        error?: { message?: string };
      };
      if (data.secure_url) return { url: data.secure_url };
      return { error: data.error?.message ?? "Falha no upload (Cloudinary)." };
    }

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    const data = (await res.json()) as {
      ok: boolean;
      url?: string;
      code?: string;
      error?: string;
    };
    if (data.code === "not_configured") return { code: "not_configured" };
    if (!data.ok || !data.url) return { error: data.error ?? "Falha no upload." };
    return { url: data.url };
  } catch {
    return { error: "Falha de conexão no upload." };
  }
}
