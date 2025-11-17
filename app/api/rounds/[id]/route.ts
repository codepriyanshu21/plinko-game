import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT * FROM "Round" WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[v0] Get round error:', error);
    return NextResponse.json({ error: 'Failed to fetch round' }, { status: 500 });
  }
}
