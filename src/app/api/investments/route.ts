import { NextResponse } from 'next/server';
import { investments } from '@/lib/ev-data';

export async function GET() {
  try {
    const sorted = [...investments].sort((a, b) => b.priorityScore - a.priorityScore);

    const formatted = sorted.map(inv => ({
      id: inv.id,
      location: inv.location,
      state: inv.state,
      city: inv.city,
      trafficDensity: inv.trafficDensity,
      tourismPotential: inv.tourismPotential,
      evPopulation: inv.evPopulation,
      existingChargerDist: inv.existingChargerDist,
      nearbyRestaurants: inv.nearbyRestaurants,
      nearbyFuelStations: inv.nearbyFuelStations,
      nearbyMalls: inv.nearbyMalls,
      nearbyHotels: inv.nearbyHotels,
      nearbyParking: inv.nearbyParking,
      expectedUtilization: inv.expectedUtilization,
      roiPotential: inv.roiPotential,
      priorityScore: inv.priorityScore,
    }));

    return NextResponse.json({ investments: formatted });
  } catch (error) {
    console.error('Investments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
  }
}