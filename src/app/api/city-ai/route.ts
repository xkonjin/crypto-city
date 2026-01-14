/**
 * City AI Controller API
 * 
 * Provides an API for AI agents to control and observe the city.
 * This enables external AI (like Claude) to:
 * - Get city state and statistics
 * - Trigger actions (build, zone, disasters)
 * - Manage NPCs
 * - Control simulation speed
 */

import { NextResponse } from 'next/server';

// In-memory state for server-side tracking
let cityState: Record<string, unknown> = {};
let actionQueue: Array<{
  type: string;
  params: Record<string, unknown>;
  timestamp: number;
}> = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  switch (action) {
    case 'status':
      return NextResponse.json({
        success: true,
        data: {
          isRunning: true,
          actionQueueLength: actionQueue.length,
          lastUpdate: Date.now(),
          message: 'City AI Controller ready. Connect via browser to sync state.',
        },
      });
      
    case 'queue':
      return NextResponse.json({
        success: true,
        data: {
          pendingActions: actionQueue,
        },
      });
      
    default:
      return NextResponse.json({
        success: true,
        data: {
          endpoints: {
            'GET ?action=status': 'Get controller status',
            'GET ?action=queue': 'Get pending action queue',
            'POST': 'Submit action to queue',
          },
          availableActions: [
            'enable_city_ai',
            'disable_city_ai',
            'set_speed',
            'trigger_disaster',
            'spawn_npc',
            'ingest_x_profile',
            'place_building',
          ],
        },
      });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, params } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter',
      }, { status: 400 });
    }
    
    // Add to action queue
    actionQueue.push({
      type: action,
      params: params || {},
      timestamp: Date.now(),
    });
    
    // Keep queue manageable
    if (actionQueue.length > 100) {
      actionQueue = actionQueue.slice(-50);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: `Action "${action}" queued`,
        queuePosition: actionQueue.length,
        timestamp: Date.now(),
      },
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON body',
    }, { status: 400 });
  }
}
