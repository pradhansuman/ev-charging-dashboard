import { NextResponse } from 'next/server';
import { stations } from '@/lib/ev-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const state = searchParams.get('state') || '';

    let filtered = [...stations];

    if (filter === 'new') {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + istOffset);
      const monthStart = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
      filtered = filtered.filter(s => new Date(s.dateOperational) >= monthStart);
    } else if (filter === 'offline') {
      filtered = filtered.filter(s =>
        ['under_maintenance', 'temporarily_unavailable', 'power_failure', 'communication_failure'].includes(s.status)
      );
    } else if (filter === 'closed') {
      filtered = filtered.filter(s => s.status === 'permanently_closed');
    } else if (filter === '24x7') {
      filtered = filtered.filter(s => s.is24x7 && s.status === 'operational');
    } else if (filter === 'ultrafast') {
      filtered = filtered.filter(s => s.ultraFastChargers > 0 && s.status === 'operational');
    } else if (filter === 'highway') {
      filtered = filtered.filter(s => s.highway !== null && s.status === 'operational');
    }

    if (state) {
      filtered = filtered.filter(s => s.state === state);
    }

    // Sort by dateOperational desc
    filtered.sort((a, b) => new Date(b.dateOperational).getTime() - new Date(a.dateOperational).getTime());

    const formatted = filtered.map(s => ({
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
      dateOperational: s.dateOperational,
      confidenceScore: s.confidenceScore,
    }));

    return NextResponse.json({ stations: formatted, total: formatted.length });
  } catch (error) {
    console.error('Stations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}