import { NextResponse, type NextRequest } from "next/server";

/** Fast gate: no session cookie → login page. Real session checks run on the server in every CRM page and action. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/crm") && !pathname.startsWith("/crm/login") && !req.cookies.get("cv_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/crm/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/crm/:path*"] };
