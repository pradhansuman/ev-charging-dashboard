import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const state = searchParams.get('state') || '';

    let where: Record<string, unknown> = {};
    if (filter === 'new') {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + istOffset);
      const monthStart = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
      where.dateOperational = { gte: monthStart };
    } else if (filter === 'offline') {
      where.status = { in: ['under_maintenance', 'temporarily_unavailable', 'power_failure', 'communication_failure'] };
    } else if (filter === 'closed') {
      where.status = 'permanently_closed';
    } else if (filter === '24x7') {
      where.is24x7 = true;
      where.status = 'operational';
    } else if (filter === 'ultrafast') {
      where.ultraFastChargers = { gt: 0 };
      where.status = 'operational';
    } else if (filter === 'highway') {
      where.highway = { not: null };
      where.status = 'operational';
    }

    if (state) {
      where.state = state;
    }

    const stations = await db.chargingStation.findMany({
      where,
      orderBy: { dateOperational: 'desc' },
    });

    const formatted = stations.map(s => ({
      id: s.id,
      name: s.name,
      operator: s.operator,
      state: s.state,
      district: s.district,
      city: s.city,
      address: s.address,
      pinCode: s.pinCode,
      highway: s.highway,
      latitude: s.latitude,
      longitude: s.longitude,
      totalChargers: s.totalChargers,
      acChargers: s.acChargers,
      dcFastChargers: s.dcFastChargers,
      ultraFastChargers: s.ultraFastChargers,
      ccs2Chargers: s.ccs2Chargers,
      chademoChargers: s.chademoChargers,
      gbtChargers: s.gbtChargers,
      type2Chargers: s.type2Chargers,
      bharatAC001: s.bharatAC001,
      bharatDC001: s.bharatDC001,
      teslaCompatible: s.teslaCompatible,
      powerRatingsKW: s.powerRatingsKW,
      is24x7: s.is24x7,
      amenities: s.amenities,
      parkingAvailable: s.parkingAvailable,
      paymentMethods: s.paymentMethods,
      status: s.status,
      dateOperational: s.dateOperational.toISOString(),
      confidenceScore: s.confidenceScore,
    }));

    return NextResponse.json({ stations: formatted, total: formatted.length });
  } catch (error) {
    console.error('Stations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}