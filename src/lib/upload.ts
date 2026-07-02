import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "mission-photos";

export async function uploadMissionPhoto(
  file: File,
  marketId: string,
  missionId: string,
  userId: string,
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  });

  const supabase = createClient();
  const ext = file.type.includes("png") ? "png" : "jpg";
  const path = `${marketId}/${missionId}/${userId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: compressed.type || "image/jpeg",
      upsert: true,
    });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
