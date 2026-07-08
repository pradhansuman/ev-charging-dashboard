import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const alerts = await db.chargingAlert.findMany({
      orderBy: { timestamp: 'desc' },
    });

    const formatted = alerts.map(a => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      location: a.location,
      timestamp: a.timestamp.toISOString(),
    }));

    return NextResponse.json({ alerts: formatted });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}