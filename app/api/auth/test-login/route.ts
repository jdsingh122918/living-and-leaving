import { NextRequest, NextResponse } from "next/server";

const TEST_USERS: Record<string, { role: string }> = {
  test_admin_001: { role: "ADMIN" },
  test_volunteer_001: { role: "VOLUNTEER" },
  test_member_001: { role: "MEMBER" },
};

export async function GET(request: NextRequest) {
  // Safety: never allow in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test login is not available in production" },
      { status: 403 },
    );
  }

  // Only allow when integration test mode is explicitly enabled
  if (process.env.INTEGRATION_TEST_MODE !== "true") {
    return NextResponse.json(
      { error: "Test login requires INTEGRATION_TEST_MODE=true" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle logout: clear cookies and redirect
  if (action === "logout") {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("__test_user_id", "", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 0,
    });
    response.cookies.set("__test_user_role", "", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 0,
    });
    return response;
  }

  // Handle login: validate user param and set cookies
  const user = searchParams.get("user");

  if (!user || !TEST_USERS[user]) {
    // Show login page with user selection
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Local Dev Login</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 420px; margin: 80px auto; padding: 0 20px; background: #0a0a0a; color: #e5e5e5; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  p { color: #a3a3a3; font-size: 0.875rem; }
  .cards { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
  a { display: block; padding: 16px; border-radius: 8px; border: 1px solid #262626; text-decoration: none; color: #e5e5e5; transition: border-color 0.15s; }
  a:hover { border-color: #525252; }
  .role { font-weight: 600; font-size: 1rem; }
  .email { color: #a3a3a3; font-size: 0.8rem; margin-top: 4px; }
  .badge { display: inline-block; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: 500; margin-left: 8px; }
  .admin .badge { background: #7f1d1d; color: #fca5a5; }
  .volunteer .badge { background: #713f12; color: #fde68a; }
  .member .badge { background: #14532d; color: #86efac; }
</style></head><body>
<h1>Local Dev Login</h1>
<p>Select a test user to sign in as.</p>
<div class="cards">
  <a href="?user=test_admin_001" class="admin"><span class="role">Test Admin<span class="badge">ADMIN</span></span><div class="email">admin@test.villages.local</div></a>
  <a href="?user=test_volunteer_001" class="volunteer"><span class="role">Test Volunteer<span class="badge">VOLUNTEER</span></span><div class="email">volunteer@test.villages.local</div></a>
  <a href="?user=test_member_001" class="member"><span class="role">Test Member<span class="badge">MEMBER</span></span><div class="email">member@test.villages.local</div></a>
</div>
</body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  const testUser = TEST_USERS[user];
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set("__test_user_id", user, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 86400,
  });
  response.cookies.set("__test_user_role", testUser.role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 86400,
  });

  return response;
}
