import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Files must be under 50 MB." }, { status: 413 });
  if (!/^(image|video)\//.test(file.type)) return NextResponse.json({ error: "Only image and video files are allowed." }, { status: 415 });
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;
  const { error } = await auth.supabase.storage.from("portfolio-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = auth.supabase.storage.from("portfolio-media").getPublicUrl(path);
  return NextResponse.json({ publicUrl: data.publicUrl, path });
}
