import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COOLDOWN_HOURS = 48;
const MAX_BYTES = 300_000; // 300KB (после webp)
const ALLOWED = new Set(["image/webp"]);

function diffHours(aIso: string, bIso: string) {
  return Math.abs(new Date(bIso).getTime() - new Date(aIso).getTime()) / 36e5;
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = auth.user.id;

  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED.has(file.type))
    return NextResponse.json({ error: "Only webp allowed" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "Avatar too large" }, { status: 400 });

  // Read current profile
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("avatar_path, avatar_updated_at, avatar_version")
    .eq("id", userId)
    .maybeSingle();

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Cooldown
  if (profile?.avatar_updated_at) {
    const hours = diffHours(profile.avatar_updated_at, new Date().toISOString());
    if (hours < COOLDOWN_HOURS) {
      const leftHours = Math.ceil(COOLDOWN_HOURS - hours);
      return NextResponse.json({ error: "Cooldown", leftHours }, { status: 429 });
    }
  }

  // Upload new
  const newPath = `${userId}/${crypto.randomUUID()}.webp`;
  const buf = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(newPath, buf, { contentType: "image/webp", upsert: false });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Delete old (best-effort)
  if (profile?.avatar_path) {
    await supabase.storage.from("avatars").remove([profile.avatar_path]);
  }

  const nextVersion = (profile?.avatar_version ?? 0) + 1;

  const { error: uErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        avatar_path: newPath,
        avatar_updated_at: new Date().toISOString(),
        avatar_version: nextVersion,
      },
      { onConflict: "id" }
    );

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    avatar_path: newPath,
    avatar_version: nextVersion,
  });
}