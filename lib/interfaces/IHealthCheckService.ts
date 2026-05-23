// IHealthCheckService - Interface Segregation Principle Compliant
// Single responsibility: Service health probing + diagnostics aggregation
//
// Issue: #31 - System health diagnostics and monitoring
//
// ISP rationale: monitoring tools only need IHealthProbe (basic up/down).
// Admin diagnostics UIs need the broader IDiagnosticsAggregator surface.

export type HealthStatus = 'ok' | 'degraded' | 'error' | 'unknown';

export interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemHealthSnapshot {
  status: HealthStatus;
  timestamp: string;
  services: HealthCheckResult[];
  environment?: {
    nodeVersion?: string;
    region?: string;
    deployedAt?: string;
  };
}

/**
 * Minimal contract for the public /api/health endpoint.
 * Must be cheap and not require authentication.
 */
export interface IHealthProbe {
  /** Single fast probe — must return within 500ms in normal conditions. */
  probe(): Promise<HealthCheckResult>;
}

/**
 * Per-service checkers. Each adapter wraps one external dependency.
 * Adapters are composed by the diagnostics aggregator.
 */
export interface IServiceMonitor {
  readonly serviceName: string;
  check(): Promise<HealthCheckResult>;
}

/**
 * Composes service monitors and produces a snapshot for the admin diagnostics
 * page. Auth-gated in production.
 */
export interface IDiagnosticsAggregator {
  registerMonitor(monitor: IServiceMonitor): void;
  getSnapshot(): Promise<SystemHealthSnapshot>;
}

/**
 * Combined service interface. The full implementation is both a probe (for
 * /api/health) and an aggregator (for /system/diagnostics).
 */
export interface IHealthCheckService extends IHealthProbe, IDiagnosticsAggregator {}
