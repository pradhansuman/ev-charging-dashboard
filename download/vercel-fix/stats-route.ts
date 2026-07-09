import { NextResponse } from 'next/server';
import { stations } from '@/lib/ev-data';

export async function GET() {
  try {
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
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + istOffset);
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
      stateMap[s.state].stations++;
      stateMap[s.state].chargers += s.totalChargers;
      stateMap[s.state].dcFast += s.dcFastChargers;
      stateMap[s.state].ultraFast += s.ultraFastChargers;
    }
    const stateBreakdown = Object.entries(stateMap).map(([state, data]) => ({
      state,
      ...data
    })).sort((a, b) => b.stations - a.stations);

    const operatorMap: Record<string, { stations: number; chargers: number }> = {};
    for (const s of operational) {
      if (!operatorMap[s.operator]) operatorMap[s.operator] = { stations: 0, chargers: 0 };
      operatorMap[s.operator].stations++;
      operatorMap[s.operator].chargers += s.totalChargers;
    }
    const operatorMarketShare = Object.entries(operatorMap).map(([operator, data]) => ({
      operator,
      ...data,
      share: Math.round((data.stations / operational.length) * 100)
    })).sort((a, b) => b.stations - a.stations);

    const monthlyTrend: { month: string; installations: number; chargers: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const mStart = new Date(istNow.getFullYear(), istNow.getMonth() - i, 1);
      const mEnd = new Date(istNow.getFullYear(), istNow.getMonth() - i + 1, 1);
      const monthStations = stations.filter(s => {
        const d = new Date(s.dateOperational);
        return d >= mStart && d < mEnd;
      });
      const monthLabel = mStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthlyTrend.push({
        month: monthLabel,
        installations: monthStations.length,
        chargers: monthStations.reduce((sum, s) => sum + s.totalChargers, 0)
      });
    }

    const chargerTypeDistribution = [
      { type: 'AC Chargers', count: totalAC },
      { type: 'DC Fast (≤60kW)', count: totalDC },
      { type: 'Ultra Fast (120kW+)', count: totalUltraFast },
    ].filter(c => c.count > 0);

    const connectorDistribution = [
      { type: 'CCS2', count: totalCCS2 },
      { type: 'Type-2', count: totalType2 },
      { type: 'CHAdeMO', count: totalChademo },
      { type: 'Bharat AC001', count: totalBharatAC },
      { type: 'Bharat DC001', count: totalBharatDC },
      { type: 'GB/T', count: totalGBT },
      { type: 'Tesla', count: totalTesla },
    ].filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      lastUpdated: istNow.toISOString(),
      summary: {
        totalLocations,
        totalChargers,
        operationalLocations: operational.length,
        acChargers: totalAC,
        dcFastChargers: totalDC,
        ultraFastChargers: totalUltraFast,
        ccs2Chargers: totalCCS2,
        chademoChargers: totalChademo,
        gbtChargers: totalGBT,
        type2Chargers: totalType2,
        bharatAC001: totalBharatAC,
        bharatDC001: totalBharatDC,
        teslaCompatible: totalTesla,
        newToday,
        newThisWeek,
        newThisMonth,
        offlineStations: offlineStations.length,
        closedStations: closedStations.length,
        charging24x7,
      },
      stateBreakdown,
      operatorMarketShare,
      monthlyTrend,
      chargerTypeDistribution,
      connectorDistribution,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}