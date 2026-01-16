import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing 'from' or 'to' query params" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1) основное окно
    const { data: events, error: eventsErr } = await supabase
      .from("events")
      // ⚠️ УБЕРИ color если колонки нет
      .select("id,user_id,title,description,start_at,end_at,all_day,location,created_at,updated_at,tag")
      .eq("user_id", user.id)
      .gte("start_at", from)
      .lt("start_at", to)
      .order("start_at", { ascending: true });

    if (eventsErr) {
      return NextResponse.json({ error: eventsErr.message }, { status: 500 });
    }

    // 2) hasPrev: есть ли что-то раньше from
    const { data: prevRow, error: prevErr } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", user.id)
      .lt("start_at", from)
      .order("start_at", { ascending: false })
      .limit(1);

    if (prevErr) {
      return NextResponse.json({ error: prevErr.message }, { status: 500 });
    }

    // 3) hasNext: есть ли что-то на/после to
    const { data: nextRow, error: nextErr } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", user.id)
      .gte("start_at", to)
      .order("start_at", { ascending: true })
      .limit(1);

    if (nextErr) {
      return NextResponse.json({ error: nextErr.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events ?? [],
      hasPrev: (prevRow?.length ?? 0) > 0,
      hasNext: (nextRow?.length ?? 0) > 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}