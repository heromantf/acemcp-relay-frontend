import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getLeaderboard } from "@/lib/db";
import { maskUsername } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || undefined;

    const leaderboard = await getLeaderboard(dateStr);

    // Get today's date in Asia/Shanghai timezone for response
    const today = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai'
    }).format(new Date());

    return NextResponse.json({
      date: dateStr || today,
      entries: leaderboard.map((entry) => ({
        rank: entry.rank,
        userName: maskUsername(entry.user_name),
        requestCount: Number(entry.request_count),
        isCurrentUser: entry.user_id === session.user.id,
      })),
    });
  } catch (error) {
    console.error("获取排行榜失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
