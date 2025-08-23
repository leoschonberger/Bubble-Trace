import { NextResponse } from 'next/server';
import db from '@/lib/database';
import { seedDatabase } from '@/lib/seed';
import { ParentRequirement, ChildRequirement, TestRun } from '@/types';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check if database has data, if not seed it
    const existingData = db.prepare(`SELECT COUNT(*) as count FROM parent_requirements`).get() as { count: number };
    if (existingData.count === 0) {
      seedDatabase();
    }

    const parentRequirements = db.prepare(`
      SELECT * FROM parent_requirements ORDER BY name
    `).all() as ParentRequirement[];

    const childRequirements = db.prepare(`
      SELECT * FROM child_requirements ORDER BY parent_requirement_id, name
    `).all() as ChildRequirement[];

    const testRuns = db.prepare(`
      SELECT * FROM test_runs ORDER BY child_requirement_id, name
    `).all() as TestRun[];

    return NextResponse.json({
      parentRequirements,
      childRequirements,
      testRuns
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}