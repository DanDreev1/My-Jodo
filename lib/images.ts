"use client";

export async function fileToSquareWebp(
  file: File,
  size = 256,
  quality = 0.85
): Promise<File> {
  const bmp = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Crop center square
  const s = Math.min(bmp.width, bmp.height);
  const sx = Math.floor((bmp.width - s) / 2);
  const sy = Math.floor((bmp.height - s) / 2);

  ctx.drawImage(bmp, sx, sy, s, s, 0, 0, size, size);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/webp",
      quality
    );
  });

  return new File([blob], "avatar.webp", { type: "image/webp" });
}