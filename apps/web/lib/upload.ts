import { api } from "./api";

export type UploadContext =
  | "exercise_image"
  | "exercise_video"
  | "progress_photo"
  | "chat_image"
  | "chat_file"
  | "avatar"
  | "coach_logo";

interface PresignedUrlResponse {
  uploadUrl: string;
  cdnUrl: string;
  key: string;
  expiresAt: string;
}

export async function uploadFile(params: {
  file: File;
  context: UploadContext;
  onProgress?: (pct: number) => void;
}): Promise<string> {
  const { file, context, onProgress } = params;

  // 1. Get presigned URL from API
  const { uploadUrl, cdnUrl, key } = await api.post<PresignedUrlResponse>(
    "/uploads/presign",
    {
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      context,
    },
  );

  // 2. Upload directly to R2
  await uploadWithProgress(uploadUrl, file, file.type, onProgress);

  // 3. Confirm upload with API
  await api.post("/uploads/confirm", { key });

  return cdnUrl;
}

function uploadWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });
}
