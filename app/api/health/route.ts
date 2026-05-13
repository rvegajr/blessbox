/**
 * GET /api/health
 *
 * Alias for /api/system/health-check — kept short for monitoring tools
 * that expect a standard /health or /api/health endpoint.
 */
export { GET } from '@/app/api/system/health-check/route';
