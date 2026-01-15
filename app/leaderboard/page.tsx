"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Trophy, Crown, Medal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 获取最近三天的日期选项（使用 Asia/Shanghai 时区）
function getDateOptions() {
  const options: { date: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // 完整日期字符串用于 API 调用 (YYYY-MM-DD)
    const dateStr = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Shanghai",
    }).format(d);
    // 显示标签使用 M/D 格式（如 1/15）
    const label = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      month: "numeric",
      day: "numeric",
    }).format(d);
    options.push({ date: dateStr, label });
  }
  return options;
}

interface LeaderboardEntry {
  rank: number;
  userName: string;
  requestCount: number;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  date: string;
  entries: LeaderboardEntry[];
}

export default function LeaderboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const dateOptions = getDateOptions();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  const fetchLeaderboard = useCallback(async (dateStr?: string) => {
    setLoading(true);
    try {
      const url = dateStr
        ? `/api/leaderboard?date=${dateStr}`
        : "/api/leaderboard";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("获取排行榜失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && !selectedDate) {
      const todayDate = dateOptions[0].date;
      setSelectedDate(todayDate);
      fetchLeaderboard(todayDate);
    }
  }, [session, selectedDate, dateOptions, fetchLeaderboard]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchLeaderboard(date);
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!session) return null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-slate-500 text-sm font-mono">{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent";
    if (rank === 2) return "border-slate-400/30 bg-gradient-to-r from-slate-400/10 to-transparent";
    if (rank === 3) return "border-amber-700/30 bg-gradient-to-r from-amber-700/10 to-transparent";
    return "border-white/[0.06]";
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
            ACE Relay
          </Link>
          <div className="flex items-center gap-6">
            {/* Tab Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                href="/console"
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition-colors"
              >
                控制台
              </Link>
              <Link
                href="/leaderboard"
                className="px-3 py-1.5 text-sm text-white border-b-2 border-cyan-400"
              >
                排行榜
              </Link>
            </nav>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLeaderboard(selectedDate)}
              disabled={loading}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">每日排行榜</h1>
          <p className="text-slate-400 text-sm mb-4">每半小时更新</p>

          {/* 日期选择器 - Segment 风格 */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg bg-white/[0.04] border border-white/[0.06] p-1">
              {dateOptions.map((option) => (
                <button
                  key={option.date}
                  onClick={() => handleDateChange(option.date)}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded-md transition-all",
                    selectedDate === option.date
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard entries */}
        <div className="space-y-3">
          {loading && !data ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
              />
            ))
          ) : data?.entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              暂无排行数据
            </div>
          ) : (
            data?.entries.map((entry) => (
              <div
                key={entry.rank}
                className={cn(
                  "rounded-xl border p-4 flex items-center justify-between transition-all",
                  "bg-[#0d1424]/60 backdrop-blur-xl",
                  getRankStyle(entry.rank),
                  entry.isCurrentUser && "ring-1 ring-cyan-500/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span className={cn(
                    "font-medium",
                    entry.isCurrentUser ? "text-cyan-400" : "text-white"
                  )}>
                    {entry.userName}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        你
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-slate-300 font-mono text-sm">
                  {entry.requestCount.toLocaleString()} 次
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
