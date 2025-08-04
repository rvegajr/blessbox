// API endpoint to test database connection
import type { APIRoute } from 'astro';
import { testDatabaseConnection } from '../../../database/connection';

export const GET: APIRoute = async () => {
  try {
    const result = await testDatabaseConnection();
    
    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};