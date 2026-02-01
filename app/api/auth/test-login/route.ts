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
    return NextResponse.json(
      {
        error: "Invalid or missing user parameter",
        validUsers: Object.keys(TEST_USERS),
      },
      { status: 400 },
    );
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
