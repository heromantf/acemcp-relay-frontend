import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getRequestLogs,
  getRequestLogStats,
} from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const withStats = searchParams.get("withStats") === "true";

    // 翻页时只查日志列表，首次加载时才查统计
    if (withStats) {
      const [logs, stats] = await Promise.all([
        getRequestLogs(session.user.id, limit, offset),
        getRequestLogStats(session.user.id),
      ]);

      return NextResponse.json({
        stats,
        logs: logs.map((log) => ({
          id: log.id,
          status: log.status,
          statusCode: log.status_code,
          requestPath: log.request_path,
          requestMethod: log.request_method,
          requestTimestamp: log.request_timestamp,
          responseDurationMs: log.response_duration_ms,
          clientIp: log.client_ip,
        })),
        pagination: {
          page,
          limit,
          total: stats.totalCount,
        },
      });
    }

    // 翻页时只查日志列表
    const logs = await getRequestLogs(session.user.id, limit, offset);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        status: log.status,
        statusCode: log.status_code,
        requestPath: log.request_path,
        requestMethod: log.request_method,
        requestTimestamp: log.request_timestamp,
        responseDurationMs: log.response_duration_ms,
        clientIp: log.client_ip,
      })),
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("获取请求日志失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
