import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const deserts = await db.chargingDesert.findMany({
      orderBy: { nearestChargerDistanceKm: 'desc' },
    });

    const formatted = deserts.map(d => ({
      id: d.id,
      location: d.location,
      state: d.state,
      nearestCharger: d.nearestCharger,
      nearestChargerDistanceKm: d.nearestChargerDistanceKm,
      roadCondition: d.roadCondition,
      mobileNetwork: d.mobileNetwork,
      recommendedBatteryPct: d.recommendedBatteryPct,
      recommendedMinRangeKm: d.recommendedMinRangeKm,
      emergencyChargingAlt: d.emergencyChargingAlt,
      nearbyHotels: d.nearbyHotels,
      nearbyRepairShops: d.nearbyRepairShops,
      nearbyHospitals: d.nearbyHospitals,
      policeStationDistanceKm: d.policeStationDistanceKm,
      towingAvailable: d.towingAvailable,
      riskLevel: d.riskLevel,
    }));

    return NextResponse.json({ deserts: formatted });
  } catch (error) {
    console.error('Deserts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch deserts' }, { status: 500 });
  }
}