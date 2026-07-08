import { NextResponse } from 'next/server';
import { alerts } from '@/lib/ev-data';

export async function GET() {
  try {
    const sorted = [...alerts].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const formatted = sorted.map(a => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      location: a.location,
      timestamp: a.timestamp,
    }));

    return NextResponse.json({ alerts: formatted });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}