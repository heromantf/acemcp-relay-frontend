import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRequestLogById, getErrorDetailsByRequestId } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch log with user_id check for security
    const log = await getRequestLogById(session.user.id, id);

    if (!log) {
      return NextResponse.json({ error: "日志不存在" }, { status: 404 });
    }

    // Fetch associated error details
    const errors = await getErrorDetailsByRequestId(id);

    return NextResponse.json({
      log: {
        id: log.id,
        status: log.status,
        statusCode: log.status_code,
        requestPath: log.request_path,
        requestMethod: log.request_method,
        requestTimestamp: log.request_timestamp,
        responseDurationMs: log.response_duration_ms,
        clientIp: log.client_ip,
      },
      errors: errors.map((e) => ({
        id: e.id,
        source: e.source,
        error: e.error,
        createdAt: e.created_at,
      })),
    });
  } catch (error) {
    console.error("获取请求日志详情失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
