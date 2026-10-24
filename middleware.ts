import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|videos|fonts|resume|favicon.ico|.*\\.png$|.*\\.webp$|.*\\.mp4$).*)"],
};
