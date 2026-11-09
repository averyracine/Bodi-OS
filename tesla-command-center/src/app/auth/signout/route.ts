import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/request";

export async function POST(request: NextRequest) {
  if (!(await isSameOrigin())) return new NextResponse("Forbidden", { status: 403 });
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/app/settings", request.nextUrl.origin), { status: 303 });
}
