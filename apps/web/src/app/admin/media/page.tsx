"use client";

import { useState, useRef } from "react";
import { Card, Button, Badge, EmptyState, ProgressBar } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const FILTER_TABS = [
  { value: "all", ar: "كل الملفات", en: "All Files" },
  { value: "image", ar: "صور", en: "Images" },
  { value: "video", ar: "فيديوهات", en: "Videos" },
];

export default function MediaPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; type: string; size: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const isImage = file.type.startsWith("image/");
      const context = isImage ? "exercise_image" : "exercise_video";

      const { uploadUrl, cdnUrl, key } = await api.post<any>("/uploads/presign", {
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        context,
      });

      // Upload to R2
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
        xhr.onerror = reject;
        xhr.send(file);
      });

      await api.post("/uploads/confirm", { key });

      setUploadedFiles(prev => [{
        name: file.name,
        url: cdnUrl,
        type: isImage ? "image" : "video",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      }, ...prev]);

    } catch (err: any) {
      alert(err?.error?.message || (isAr ? "فشل رفع الملف — تأكد من إعداد التخزين" : "Upload failed — check storage setup"));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{isAr ? "الوسائط" : "Media"}</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            {isAr ? "إدارة صور وفيديوهات التمارين" : "Manage exercise images and videos"}
          </p>
        </div>
        <Button onClick={() => fileRef.current?.click()}>
          📤 {isAr ? "رفع ملف" : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/webp,image/png,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)} className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${filter === tab.value ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text-muted)]"}`}>
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* Upload progress */}
      {uploading && (
        <Card className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-xl">📤</span>
            <div className="flex-1">
              <p className="text-[13px] font-medium mb-1">{isAr ? "جاري الرفع..." : "Uploading..."}</p>
              <ProgressBar value={uploadProgress} max={100} showLabel color="var(--accent)" />
            </div>
          </div>
        </Card>
      )}

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-[var(--border)] rounded-xl p-12 text-center mb-6 hover:border-[var(--accent)] transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleUpload(file);
        }}
      >
        <span className="text-4xl block mb-3">📂</span>
        <p className="text-[14px] font-medium mb-1">{isAr ? "اسحب وأفلت الملفات هنا" : "Drag & drop files here"}</p>
        <p className="text-[12px] text-[var(--text-muted)]">
          {isAr ? "JPG, WebP, PNG (2MB) · MP4, WebM (50MB)" : "JPG, WebP, PNG (2MB) · MP4, WebM (50MB)"}
        </p>
      </div>

      {/* Uploaded files */}
      {uploadedFiles.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedFiles
            .filter(f => filter === "all" || f.type === filter)
            .map((file, i) => (
              <Card key={i} padding="sm" hover>
                <div className="w-full h-28 bg-[var(--bg-input)] rounded-lg mb-3 flex items-center justify-center">
                  {file.type === "image" ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-3xl">🎬</span>
                  )}
                </div>
                <p className="text-[12px] font-medium truncate">{file.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-[var(--text-muted)]">{file.size}</span>
                  <Badge variant={file.type === "image" ? "info" : "warning"}>
                    {file.type === "image" ? (isAr ? "صورة" : "Image") : (isAr ? "فيديو" : "Video")}
                  </Badge>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(file.url)}
                  className="w-full mt-2 text-[11px] text-[var(--accent)] hover:underline"
                >
                  📋 {isAr ? "نسخ الرابط" : "Copy URL"}
                </button>
              </Card>
            ))}
        </div>
      ) : (
        <EmptyState
          icon="🖼️"
          title={isAr ? "لا توجد ملفات مرفوعة" : "No uploaded files"}
          description={isAr ? "ارفع صور وفيديوهات التمارين من هنا" : "Upload exercise images and videos"}
          action={{ label: isAr ? "رفع ملف" : "Upload", onClick: () => fileRef.current?.click() }}
        />
      )}
    </div>
  );
}
