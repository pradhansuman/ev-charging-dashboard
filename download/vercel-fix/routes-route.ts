import { NextResponse } from 'next/server';
import { routes } from '@/lib/ev-data';

export async function GET() {
  try {
    const sorted = [...routes].sort((a, b) => a.safeTravelScore - b.safeTravelScore);

    const formatted = sorted.map(r => ({
      id: r.id,
      routeName: r.routeName,
      origin: r.origin,
      destination: r.destination,
      totalDistanceKm: r.totalDistanceKm,
      chargerCount: r.chargerCount,
      maxDistanceBetween: r.maxDistanceBetween,
      fastChargingAvailable: r.fastChargingAvailable,
      charging24x7: r.charging24x7,
      avgWaitingTimeMin: r.avgWaitingTimeMin,
      safeTravelScore: r.safeTravelScore,
      recommendedStops: r.recommendedStops,
      backupStations: r.backupStations,
      riskFactors: r.riskFactors,
    }));

    return NextResponse.json({ routes: formatted });
  } catch (error) {
    console.error('Routes API error:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}