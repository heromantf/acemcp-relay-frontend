import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getApiKey, initDB } from "@/lib/db";

initDB().catch(console.error);

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const keyRecord = await getApiKey(session.user.id);

    if (!keyRecord) {
      return NextResponse.json({ error: "没有 API Key" }, { status: 404 });
    }

    return NextResponse.json({
      apiKey: keyRecord.api_key,
    });
  } catch (error) {
    console.error("获取 API Key 失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
