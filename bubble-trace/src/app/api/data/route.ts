import { NextResponse } from 'next/server';
import { generateDynamicFakeData } from '@/lib/dynamicDataGenerator';

export async function GET() {
  try {
    // Generate fresh fake data on every request
    const data = generateDynamicFakeData();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating fake data:', error);
    return NextResponse.json(
      { error: 'Failed to generate data' },
      { status: 500 }
    );
  }
}