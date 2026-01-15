import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = session.user;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      username: (user as { username?: string }).username,
      trustLevel: (user as { trustLevel?: number }).trustLevel,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
