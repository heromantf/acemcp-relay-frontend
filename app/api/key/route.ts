import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getApiKey,
  createApiKey,
  resetApiKey,
  maskApiKey,
  initDB,
} from "@/lib/db";

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
      return NextResponse.json({
        hasKey: false,
        maskedKey: null,
        createdAt: null,
      });
    }

    return NextResponse.json({
      hasKey: true,
      maskedKey: maskApiKey(keyRecord.api_key),
      createdAt: keyRecord.created_at,
      updatedAt: keyRecord.updated_at,
    });
  } catch (error) {
    console.error("获取 API Key 失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "create";

    const existingKey = await getApiKey(session.user.id);

    let keyRecord;
    if (existingKey && action === "reset") {
      keyRecord = await resetApiKey(session.user.id);
    } else if (!existingKey) {
      keyRecord = await createApiKey(session.user.id);
    } else {
      return NextResponse.json({ error: "已存在 API Key" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      apiKey: keyRecord.api_key,
      createdAt: keyRecord.created_at,
    });
  } catch (error) {
    console.error("生成 API Key 失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
