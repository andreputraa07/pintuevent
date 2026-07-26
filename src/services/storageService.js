const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function validateEventImage(file) {
  if (!file) return "File wajib dipilih.";
  if (!acceptedImageTypes.includes(file.type)) {
    return "Format gambar tidak didukung.";
  }
  if (file.size > 5 * 1024 * 1024) return "Ukuran maksimal 5 MB.";
  return null;
}
