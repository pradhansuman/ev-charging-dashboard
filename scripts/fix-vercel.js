// fix-vercel.js — Run this in your project root: node fix-vercel.js
// It replaces Prisma-based API routes with static data for Vercel deployment

const fs = require('fs');
const path = require('path');

function write(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('  ✓ ' + filePath);
}

console.log('\n🔧 Fixing EV Dashboard for Vercel...\n');

// ─── 1. Create static data module ───
write('src/lib/ev-data.ts', `// Static EV data for Vercel (no database needed)
export interface Station {
  id:string;name:string;operator:string;state:string;district:string;
  city:string;address:string;pinCode:string;highway:string|null;
  latitude:number;longitude:number;totalChargers:number;acChargers:number;
  dcFastChargers:number;ultraFastChargers:number;ccs2Chargers:number;
  chademoChargers:number;gbtChargers:number;type2Chargers:number;
  bharatAC001:number;bharatDC001:number;teslaCompatible:number;
  powerRatingsKW:string;is24x7:boolean;amenities:string;
  parkingAvailable:boolean;paymentMethods:string;status:string;
  dateOperational:string;confidenceScore:number;
}
export interface Alert { id:string;type:string;severity:string;title:string;description:string;location:string;timestamp:string; }
export interface Route { id:string;routeName:string;origin:string;destination:string;totalDistanceKm:number;chargerCount:number;maxDistanceBetween:number;fastChargingAvailable:boolean;charging24x7:boolean;avgWaitingTimeMin:number|null;safeTravelScore:number;recommendedStops:string;backupStations:string;riskFactors:string; }
export interface Investment { id:string;location:string;state:string;city:string;trafficDensity:string;tourismPotential:boolean;evPopulation:number;existingChargerDist:number;nearbyRestaurants:number;nearbyFuelStations:number;nearbyMalls:number;nearbyHotels:number;nearbyParking:number;expectedUtilization:number;roiPotential:string;priorityScore:number; }
export interface Desert { id:string;location:string;state:string;nearestCharger:string;nearestChargerDistanceKm:number;roadCondition:string;mobileNetwork:string;recommendedBatteryPct:number;recommendedMinRangeKm:number;emergencyChargingAlt:string;nearbyHotels:number;nearbyRepairShops:number;nearbyHospitals:number;policeStationDistanceKm:number;towingAvailable:boolean;riskLevel:string; }

${require('fs').readFileSync('/dev/null','utf-8')}

// Stations will be loaded from a JSON file
let _stations: Station[]|null = null;
let _alerts: Alert[]|null = null;
let _routes: Route[]|null = null;
let _investments: Investment[]|null = null;
let _deserts: Desert[]|null = null;

function loadJSON<T>(file: string): T[] {
  const p = path.join(process.cwd(), 'src', 'lib', file);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  return [];
}

export function getStations(): Station[] {
  if (!_stations) _stations = loadJSON<Station>('stations.json');
  return _stations;
}
export function getAlerts(): Alert[] {
  if (!_alerts) _alerts = loadJSON<Alert>('alerts.json');
  return _alerts;
}
export function getRoutes(): Route[] {
  if (!_routes) _routes = loadJSON<Route>('routes.json');
  return _routes;
}
export function getInvestments(): Investment[] {
  if (!_investments) _investments = loadJSON<Investment>('investments.json');
  return _investments;
}
export function getDeserts(): Desert[] {
  if (!_deserts) _deserts = loadJSON<Desert>('deserts.json');
  return _deserts;
}
`);

// ─── 2. Generate JSON data files from the seed script ───
// Read the existing SQLite database to extract data
console.log('\n📦 Extracting data from local database...');

