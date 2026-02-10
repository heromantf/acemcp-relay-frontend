"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Copy, Eye, EyeOff, RefreshCw, Info, LogOut, Loader2 } from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = "keys" | "profile" | "logs" | "docs";

interface RequestLog {
  id: string;
  status: string;
  statusCode: number | null;
  requestPath: string;
  requestMethod: string;
  requestTimestamp: string;
  responseDurationMs: number | null;
  clientIp: string;
}

interface LogStats {
  successCount: number;
  failedCount: number;
  totalCount: number;
}

interface LogsResponse {
  stats: LogStats;
  logs: RequestLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ErrorDetail {
  id: number;
  source: string;
  error: string;
  createdAt: string;
}

interface LogDetailResponse {
  log: RequestLog;
  errors: ErrorDetail[];
}

interface UserInfo {
  id: string;
  username: string;
  name: string;
  email: string;
  image: string;
  trustLevel: number;
  createdAt: string;
}

interface KeyInfo {
  hasKey: boolean;
  maskedKey: string | null;
  createdAt: string | null;
  updatedAt?: string | null;
}

export default function ConsolePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("keys");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [logDetail, setLogDetail] = useState<LogDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const installCommand = "npm install -g @augmentcode/auggie@latest";
  const mcpConfig = `{
  "mcpServers": {
    "augment-context-engine": {
      "command": "auggie",
      "args": ["--mcp", "--mcp-auto-workspace"],
      "env": {
        "AUGMENT_API_TOKEN": "your-access-token",
        "AUGMENT_API_URL": "https://acemcp.heroman.wtf/relay/"
      }
    }
  }
}`;

