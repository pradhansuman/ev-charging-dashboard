"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEVDashboard } from "@/hooks/use-ev-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Zap, MapPin, Activity, TrendingUp, AlertTriangle, Shield, Route,
  Building2, Radio, BatteryCharging, Car, Plug, Gauge, Map,
  ChevronRight, Clock, Wifi, WifiOff, Fuel, ShoppingBag, Hotel,
  Wrench, Hospital, ShieldAlert, TrainFront, Mountain, TreePine,
  Info, AlertCircle, CheckCircle2, XCircle, ArrowUpRight,
  FileText, BarChart3, Target, Users
} from "lucide-react";
import { SectionHeader } from "@/components/ev/section-header";
import { StatusBadge } from "@/components/ev/status-badge";
import { RiskScoreGauge } from "@/components/ev/risk-score-gauge";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend
} from "recharts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, refetchInterval: 120000 } }
});

const EV_COLORS = [
  "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899",
  "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#84cc16",
  "#e11d48", "#0ea5e9", "#d946ef", "#22c55e", "#a855f7",
];

function formatIST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string) {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return `${Math.floor(diffD / 7)}w ago`;
}

// ─── STAT CARD ───
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`rounded-lg p-2.5 ${color || "bg-emerald-100 text-emerald-700"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ALERT CARD ───
function AlertCard({ alert }: { alert: { type: string; severity: string; title: string; description: string; location: string; timestamp: string } }) {
  const severityConfig: Record<string, { bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
    critical: { bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50", border: "", icon: XCircle },
    warning: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50", border: "", icon: AlertTriangle },
    info: { bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900/50", border: "", icon: Info },
  };
  const cfg = severityConfig[alert.severity] || severityConfig.info;
  const Icon = cfg.icon;
  const iconColor = alert.severity === "critical" ? "text-red-500" : alert.severity === "warning" ? "text-amber-500" : "text-sky-500";

  return (
    <div className={`rounded-lg border p-3 ${cfg.bg} transition-colors`}>
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{alert.location}</span>
            <span className="mx-1">·</span>
            <Clock className="h-3 w-3" />
            <span>{timeAgo(alert.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STATION ROW ───
function StationRow({ s }: { s: Record<string, unknown> }) {
  const station = s as {
    name: string; operator: string; city: string; state: string;
    totalChargers: number; dcFastChargers: number; ultraFastChargers: number;
    is24x7: boolean; status: string; powerRatingsKW: string; dateOperational: string;
    highway?: string; ccs2Chargers: number; teslaCompatible: number; type2Chargers: number;
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
        <Plug className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{station.name}</p>
          {station.highway && <Badge variant="outline" className="text-[10px] px-1.5 py-0"><TrainFront className="h-2.5 w-2.5 mr-0.5" />{station.highway}</Badge>}
          {station.is24x7 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-600">24x7</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{station.operator} · {station.city}, {station.state}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-xs"><strong>{station.totalChargers}</strong> chargers</span>
          <span className="text-xs text-muted-foreground">DC: {station.dcFastChargers} · UF: {station.ultraFastChargers}</span>
          <span className="text-xs text-muted-foreground">{station.powerRatingsKW} kW</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <StatusBadge status={station.status} />
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(station.dateOperational)}</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───
function DashboardContent() {
  const { stats, allStations, allStationsTotal, newStations, newStationsTotal, offlineStations, offlineStationsTotal, alerts, routes, investments, deserts, isLoading } = useEVDashboard();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Zap className="h-8 w-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading EV Intelligence...</p>
        </div>
      </div>
    );
  }

  const s = stats.summary;

  const barChartConfig = {
    installations: { label: "Stations", color: "#10b981" },
    chargers: { label: "Chargers", color: "#f59e0b" },
  };

  const pieConfig: Record<string, { label: string; color: string }> = {};
  stats.chargerTypeDistribution.forEach((c, i) => { pieConfig[c.type] = { label: c.type, color: EV_COLORS[i] }; });

  const connConfig: Record<string, { label: string; color: string }> = {};
  stats.connectorDistribution.forEach((c, i) => { connConfig[c.type] = { label: c.type, color: EV_COLORS[i] }; });

  const stateChartConfig: Record<string, { label: string; color: string }> = {};
  stats.stateBreakdown.slice(0, 10).forEach((st, i) => { stateChartConfig[st.state] = { label: st.state, color: EV_COLORS[i % EV_COLORS.length] }; });

  const opChartConfig: Record<string, { label: string; color: string }> = {};
  stats.operatorMarketShare.forEach((op, i) => { opChartConfig[op.operator] = { label: op.operator, color: EV_COLORS[i % EV_COLORS.length] }; });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600 p-2 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">EV Charging Intelligence</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">India&apos;s Live Charging Infrastructure Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </Badge>
            <p className="text-[10px] text-muted-foreground hidden md:block">
              Updated: {formatIST(stats.lastUpdated)}
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 mb-6">
            {[
              { id: "overview", icon: Activity, label: "Overview" },
              { id: "analytics", icon: TrendingUp, label: "Analytics" },
              { id: "stations", icon: MapPin, label: "Stations" },
              { id: "alerts", icon: AlertTriangle, label: "Alerts" },
              { id: "routes", icon: Route, label: "Routes" },
              { id: "deserts", icon: Mountain, label: "Risk Zones" },
              { id: "invest", icon: Building2, label: "Investments" },
              { id: "reports", icon: FileText, label: "Reports" },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <t.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          <TabsContent value="overview" className="space-y-6">
            {/* New Station Highlights */}
            {(s.newToday > 0 || s.newThisWeek > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {s.newToday > 0 && (
                  <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                    <CardContent className="p-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-medium"><strong>{s.newToday}</strong> new station{s.newToday > 1 ? "s" : ""} activated today</p>
                    </CardContent>
                  </Card>
                )}
                {s.newThisWeek > 0 && (
                  <Card className="border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-900/40">
                    <CardContent className="p-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-sky-600" />
                      <p className="text-sm font-medium"><strong>{s.newThisWeek}</strong> new station{s.newThisWeek > 1 ? "s" : ""} this week</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <StatCard icon={MapPin} label="Total Locations" value={s.totalLocations} sub={`${s.operationalLocations} operational`} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" />
              <StatCard icon={Plug} label="Total Chargers" value={s.totalChargers} sub="Across all stations" color="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" />
              <StatCard icon={BatteryCharging} label="DC Fast Chargers" value={s.dcFastChargers} sub={`+ ${s.ultraFastChargers} Ultra Fast`} color="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" />
              <StatCard icon={Gauge} label="CCS2 Connectors" value={s.ccs2Chargers} sub="Dominant standard" color="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" />
              <StatCard icon={Clock} label="24x7 Stations" value={s.charging24x7} sub="Round-the-clock" color="bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400" />
              <StatCard icon={Zap} label="AC Chargers" value={s.acChargers} sub="Level 2" color="bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-400" />
              <StatCard icon={Car} label="Tesla-Compatible" value={s.teslaCompatible} sub="NACS/CCS2" color="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" />
              <StatCard icon={AlertTriangle} label="Offline Stations" value={s.offlineStations} sub="Attention needed" color="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" />
              <StatCard icon={TreePine} label="States Covered" value={stats.stateBreakdown.length} sub="Pan-India" color="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400" />
              <StatCard icon={ArrowUpRight} label="New This Month" value={s.newThisMonth} sub="Growing fast" color="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-400" />
            </div>

            {/* Quick Connector Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Connector Type Distribution</CardTitle>
                <CardDescription>Breakdown of charger connector standards across India</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {stats.connectorDistribution.map((c) => (
                    <div key={c.type} className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{c.count}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{c.type}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts + Top States */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Recent Alerts</CardTitle>
                      <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Latest infrastructure updates</CardDescription></Card>
                    </div>
                    <Badge variant="outline" className="text-xs">{alerts?.length || 0} active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-2 pr-3">
                      {(alerts || []).slice(0, 8).map((a) => (
                        <AlertCard key={a.id} alert={a} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top States by Infrastructure</CardTitle>
                  <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Charging locations per state</CardDescription></Card>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.stateBreakdown.slice(0, 8).map((st) => {
                      const maxStations = stats.stateBreakdown[0].stations;
                      const pct = Math.round((st.stations / maxStations) * 100);
                      return (
                        <div key={st.state} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{st.state}</span>
                            <span className="text-muted-foreground text-xs">{st.stations} locs · {st.chargers} chargers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Route Safety */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Route Safety at a Glance</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Major inter-city route safety scores</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(routes || []).map((r) => (
                    <div key={r.id} className="text-center p-3 rounded-lg border bg-card">
                      <RiskScoreGauge score={r.safeTravelScore} label={r.routeName} />
                      <p className="text-xs text-muted-foreground mt-1">{r.totalDistanceKm}km · {r.chargerCount} chargers</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ ANALYTICS TAB ═══════════ */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Growth Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Installation Trend</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>New charging stations and chargers added per month</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                  <BarChart data={stats.monthlyTrend} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="installations" fill="var(--color-installations)" radius={[4, 4, 0, 0]} name="Stations" />
                    <Bar dataKey="chargers" fill="var(--color-chargers)" radius={[4, 4, 0, 0]} name="Chargers" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Charger Type Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Charger Type Distribution</CardTitle>
                  <Card className="p-0 h-0 border-0 mt-0"><CardDescription>AC vs DC Fast vs Ultra Fast</CardDescription></Card>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={pieConfig} className="h-[280px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie data={stats.chargerTypeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="count" nameKey="type" paddingAngle={3} strokeWidth={0}>
                        {stats.chargerTypeDistribution.map((_, i) => (
                          <Cell key={i} fill={EV_COLORS[i]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Connector Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connector Standard Distribution</CardTitle>
                  <Card className="p-0 h-0 border-0 mt-0"><CardDescription>CCS2, Type-2, CHAdeMO, Bharat standards</CardDescription></Card>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={connConfig} className="h-[280px] w-full">
                    <BarChart data={stats.connectorDistribution} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={90} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" name="Connectors" radius={[0, 4, 4, 0]}>
                        {stats.connectorDistribution.map((_, i) => (
                          <Cell key={i} fill={EV_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* State-wise Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">State-wise Station Count</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Top states by number of charging locations</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <ChartContainer config={stateChartConfig} className="h-[350px] w-full">
                  <BarChart data={stats.stateBreakdown} layout="vertical" barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="state" tick={{ fontSize: 11 }} width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="stations" name="Locations" radius={[0, 4, 4, 0]}>
                      {stats.stateBreakdown.map((_, i) => (
                        <Cell key={i} fill={EV_COLORS[i % EV_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Operator Market Share */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Operator Market Share</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Market share by number of stations operated</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <ChartContainer config={opChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={stats.operatorMarketShare} cx="50%" cy="50%" outerRadius={110} dataKey="stations" nameKey="operator" paddingAngle={2} strokeWidth={0} label={({ operator, share }) => `${operator} (${share}%)`} labelLine={false}>
                      {stats.operatorMarketShare.map((_, i) => (
                        <Cell key={i} fill={EV_COLORS[i % EV_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* State Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Complete State-wise Breakdown</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Detailed statistics for all covered states</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">State</th>
                        <th className="text-center p-2 font-semibold">Locations</th>
                        <th className="text-center p-2 font-semibold">Chargers</th>
                        <th className="text-center p-2 font-semibold">DC Fast</th>
                        <th className="text-center p-2 font-semibold">Ultra Fast</th>
                        <th className="text-center p-2 font-semibold">DC Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.stateBreakdown.map((st) => (
                        <tr key={st.state} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-2 font-medium">{st.state}</td>
                          <td className="p-2 text-center">{st.stations}</td>
                          <td className="p-2 text-center">{st.chargers}</td>
                          <td className="p-2 text-center">{st.dcFast}</td>
                          <td className="p-2 text-center">{st.ultraFast}</td>
                          <td className="p-2 text-center">
                            <Badge variant={st.dcFast / st.chargers > 0.3 ? "default" : "outline"} className="text-xs">
                              {Math.round((st.dcFast / st.chargers) * 100)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ STATIONS TAB ═══════════ */}
          <TabsContent value="stations" className="space-y-6">
            {/* Filter badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs cursor-pointer">All ({allStationsTotal || 0})</Badge>
              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer">New This Month ({newStationsTotal || 0})</Badge>
              <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 cursor-pointer">Offline ({offlineStationsTotal || 0})</Badge>
            </div>

            {/* New Stations */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader title="Recently Commissioned Stations" subtitle="New charging stations added this month" icon={<Zap className="h-4 w-4 text-emerald-500" />} />
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-1">
                    {(newStations || []).map((st) => (
                      <StationRow key={st.id} s={st as unknown as Record<string, unknown>} />
                    ))}
                    {(newStations || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No new stations this month</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Offline/Closed */}
            {(offlineStations || []).length > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <SectionHeader title="Offline / Under Maintenance" subtitle="Stations currently unavailable" icon={<AlertCircle className="h-4 w-4 text-amber-500" />} />
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-1">
                      {(offlineStations || []).map((st) => (
                        <StationRow key={st.id} s={st as unknown as Record<string, unknown>} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* All Stations */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader title="All Charging Stations" subtitle={`Showing ${(allStations || []).length} stations`} icon={<MapPin className="h-4 w-4" />} />
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-1">
                    {(allStations || []).map((st) => (
                      <StationRow key={st.id} s={st as unknown as Record<string, unknown>} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ ALERTS TAB ═══════════ */}
          <TabsContent value="alerts" className="space-y-6">
            {/* Alert summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard icon={Info} label="Info Alerts" value={(alerts || []).filter(a => a.severity === "info").length} color="bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400" />
              <StatCard icon={AlertTriangle} label="Warnings" value={(alerts || []).filter(a => a.severity === "warning").length} color="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" />
              <StatCard icon={XCircle} label="Critical" value={(alerts || []).filter(a => a.severity === "critical").length} color="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <SectionHeader title="All Active Alerts" subtitle="Real-time infrastructure monitoring alerts" icon={<Radio className="h-4 w-4 text-emerald-500" />} />
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-2 pr-3">
                    {(alerts || []).map((a) => (
                      <AlertCard key={a.id} alert={a} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ ROUTES TAB ═══════════ */}
          <TabsContent value="routes" className="space-y-6">
            <SectionHeader title="Route Risk Analysis" subtitle="Safety scores and charging availability for major Indian routes" icon={<Route className="h-5 w-5 text-emerald-500" />} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(routes || []).map((r) => {
                const scoreColor = r.safeTravelScore >= 80 ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40" :
                  r.safeTravelScore >= 50 ? "border-amber-200 bg-amber-50/30 dark:border-amber-900/40" :
                    "border-red-200 bg-red-50/30 dark:border-red-900/40";
                const scoreLabel = r.safeTravelScore >= 80 ? "SAFE" : r.safeTravelScore >= 50 ? "CAUTION" : "RISKY";
                const scoreLabelColor = r.safeTravelScore >= 80 ? "text-emerald-600" : r.safeTravelScore >= 50 ? "text-amber-600" : "text-red-600";

                return (
                  <Card key={r.id} className={`border ${scoreColor}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{r.routeName}</CardTitle>
                        <Badge variant="outline" className={scoreLabelColor}>{scoreLabel}</Badge>
                      </div>
                      <Card className="p-0 h-0 border-0 mt-0"><CardDescription>{r.origin} → {r.destination} · {r.totalDistanceKm} km</CardDescription></Card>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <RiskScoreGauge score={r.safeTravelScore} />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Wait Time</p>
                          <p className="text-sm font-semibold">{r.avgWaitingTimeMin || "N/A"} min</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Chargers:</span> <strong>{r.chargerCount}</strong>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Max Gap:</span> <strong>{r.maxDistanceBetween} km</strong>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Fast Charge:</span> <strong>{r.fastChargingAvailable ? "Yes" : "No"}</strong>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">24x7:</span> <strong>{r.charging24x7 ? "Yes" : "No"}</strong>
                        </div>
                      </div>
                      {r.recommendedStops && (
                        <div>
                          <p className="text-xs font-semibold mb-1 flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Recommended Stops</p>
                          <p className="text-xs text-muted-foreground">{r.recommendedStops}</p>
                        </div>
                      )}
                      {r.riskFactors && (
                        <div className={`p-2 rounded text-xs ${r.safeTravelScore < 50 ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"}`}>
                          <strong>Risk:</strong> {r.riskFactors}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════════ DESERTS / RISK ZONES TAB ═══════════ */}
          <TabsContent value="deserts" className="space-y-6">
            <SectionHeader title="Charging Desert Areas" subtitle="High-risk zones with minimal or no EV charging infrastructure" icon={<Mountain className="h-5 w-5 text-red-500" />} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(deserts || []).map((d) => {
                const riskColor = d.riskLevel === "critical" ? "border-red-300 bg-red-50/40 dark:bg-red-950/20 dark:border-red-900/50" :
                  d.riskLevel === "high" ? "border-orange-300 bg-orange-50/40 dark:bg-orange-950/20 dark:border-orange-900/50" :
                    "border-amber-200 bg-amber-50/30 dark:border-amber-900/40";
                const riskBadge = d.riskLevel === "critical" ? "bg-red-600 text-white" :
                  d.riskLevel === "high" ? "bg-orange-500 text-white" : "bg-amber-500 text-white";

                return (
                  <Card key={d.id} className={`border ${riskColor}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{d.location}</CardTitle>
                        <Badge className={riskBadge}>{d.riskLevel.toUpperCase()}</Badge>
                      </div>
                      <Card className="p-0 h-0 border-0 mt-0"><CardDescription>{d.state}</CardDescription></Card>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Nearest Charger</p>
                          <p className="font-semibold text-sm">{d.nearestCharger}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Distance</p>
                          <p className="font-semibold text-sm">{d.nearestChargerDistanceKm} km</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Road Condition</p>
                          <p className="font-semibold">{d.roadCondition}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Mobile Network</p>
                          <p className="font-semibold">{d.mobileNetwork}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-red-50 dark:bg-red-950/30">
                          <p className="text-muted-foreground">Min Battery</p>
                          <p className="font-bold text-red-600 text-lg">{d.recommendedBatteryPct}%</p>
                        </div>
                        <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30">
                          <p className="text-muted-foreground">Min Range</p>
                          <p className="font-bold text-amber-600 text-lg">{d.recommendedMinRangeKm} km</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><Hotel className="h-3 w-3" />{d.nearbyHotels} hotels</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><Wrench className="h-3 w-3" />{d.nearbyRepairShops} repair</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><Hospital className="h-3 w-3" />{d.nearbyHospitals} hospitals</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><ShieldAlert className="h-3 w-3" />Police: {d.policeStationDistanceKm}km</div>
                      </div>
                      {d.emergencyChargingAlt && (
                        <p className="text-xs p-2 rounded bg-muted/50"><strong>Emergency Alt:</strong> {d.emergencyChargingAlt}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {d.towingAvailable ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Towing Available</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-red-600 border-red-300">No Towing</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════════ INVESTMENTS TAB ═══════════ */}
          <TabsContent value="invest" className="space-y-6">
            <SectionHeader title="Investment Opportunities" subtitle="AI-identified locations with high potential for new EV charging stations" icon={<Building2 className="h-5 w-5 text-emerald-500" />} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(investments || []).map((inv) => {
                const roiColor = inv.roiPotential === "very_high" ? "bg-emerald-600 text-white" :
                  inv.roiPotential === "high" ? "bg-emerald-500 text-white" :
                    inv.roiPotential === "medium" ? "bg-amber-500 text-white" : "bg-gray-500 text-white";
                const trafficColor = inv.trafficDensity === "very_high" ? "text-red-600" :
                  inv.trafficDensity === "high" ? "text-amber-600" : "text-emerald-600";

                return (
                  <Card key={inv.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{inv.location}</CardTitle>
                        <Badge className={roiColor}>{inv.roiPotential.replace("_", " ").toUpperCase()}</Badge>
                      </div>
                      <Card className="p-0 h-0 border-0 mt-0"><CardDescription>{inv.city}, {inv.state}</CardDescription></Card>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Priority Score Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Priority Score</span>
                          <span className="font-bold">{inv.priorityScore}/100</span>
                        </div>
                        <Progress value={inv.priorityScore} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Traffic Density</p>
                          <p className={`font-semibold ${trafficColor}`}>{inv.trafficDensity.replace("_", " ")}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">EV Population</p>
                          <p className="font-semibold">{inv.evPopulation.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Nearest Charger</p>
                          <p className="font-semibold">{inv.existingChargerDist} km</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Expected Util.</p>
                          <p className="font-semibold">{Math.round(inv.expectedUtilization * 100)}%</p>
                        </div>
                      </div>

                      {inv.tourismPotential && (
                        <Badge variant="outline" className="text-[10px]"><Mountain className="h-3 w-3 mr-1" />Tourism Potential</Badge>
                      )}

                      <div className="grid grid-cols-3 gap-1.5 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><ShoppingBag className="h-3 w-3" />{inv.nearbyRestaurants} food</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><Fuel className="h-3 w-3" />{inv.nearbyFuelStations} fuel</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><ShoppingBag className="h-3 w-3" />{inv.nearbyMalls} malls</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><Hotel className="h-3 w-3" />{inv.nearbyHotels} hotels</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><Car className="h-3 w-3" />{inv.nearbyParking} parking</div>
                        <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded"><MapPin className="h-3 w-3" />{inv.state}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════════ REPORTS TAB ═══════════ */}
          <TabsContent value="reports" className="space-y-6">
            <SectionHeader title="Infrastructure Reports" subtitle="Generated summaries covering national EV charging statistics, growth, and recommendations" icon={<FileText className="h-5 w-5 text-emerald-500" />} />

            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Executive Summary</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>High-level overview of India's EV charging infrastructure as of {formatIST(stats.lastUpdated)}</CardDescription></Card>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  India currently operates <strong className="text-foreground">{s.totalLocations} public EV charging locations</strong> across {stats.stateBreakdown.length} states and union territories, hosting a total of <strong className="text-foreground">{s.totalChargers} individual chargers</strong>. Of these, <strong className="text-foreground">{s.dcFastChargers} DC fast chargers</strong> (including {s.ultraFastChargers} ultra-fast 120kW+ units) provide rapid charging capabilities, while {s.acChargers} AC chargers serve as level-2 destinations for longer dwell times. The CCS2 connector remains the dominant standard with {s.ccs2Chargers} connectors deployed, followed by Type-2 ({s.type2Chargers}) and Bharat AC001 ({s.bharatAC001}). Tesla-compatible charging is available at {s.teslaCompatible} locations nationwide, signaling growing NACS/CCS2 interoperability.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This month has seen <strong className="text-foreground">{s.newThisMonth} newly commissioned stations</strong>, with {s.newThisWeek} activated in the past 7 days and {s.newToday} going live today. While the growth trajectory is encouraging, <strong className="text-foreground">{s.offlineStations} station{ s.offlineStations !== 1 ? 's are' : ' is' } currently offline</strong> requiring attention. Approximately {Math.round((s.charging24x7 / s.operationalLocations) * 100)}% of operational stations offer 24x7 charging, a critical factor for inter-city EV travel confidence.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Maharashtra leads all states with {stats.stateBreakdown[0]?.stations || 0} charging locations, followed by {stats.stateBreakdown[1]?.state || 'N/A'} ({stats.stateBreakdown[1]?.stations || 0}) and {stats.stateBreakdown[2]?.state || 'N/A'} ({stats.stateBreakdown[2]?.stations || 0}). However, significant charging deserts persist in Leh-Ladakh, Spiti Valley, Rajasthan desert routes, and the Kolkata-Bhubaneswar corridor, posing challenges for long-distance EV adoption.
                </p>
              </CardContent>
            </Card>

            {/* Growth Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold">{s.newThisMonth}</p>
                  <p className="text-xs text-muted-foreground">New This Month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto text-sky-500 mb-2" />
                  <p className="text-2xl font-bold">{Math.round((s.newThisMonth / Math.max(s.totalLocations - s.newThisMonth, 1)) * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Monthly Growth Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 mx-auto text-amber-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.operatorMarketShare.length}</p>
                  <p className="text-xs text-muted-foreground">Active Operators</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-5 w-5 mx-auto text-violet-500 mb-2" />
                  <p className="text-2xl font-bold">{Math.round((s.dcFastChargers / Math.max(s.totalChargers, 1)) * 100)}%</p>
                  <p className="text-xs text-muted-foreground">DC Fast Ratio</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">12-Month Growth Trajectory</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Cumulative station and charger additions over the past year</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                  <AreaChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="installations" stroke="#10b981" fill="#10b98133" name="Stations" />
                    <Area type="monotone" dataKey="chargers" stroke="#f59e0b" fill="#f59e0b33" name="Chargers" />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* State Rankings Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">State Rankings by Infrastructure Density</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>All states ranked by number of operational charging locations, DC fast ratio, and growth indicators</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">#</th>
                        <th className="text-left p-2 font-semibold">State</th>
                        <th className="text-center p-2 font-semibold">Locations</th>
                        <th className="text-center p-2 font-semibold">Chargers</th>
                        <th className="text-center p-2 font-semibold">DC Fast</th>
                        <th className="text-center p-2 font-semibold">Ultra Fast</th>
                        <th className="text-center p-2 font-semibold">DC %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.stateBreakdown.map((st, idx) => (
                        <tr key={st.state} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-2 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                          <td className="p-2 font-medium">{st.state}</td>
                          <td className="p-2 text-center tabular-nums">{st.stations}</td>
                          <td className="p-2 text-center tabular-nums">{st.chargers}</td>
                          <td className="p-2 text-center tabular-nums">{st.dcFast}</td>
                          <td className="p-2 text-center tabular-nums">{st.ultraFast}</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Progress value={Math.round((st.dcFast / Math.max(st.chargers, 1)) * 100)} className="h-1.5 w-12" />
                              <span className="text-xs tabular-nums w-8 text-right">{Math.round((st.dcFast / Math.max(st.chargers, 1)) * 100)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Operators Report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Charging Network Operators</CardTitle>
                <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Market share breakdown by number of stations and chargers deployed</CardDescription></Card>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.operatorMarketShare.map((op, idx) => (
                    <div key={op.operator} className="flex items-center gap-4">
                      <span className="text-sm font-bold text-muted-foreground w-6 text-right">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{op.operator}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{op.stations} locs · {op.chargers} chargers · {op.share}%</span>
                        </div>
                        <Progress value={op.share} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coverage & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Coverage Analysis</CardTitle>
                  <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Assessment of charging infrastructure coverage across India</CardDescription></Card>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">States with Stations</span>
                      <span className="font-semibold">{stats.stateBreakdown.length} / 36</span>
                    </div>
                    <Progress value={Math.round((stats.stateBreakdown.length / 36) * 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">24x7 Availability</span>
                      <span className="font-semibold">{Math.round((s.charging24x7 / Math.max(s.operationalLocations, 1)) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((s.charging24x7 / Math.max(s.operationalLocations, 1)) * 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">DC Fast Ratio</span>
                      <span className="font-semibold">{Math.round((s.dcFastChargers / Math.max(s.totalChargers, 1)) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((s.dcFastChargers / Math.max(s.totalChargers, 1)) * 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Operational Rate</span>
                      <span className="font-semibold">{Math.round((s.operationalLocations / Math.max(s.totalLocations, 1)) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((s.operationalLocations / Math.max(s.totalLocations, 1)) * 100)} className="h-2" />
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">Charging deserts identified: <strong>{deserts.length} high-risk zones</strong>. Unsafe routes (score &lt;50): <strong>{routes.filter(r => r.safeTravelScore < 50).length} routes</strong>.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Infrastructure Recommendations</CardTitle>
                  <Card className="p-0 h-0 border-0 mt-0"><CardDescription>Priority actions to improve EV charging coverage in India</CardDescription></Card>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 text-sm">
                    {[
                      { label: 'Urgent: Deploy chargers on Kolkata-Bhubaneswar NH16 corridor (350km gap)', color: 'text-red-600' },
                      { label: 'Urgent: Add charging on Chennai-Kochi NH544 stretch (550km gap)', color: 'text-red-600' },
                      { label: 'High: Increase 24x7 stations — target 80% from current ' + Math.round((s.charging24x7 / Math.max(s.operationalLocations, 1)) * 100) + '%', color: 'text-amber-600' },
                      { label: 'High: Deploy ultra-fast chargers on Mumbai-Ahmedabad NH48 (250km gap)', color: 'text-amber-600' },
                      { label: 'Medium: Expand into Northeast — only ' + stats.stateBreakdown.filter(st => ['Assam', 'Meghalaya', 'Nagaland'].includes(st.state)).reduce((sum, st) => sum + st.stations, 0) + ' stations', color: 'text-sky-600' },
                      { label: 'Medium: Add CCS2 connectors at older Bharat DC001 stations', color: 'text-sky-600' },
                      { label: 'Low: Standardize Tesla NACS compatibility across all DC stations', color: 'text-muted-foreground' },
                      { label: 'Low: Deploy solar-powered chargers in Rajasthan desert areas', color: 'text-muted-foreground' },
                    ].map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${rec.color}`} />
                        <span className="text-muted-foreground leading-snug">{rec.label}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Data Sources & Confidence */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Report Metadata</p>
                    <p>Generated: {formatIST(stats.lastUpdated)} IST</p>
                    <p>Confidence Score: <Badge variant="outline" className="text-[10px] ml-1">85%</Badge></p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground mb-1">Data Sources</p>
                    <p>Government Portals, Open Charge Map, Operator APIs,</p>
                    <p>PlugShare, Google Maps, Press Releases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* FOOTER */}
        <footer className="mt-12 pt-6 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>EV Charging Intelligence Agent — India | Data Sources: Government Portals, Open Charge Map, Operator APIs, Google Maps</p>
            <p>Confidence Score: 85% | Auto-refresh every 2 minutes</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function EVDashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}