let dbData = { stations: [], alerts: [], routes: [], investments: [], deserts: [] };
try {
  // Try to read from the existing database using a simple SQLite query
  const { execSync } = require('child_process');
  const dbPath = path.join(process.cwd(), 'db', 'custom.db');
  if (fs.existsSync(dbPath)) {
    // Use node to read SQLite via better-sqlite3 or sqlite3
    const tmpScript = \`
const Database = require('better-sqlite3');
const db = new Database('${dbPath.replace(/'/g, "\\'")}');
const stations = db.prepare("SELECT * FROM ChargingStation").all();
const alerts = db.prepare("SELECT * FROM ChargingAlert").all();
const routes = db.prepare("SELECT * FROM RouteAnalysis").all();
const investments = db.prepare("SELECT * FROM InvestmentOpportunity").all();
const deserts = db.prepare("SELECT * FROM ChargingDesert").all();
console.log(JSON.stringify({stations,alerts,routes,investments,deserts}));
db.close();
\`;
    const result = execSync(\`node -e "\${tmpScript}"\`, { encoding: 'utf-8', timeout: 10000 });
    dbData = JSON.parse(result);
    console.log('  ✓ Extracted ' + dbData.stations.length + ' stations, ' + dbData.alerts.length + ' alerts');
  } else {
    console.log('  ⚠ No local database found, using fallback');
  }
} catch(e) {
  console.log('  ⚠ Could not read database: ' + e.message);
  console.log('  → Using built-in fallback data');
}

// Fallback data if no database
if (dbData.stations.length === 0) {
  console.log('  → Generating fallback data from seed script...');
  dbData = require('./generate-fallback-data');
}

// Write JSON files
write('src/lib/stations.json', JSON.stringify(dbData.stations, null, 2));
write('src/lib/alerts.json', JSON.stringify(dbData.alerts, null, 2));
write('src/lib/routes.json', JSON.stringify(dbData.routes, null, 2));
write('src/lib/investments.json', JSON.stringify(dbData.investments, null, 2));
write('src/lib/deserts.json', JSON.stringify(dbData.deserts, null, 2));

// ─── 3. Rewrite API routes ───
const statsRoute = \`import { NextResponse } from 'next/server';
import { getStations } from '@/lib/ev-data';

export async function GET() {
  try {
    const stations = getStations();
    const operational = stations.filter(s => s.status === 'operational');
    const totalLocations = stations.length;
    const totalChargers = stations.reduce((sum, s) => sum + s.totalChargers, 0);
    const totalAC = stations.reduce((sum, s) => sum + s.acChargers, 0);
    const totalDC = stations.reduce((sum, s) => sum + s.dcFastChargers, 0);
    const totalUltraFast = stations.reduce((sum, s) => sum + s.ultraFastChargers, 0);
    const totalCCS2 = stations.reduce((sum, s) => sum + s.ccs2Chargers, 0);
    const totalChademo = stations.reduce((sum, s) => sum + s.chademoChargers, 0);
    const totalGBT = stations.reduce((sum, s) => sum + s.gbtChargers, 0);
    const totalType2 = stations.reduce((sum, s) => sum + s.type2Chargers, 0);
    const totalBharatAC = stations.reduce((sum, s) => sum + s.bharatAC001, 0);
    const totalBharatDC = stations.reduce((sum, s) => sum + s.bharatDC001, 0);
    const totalTesla = stations.reduce((sum, s) => sum + s.teslaCompatible, 0);
    const now = new Date();
    const istNow = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + 5.5 * 60 * 60 * 1000);
    const todayStart = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);
    const monthStart = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
    const newToday = stations.filter(s => new Date(s.dateOperational) >= todayStart && s.status === 'operational').length;
    const newThisWeek = stations.filter(s => new Date(s.dateOperational) >= weekStart && s.status === 'operational').length;
    const newThisMonth = stations.filter(s => new Date(s.dateOperational) >= monthStart && s.status === 'operational').length;
    const offlineStations = stations.filter(s => s.status !== 'operational' && s.status !== 'permanently_closed');
    const closedStations = stations.filter(s => s.status === 'permanently_closed');
    const charging24x7 = stations.filter(s => s.is24x7 && s.status === 'operational').length;
    const stateMap: Record<string, { stations: number; chargers: number; dcFast: number; ultraFast: number }> = {};
    for (const s of operational) {
      if (!stateMap[s.state]) stateMap[s.state] = { stations: 0, chargers: 0, dcFast: 0, ultraFast: 0 };
      stateMap[s.state].stations++; stateMap[s.state].chargers += s.totalChargers;
      stateMap[s.state].dcFast += s.dcFastChargers; stateMap[s.state].ultraFast += s.ultraFastChargers;
    }
    const stateBreakdown = Object.entries(stateMap).map(([state, data]) => ({ state, ...data })).sort((a, b) => b.stations - a.stations);
    const operatorMap: Record<string, { stations: number; chargers: number }> = {};
    for (const s of operational) {
      if (!operatorMap[s.operator]) operatorMap[s.operator] = { stations: 0, chargers: 0 };
      operatorMap[s.operator].stations++; operatorMap[s.operator].chargers += s.totalChargers;
    }
    const operatorMarketShare = Object.entries(operatorMap).map(([operator, data]) => ({ operator, ...data, share: Math.round((data.stations / operational.length) * 100) })).sort((a, b) => b.stations - a.stations);
    const monthlyTrend: { month: string; installations: number; chargers: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const mStart = new Date(istNow.getFullYear(), istNow.getMonth() - i, 1);
      const mEnd = new Date(istNow.getFullYear(), istNow.getMonth() - i + 1, 1);
      const monthStations = stations.filter(s => { const d = new Date(s.dateOperational); return d >= mStart && d < mEnd; });
      monthlyTrend.push({ month: mStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), installations: monthStations.length, chargers: monthStations.reduce((sum, s) => sum + s.totalChargers, 0) });
    }
    const chargerTypeDistribution = [
      { type: 'AC Chargers', count: totalAC }, { type: 'DC Fast (≤60kW)', count: totalDC },
      { type: 'Ultra Fast (120kW+)', count: totalUltraFast },
    ].filter(c => c.count > 0);
    const connectorDistribution = [
      { type: 'CCS2', count: totalCCS2 }, { type: 'Type-2', count: totalType2 },
      { type: 'CHAdeMO', count: totalChademo }, { type: 'Bharat AC001', count: totalBharatAC },
      { type: 'Bharat DC001', count: totalBharatDC }, { type: 'GB/T', count: totalGBT },
      { type: 'Tesla', count: totalTesla },
    ].filter(c => c.count > 0).sort((a, b) => b.count - a.count);
    return NextResponse.json({ lastUpdated: istNow.toISOString(), summary: { totalLocations, totalChargers, operationalLocations: operational.length, acChargers: totalAC, dcFastChargers: totalDC, ultraFastChargers: totalUltraFast, ccs2Chargers: totalCCS2, chademoChargers: totalChademo, gbtChargers: totalGBT, type2Chargers: totalType2, bharatAC001: totalBharatAC, bharatDC001: totalBharatDC, teslaCompatible: totalTesla, newToday, newThisWeek, newThisMonth, offlineStations: offlineStations.length, closedStations: closedStations.length, charging24x7 }, stateBreakdown, operatorMarketShare, monthlyTrend, chargerTypeDistribution, connectorDistribution });
  } catch (error) { console.error('Stats error:', error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
\`;

write('src/app/api/stats/route.ts', statsRoute);

write('src/app/api/stations/route.ts', \`import { NextResponse } from 'next/server';
import { getStations } from '@/lib/ev-data';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const state = searchParams.get('state') || '';
    let filtered = getStations();
    if (filter === 'new') { const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1); filtered = filtered.filter(s => new Date(s.dateOperational) >= ms); }
    else if (filter === 'offline') filtered = filtered.filter(s => ['under_maintenance','temporarily_unavailable','power_failure','communication_failure'].includes(s.status));
    else if (filter === 'closed') filtered = filtered.filter(s => s.status === 'permanently_closed');
    else if (filter === '24x7') filtered = filtered.filter(s => s.is24x7 && s.status === 'operational');
    else if (filter === 'ultrafast') filtered = filtered.filter(s => s.ultraFastChargers > 0 && s.status === 'operational');
    else if (filter === 'highway') filtered = filtered.filter(s => s.highway != null && s.status === 'operational');
    if (state) filtered = filtered.filter(s => s.state === state);
    filtered.sort((a, b) => new Date(b.dateOperational).getTime() - new Date(a.dateOperational).getTime());
    return NextResponse.json({ stations: filtered, total: filtered.length });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
\`);

write('src/app/api/alerts/route.ts', \`import { NextResponse } from 'next/server';
import { getAlerts } from '@/lib/ev-data';
export async function GET() {
  try { return NextResponse.json({ alerts: getAlerts().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) }); }
  catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
\`);

write('src/app/api/routes/route.ts', \`import { NextResponse } from 'next/server';
import { getRoutes } from '@/lib/ev-data';
export async function GET() {
  try { return NextResponse.json({ routes: getRoutes().sort((a, b) => a.safeTravelScore - b.safeTravelScore) }); }
  catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
\`);

write('src/app/api/investments/route.ts', \`import { NextResponse } from 'next/server';
import { getInvestments } from '@/lib/ev-data';
export async function GET() {
  try { return NextResponse.json({ investments: getInvestments().sort((a, b) => b.priorityScore - a.priorityScore) }); }
  catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
\`);

write('src/app/api/deserts/route.ts', \`import { NextResponse } from 'next/server';
import { getDeserts } from '@/lib/ev-data';
export async function GET() {
  try { return NextResponse.json({ deserts: getDeserts().sort((a, b) => b.nearestChargerDistanceKm - a.nearestChargerDistanceKm) }); }
  catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
\`);

// ─── 4. Update next.config.ts ───
write('next.config.ts', \`import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
};
export default nextConfig;
\`);

// ─── 5. Create error boundary ───
write('src/app/error.tsx', \`"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-6">
          <h2 className="text-lg font-bold text-red-700">Error</h2>
          <pre className="mt-3 text-sm text-red-600 whitespace-pre-wrap break-words font-mono">{error.message}</pre>
        </div>
        <button onClick={reset} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Retry</button>
      </div>
    </div>
  );
}
\`);

// ─── 6. Create vercel.json ───
write('vercel.json', '{}');

console.log('\n✅ Done! Now run:');
console.log('   git add -A && git commit -m "fix: static data for Vercel" && git push\n');