  const fetchUserInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  }, []);

  const fetchKeyInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/key");
      if (res.ok) {
        const data = await res.json();
        setKeyInfo(data);
      }
    } catch (error) {
      console.error("获取密钥信息失败:", error);
    }
  }, []);

  const fetchLogs = useCallback(async (page = 1, forceRefreshStats = false) => {
    setLogsLoading(true);
    const startTime = Date.now();
    try {
      // 首次加载、第1页、或强制刷新时获取统计数据
      const needStats = forceRefreshStats || !logsData?.stats || page === 1;
      const url = needStats
        ? `/api/logs?page=${page}&limit=20&withStats=true`
        : `/api/logs?page=${page}&limit=20`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();

        if (needStats) {
          // 带统计数据的响应
          setLogsData(data);
        } else {
          // 只更新日志列表，保留原有统计数据和 total
          setLogsData(prev => prev ? {
            ...prev,
            logs: data.logs,
            pagination: {
              ...data.pagination,
              total: prev.pagination.total,
            },
          } : data);
        }
        setLogsPage(page);
      }
    } catch (error) {
      console.error("获取请求日志失败:", error);
    } finally {
      // 确保动画至少显示 300ms
      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - elapsed));
      }
      setLogsLoading(false);
    }
  }, [logsData?.stats]);

  const fetchLogDetail = useCallback(async (logId: string) => {
    setDetailLoading(true);
    setShowDetailDialog(true);
    try {
      const res = await fetch(`/api/logs/${logId}`);
      if (res.ok) {
        const data = await res.json();
        setLogDetail(data);
      }
    } catch (error) {
      console.error("获取日志详情失败:", error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Fetch logs when switching to logs tab (only on tab switch, not on page change)
  useEffect(() => {
    if (activeTab === "logs" && session && !logsData) {
      fetchLogs(1);  // 首次进入 logs tab 时加载第一页
    }
  }, [activeTab, session, logsData, fetchLogs]);

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh || activeTab !== "logs") return;

    const intervalId = setInterval(() => {
      fetchLogs(1, true);  // 自动刷新回到第1页并获取统计
    }, 5000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, activeTab, fetchLogs]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    } else if (session) {
      fetchUserInfo();
      fetchKeyInfo();
    }
  }, [isPending, session, router, fetchUserInfo, fetchKeyInfo]);

  const handleShowKey = async () => {
    if (showKey) {
      setShowKey(false);
      setFullKey(null);
      return;
    }
    try {
      const res = await fetch("/api/key/reveal");
      if (res.ok) {
        const data = await res.json();
        setFullKey(data.apiKey);
        setShowKey(true);
      }
    } catch (error) {
      console.error("获取完整密钥失败:", error);
    }
  };

  const handleCopy = async () => {
    if (!fullKey && !keyInfo?.hasKey) return;

    let keyToCopy = fullKey;
    if (!keyToCopy) {
      const res = await fetch("/api/key/reveal");
      if (res.ok) {
        const data = await res.json();
        keyToCopy = data.apiKey;
      }
    }

    if (keyToCopy) {
      await navigator.clipboard.writeText(keyToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateKey = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      if (res.ok) {
        const data = await res.json();
        setFullKey(data.apiKey);
        setShowKey(false);
        await fetchKeyInfo();
      }
    } catch (error) {
      console.error("生成密钥失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetKey = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const data = await res.json();
        setFullKey(data.apiKey);
        setShowKey(false);
        await fetchKeyInfo();
      }
    } catch (error) {
      console.error("重置密钥失败:", error);
    } finally {
      setLoading(false);
      setShowResetConfirm(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-32 bg-white/[0.06]" />
          <Skeleton className="h-32 w-full bg-white/[0.06]" />
          <Skeleton className="h-24 w-full bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const tabs = [
    { id: "keys" as const, label: "密钥管理" },
    { id: "docs" as const, label: "配置说明" },
    { id: "logs" as const, label: "请求日志" },
    { id: "profile" as const, label: "用户信息" },
  ];

  return (
    <div className="h-screen bg-[#0a0f1a] flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-gradient-radial from-cyan-500/5 via-blue-500/3 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Noise texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Header */}
      <header className="relative border-b border-white/[0.06] flex-shrink-0 bg-[#0a0f1a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
            ACE Relay
          </Link>
          <div className="flex items-center gap-6">
            {/* Tab Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                href="/console"
                className="px-3 py-1.5 text-sm text-white border-b-2 border-cyan-400"
              >
                控制台
              </Link>
              <Link
                href="/leaderboard"
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition-colors"
              >
                排行榜
              </Link>
            </nav>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutConfirm(true)}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex-1 flex flex-col min-h-0">
            {/* Mobile tabs - horizontal scrollable */}
            <TabsList className="flex md:hidden gap-2 mb-4 overflow-x-auto scrollbar-none pb-2 flex-shrink-0 bg-transparent h-auto p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex-shrink-0 px-3 py-2 text-sm rounded-lg whitespace-nowrap data-[state=active]:bg-white/[0.06] data-[state=active]:text-white data-[state=inactive]:text-slate-400 border border-transparent data-[state=active]:border-white/[0.08]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex gap-4 flex-1 min-h-0">
              {/* Sidebar - desktop only */}
              <aside className="hidden md:block flex-shrink-0">
                <TabsList className="flex flex-col gap-1 bg-transparent h-auto p-0">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="justify-start px-8 py-3 text-base rounded-xl data-[state=active]:bg-white/[0.06] data-[state=active]:text-white data-[state=inactive]:text-slate-400 border border-transparent data-[state=active]:border-white/[0.08]"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </aside>

              {/* Content area */}
              <main className="flex-1 min-w-0 min-h-0">
                <div className="bg-[#0d1424]/60 backdrop-blur-xl border border-white/[0.06] rounded-xl sm:rounded-2xl p-4 sm:p-6 h-full flex flex-col">
                  {/* 密钥管理 */}
                  <TabsContent value="keys" className="animate-tab-fade-in m-0 flex-1">
                    <h2 className="text-lg font-medium text-white mb-6">密钥管理</h2>

                    {keyInfo === null ? (
                      <div className="text-center py-8">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 w-32 bg-slate-700/50 rounded mx-auto"></div>
                          <div className="h-10 w-24 bg-slate-700/50 rounded mx-auto"></div>
                        </div>
                      </div>
                    ) : keyInfo.hasKey ? (
                      <div className="space-y-4">
                        {/* Key display */}
                        <Card className="bg-[#0a0f1a]/60 border-white/[0.06]">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-500 text-xs mb-1">API Key</p>
                                <p className="text-white font-mono text-sm truncate">
                                  {showKey && fullKey ? fullKey : keyInfo.maskedKey}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="glass"
                                  size="sm"
                                  onClick={handleShowKey}
                                >
                                  {showKey ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                                  {showKey ? "隐藏" : "显示"}
                                </Button>
                                <Button
                                  variant="glass"
                                  size="sm"
                                  onClick={handleCopy}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  {copied ? "已复制" : "复制"}
                                </Button>
                              </div>
                            </div>
                            {keyInfo.createdAt && (
                              <p className="text-slate-600 text-xs mt-3">
                                创建于 {new Date(keyInfo.createdAt).toLocaleString("zh-CN")}
                              </p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Reset button */}
                        <Button
                          variant="warning"
                          onClick={() => setShowResetConfirm(true)}
                          disabled={loading}
                        >
                          {loading ? "处理中..." : "重置密钥"}
                        </Button>
                        <p className="text-slate-600 text-xs">
                          重置后旧密钥将立即失效，请谨慎操作
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        {loading ? (
                          <div className="space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                            <p className="text-slate-400">正在生成密钥...</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-slate-500 mb-4">您还没有 API Key</p>
                            <Button
                              variant="gradient"
                              onClick={handleGenerateKey}
                            >
                              生成密钥
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* 配置说明 */}
                  <TabsContent value="docs" className="flex flex-col flex-1 min-h-0 animate-tab-fade-in overflow-y-auto scrollbar-thin pr-2 m-0">
                    <h2 className="text-lg font-medium text-white mb-6">配置说明</h2>

                    <div className="space-y-6">
                      {/* Step 1: Install Auggie */}
                      <Card className="bg-[#0a0f1a]/60 border-white/[0.06]">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                              1
                            </span>
                            <h3 className="text-white font-medium">安装 Auggie</h3>
                          </div>
                          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                            首先，全局安装 Auggie CLI 工具。
                          </p>
                          <div className="relative group">
                            <div className="bg-[#0a0f1a] border border-white/[0.08] rounded-lg p-3 font-mono text-sm">
                              <code className="text-cyan-300">{installCommand}</code>
                            </div>
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={async () => {
                                await navigator.clipboard.writeText(installCommand);
                                setCopiedInstall(true);
                                setTimeout(() => setCopiedInstall(false), 2000);
                              }}
                              className="absolute top-2 right-2"
                            >
                              {copiedInstall ? "已复制" : "复制"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Step 2: Configure MCP */}
                      <Card className="bg-[#0a0f1a]/60 border-white/[0.06]">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                              2
                            </span>
                            <h3 className="text-white font-medium">配置 MCP</h3>
                          </div>
                          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                            在你的 MCP 配置文件中添加以下配置：
                          </p>
                          <div className="relative group">
                            <div className="bg-[#0a0f1a] border border-white/[0.08] rounded-lg p-3 font-mono text-sm overflow-x-auto">
                              <pre className="text-slate-300">
                                <code>
                                  <span className="text-slate-500">{"{"}</span>{"\n"}
                                  <span className="text-slate-300">{"  "}</span>
                                  <span className="text-cyan-400">&quot;mcpServers&quot;</span>
                                  <span className="text-slate-500">:</span>
                                  <span className="text-slate-500">{" {"}</span>{"\n"}
                                  <span className="text-slate-300">{"    "}</span>
                                  <span className="text-cyan-400">&quot;augment-context-engine&quot;</span>
                                  <span className="text-slate-500">:</span>
                                  <span className="text-slate-500">{" {"}</span>{"\n"}
                                  <span className="text-slate-300">{"      "}</span>
                                  <span className="text-cyan-400">&quot;command&quot;</span>
                                  <span className="text-slate-500">:</span>
                                  <span className="text-emerald-400">{" \"auggie\""}</span>
                                  <span className="text-slate-500">,</span>{"\n"}
                                  <span className="text-slate-300">{"      "}</span>
                                  <span className="text-cyan-400">&quot;args&quot;</span>
                                  <span className="text-slate-500">:</span>
                                  <span className="text-slate-500">{" ["}</span>
                                  <span className="text-emerald-400">&quot;--mcp&quot;</span>
                                  <span className="text-slate-500">,</span>
                                  <span className="text-emerald-400">{" \"--mcp-auto-workspace\""}</span>
                                  <span className="text-slate-500">{"]"}</span>
                                  <span className="text-slate-500">,</span>{"\n"}
                                  <span className="text-slate-300">{"      "}</span>
                                  <span className="text-cyan-400">&quot;env&quot;</span>
                                  <span className="text-slate-500">:</span>
                                  <span className="text-slate-500">{" {"}</span>{"\n"}
                                  <span className="text-slate-300">{"        "}</span>
                                  <span className="text-cyan-400">&quot;AUGMENT_API_TOKEN&quot;</span>
                                  <span className="text-slate-500">:</span>
                                  <span className="text-amber-400">{" \"your-access-token\""}</span>
                                  <span className="text-slate-500">,</span>{"\n"}
                                  <span className="text-slate-300">{"        "}</span>
                                  <span className="text-cyan-400">&quot;AUGMENT_API_URL&quot;</span>
                                  <span className="text-slate-500">:</span>
                                  <span className="text-emerald-400">{" \"https://acemcp.heroman.wtf/relay/\""}</span>{"\n"}
                                  <span className="text-slate-300">{"      "}</span>
                                  <span className="text-slate-500">{"}"}</span>{"\n"}
                                  <span className="text-slate-300">{"    "}</span>
                                  <span className="text-slate-500">{"}"}</span>{"\n"}
                                  <span className="text-slate-300">{"  "}</span>
                                  <span className="text-slate-500">{"}"}</span>{"\n"}
                                  <span className="text-slate-500">{"}"}</span>
                                </code>
                              </pre>
                            </div>
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={async () => {
                                await navigator.clipboard.writeText(mcpConfig);
                                setCopiedConfig(true);
                                setTimeout(() => setCopiedConfig(false), 2000);
                              }}
                              className="absolute top-2 right-2"
                            >
                              {copiedConfig ? "已复制" : "复制"}
                            </Button>
                          </div>

                          {/* Configuration notes */}
                          <div className="mt-5 space-y-3">
                            <div className="flex gap-3 p-3 bg-[#0a0f1a]/80 border border-white/[0.04] rounded-lg">
                              <code className="text-cyan-400 text-xs font-mono shrink-0">AUGMENT_API_TOKEN</code>
                              <p className="text-slate-400 text-xs">
                                你的 API 密钥，在「密钥管理」中生成
                              </p>
                            </div>
                            <div className="flex gap-3 p-3 bg-[#0a0f1a]/80 border border-white/[0.04] rounded-lg">
                              <code className="text-cyan-400 text-xs font-mono shrink-0">AUGMENT_API_URL</code>
                              <p className="text-slate-400 text-xs">
                                固定为 <code className="text-emerald-400">https://acemcp.heroman.wtf/relay/</code>
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tips */}
                      <Card className="bg-gradient-to-br from-cyan-500/[0.06] to-blue-500/[0.06] border-cyan-500/20">
                        <CardContent className="p-4">
                          <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4 text-cyan-400" />
                            温馨提示
                          </h4>
                          <ul className="text-slate-400 text-xs space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span>配置完成后，重启 IDE 或编辑器以使配置生效</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span>请妥善保管 API 密钥，不要在公开场合分享</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span>如遇问题，可在「请求日志」中查看排查</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 请求日志 */}
                  <TabsContent value="logs" className="flex flex-col flex-1 min-h-0 animate-tab-fade-in m-0">
                    <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                      <h2 className="text-base sm:text-lg font-medium text-white">请求日志</h2>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-2">
                          <Checkbox
                            id="auto-refresh"
                            checked={autoRefresh}
                            onCheckedChange={(checked) => setAutoRefresh(checked === true)}
                            className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                          />
                          <Label htmlFor="auto-refresh" className="text-sm text-slate-400 cursor-pointer">
                            自动刷新
                          </Label>
                        </div>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => setAutoRefresh(!autoRefresh)}
                          className={cn(
                            "sm:hidden",
                            autoRefresh && "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                          )}
                        >
                          {autoRefresh ? "自动" : "手动"}
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => fetchLogs(1, true)}
                          disabled={logsLoading}
                        >
                          <RefreshCw className={cn("w-4 h-4", logsLoading && "animate-spin")} />
                          <span className="hidden sm:inline ml-1">刷新</span>
                        </Button>
                      </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 flex-shrink-0">
                      <Card className="bg-[#0a0f1a]/60 border-green-500/20">
                        <CardContent className="p-2 sm:p-4">
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">成功</p>
                          <p className="text-lg sm:text-2xl font-medium text-green-400">
                            {logsData?.stats.successCount.toLocaleString() || 0}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-[#0a0f1a]/60 border-red-500/20">
                        <CardContent className="p-2 sm:p-4">
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">失败</p>
                          <p className="text-lg sm:text-2xl font-medium text-red-400">
                            {logsData?.stats.failedCount.toLocaleString() || 0}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-[#0a0f1a]/60 border-white/[0.06]">
                        <CardContent className="p-2 sm:p-4">
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">总计</p>
                          <p className="text-lg sm:text-2xl font-medium text-slate-300">
                            {logsData?.stats.totalCount.toLocaleString() || 0}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Log Entries */}
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-2">
                      <div className="space-y-2">
                        {logsLoading && !logsData && (
                          <>
                            <Skeleton className="h-16 w-full bg-white/[0.06]" />
                            <Skeleton className="h-16 w-full bg-white/[0.06]" />
                            <Skeleton className="h-16 w-full bg-white/[0.06]" />
                          </>
                        )}
                        {logsData?.logs.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            暂无请求日志
                          </div>
                        )}
                        {logsData?.logs.map((log) => (
                          <LogEntry key={log.id} log={log} onClick={() => fetchLogDetail(log.id)} />
                        ))}
                      </div>
                    </div>

                    {/* Pagination */}
                    {logsData && logsData.pagination.total > 20 && (
                      <div className="flex items-center justify-center gap-2 mt-6 flex-shrink-0">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => fetchLogs(logsPage - 1)}
                          disabled={logsPage <= 1 || logsLoading}
                        >
                          上一页
                        </Button>
                        <span className="text-slate-500 text-sm px-3">
                          {logsPage} / {Math.ceil(logsData.pagination.total / 20)}
                        </span>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => fetchLogs(logsPage + 1)}
                          disabled={logsPage >= Math.ceil(logsData.pagination.total / 20) || logsLoading}
                        >
                          下一页
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* 用户信息 */}
                  <TabsContent value="profile" className="animate-tab-fade-in m-0">
                    <h2 className="text-lg font-medium text-white mb-6">用户信息</h2>

                    {userInfo ? (
                      <div className="space-y-6">
                        {/* Avatar and name */}
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border border-white/10">
                            <AvatarImage src={userInfo.image} alt={userInfo.name || "avatar"} />
                            <AvatarFallback className="bg-slate-800 text-slate-300">
                              {userInfo.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium text-lg">{userInfo.name}</p>
                            <p className="text-slate-500 text-sm">@{userInfo.username}</p>
                          </div>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <InfoItem label="邮箱" value={userInfo.email || "-"} copyable />
                          <InfoItem label="用户 ID" value={userInfo.id} copyable />
                          <InfoItem label="信任等级" value={`Level ${userInfo.trustLevel || 0}`} />
                          <InfoItem
                            label="注册时间"
                            value={userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString("zh-CN") : "-"}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-16 w-16 rounded-full bg-white/[0.06]" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32 bg-white/[0.06]" />
                            <Skeleton className="h-4 w-24 bg-white/[0.06]" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Skeleton className="h-20 bg-white/[0.06]" />
                          <Skeleton className="h-20 bg-white/[0.06]" />
                          <Skeleton className="h-20 bg-white/[0.06]" />
                          <Skeleton className="h-20 bg-white/[0.06]" />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </main>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Reset confirm dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="bg-[#0d1424] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">确认重置密钥</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              重置后旧密钥将立即失效，所有使用旧密钥的服务都需要更新。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetKey}
              disabled={loading}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-white"
            >
              {loading ? "处理中..." : "确认重置"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout confirm dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-[#0d1424] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">确认退出登录</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              确定要退出登录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-white"
            >
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Log detail dialog */}
      <AlertDialog open={showDetailDialog} onOpenChange={(open) => {
        setShowDetailDialog(open);
        if (!open) setLogDetail(null);
      }}>
        <AlertDialogContent className="bg-[#0d1424] border-white/[0.08] max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">请求详情</AlertDialogTitle>
          </AlertDialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-full bg-white/[0.06]" />
              <Skeleton className="h-32 w-full bg-white/[0.06]" />
            </div>
          ) : logDetail ? (
            <div className="space-y-4">
              {/* Request ID with copy */}
              <LogDetailItem
                label="请求 ID"
                value={logDetail.log.id}
                copyable
                mono
              />

              {/* Main info grid */}
              <div className="grid grid-cols-2 gap-3">
                <LogDetailItem label="请求方法" value={logDetail.log.requestMethod} />
                <LogDetailItem
                  label="状态码"
                  value={logDetail.log.statusCode?.toString() || logDetail.log.status}
                  statusCode={logDetail.log.statusCode}
                />
                <LogDetailItem
                  label="响应时间"
                  value={logDetail.log.responseDurationMs !== null ? `${logDetail.log.responseDurationMs} ms` : "-"}
                />
                <LogDetailItem label="客户端 IP" value={logDetail.log.clientIp} mono />
              </div>

              {/* Request path - full width */}
              <LogDetailItem
                label="请求路径"
                value={logDetail.log.requestPath}
                mono
              />

              {/* Timestamp */}
              <LogDetailItem
                label="请求时间"
                value={new Date(logDetail.log.requestTimestamp).toLocaleString("zh-CN")}
              />

              {/* Error section - only show if errors exist */}
              {logDetail.errors && logDetail.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-3">
                  <p className="text-red-400 text-sm font-medium">错误信息</p>
                  {logDetail.errors.map((error) => (
                    <div key={error.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">来源:</span>
                        <span className="text-slate-300">{error.source}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500">
                          {new Date(error.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <p className="text-red-300 text-sm font-mono bg-red-500/5 p-2 rounded break-all">
                        {error.error}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              加载失败
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]">
              关闭
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoItem({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === "-") return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-[#0a0f1a]/60 border-white/[0.06]">
      <CardContent className="p-4">
        <p className="text-slate-500 text-xs mb-1">{label}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-sm truncate flex-1">{value}</p>
          {copyable && value && value !== "-" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-auto p-1 text-slate-400 hover:text-white"
            >
              {copied ? "已复制" : "复制"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LogDetailItem({
  label,
  value,
  copyable = false,
  mono = false,
  statusCode,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
  statusCode?: number | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === "-") return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    if (!statusCode) return "text-slate-400";
    if (statusCode >= 200 && statusCode < 400) return "text-green-400";
    return "text-red-400";
  };

  return (
    <div className="bg-[#0a0f1a]/80 border border-white/[0.04] rounded-lg p-3">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className={cn(
          "text-sm break-all flex-1",
          mono ? "font-mono text-cyan-300" : "text-white",
          statusCode !== undefined && getStatusColor()
        )}>
          {value}
        </p>
        {copyable && value && value !== "-" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="h-auto p-1 text-slate-400 hover:text-white shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="ml-1 text-xs">{copied ? "已复制" : "复制"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function LogEntry({ log, onClick }: { log: RequestLog; onClick?: () => void }) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
    PATCH: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  const getStatusBadge = (compact = false) => {
    if (log.status === "pending") {
      return (
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-yellow-500"></span>
          </span>
          {compact ? "..." : "处理中"}
        </Badge>
      );
    }

    const statusCode = log.statusCode || 0;
    if (statusCode >= 200 && statusCode < 400) {
      return (
        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
          {statusCode}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
        {statusCode}
      </Badge>
    );
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
    const timeStr = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return { dateStr, timeStr };
  };

  return (
    <Card
      className={cn(
        "bg-[#0a0f1a]/60 border-white/[0.06]",
        onClick && "cursor-pointer hover:bg-white/[0.02] hover:border-white/[0.1] transition-colors"
      )}
      onClick={onClick}
    >
      <CardContent className="p-2.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Badge variant="outline" className={cn("font-mono text-[10px] sm:text-xs shrink-0", methodColors[log.requestMethod] || "text-slate-400")}>
              {log.requestMethod}
            </Badge>
            <span className="text-white text-xs sm:text-sm font-mono truncate flex-1">
              {log.requestPath}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 shrink-0">
            <span className="hidden sm:flex">{getStatusBadge()}</span>
            <span className="flex sm:hidden">{getStatusBadge(true)}</span>
            <span className="hidden sm:block w-16 text-right">{log.responseDurationMs !== null ? `${log.responseDurationMs}ms` : ''}</span>
            <span className="hidden md:block w-32 text-right text-slate-600">
              <span className="text-slate-700">{formatDateTime(log.requestTimestamp).dateStr}</span>
              {' '}
              {formatDateTime(log.requestTimestamp).timeStr}
            </span>
            <span className="hidden lg:block w-28 text-right text-slate-600 font-mono">{log.clientIp}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
