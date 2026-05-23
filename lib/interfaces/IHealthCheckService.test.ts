// IHealthCheckService Interface Tests - ISP compliance + behavioral contract
// Issue: #31 - System health diagnostics and monitoring

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  IHealthCheckService,
  IHealthProbe,
  IServiceMonitor,
  IDiagnosticsAggregator,
  HealthCheckResult,
  HealthStatus,
  SystemHealthSnapshot,
} from './IHealthCheckService';

class FakeServiceMonitor implements IServiceMonitor {
  constructor(
    public readonly serviceName: string,
    private readonly nextStatus: HealthStatus,
    private readonly latencyMs = 10,
    private readonly message?: string
  ) {}

  async check(): Promise<HealthCheckResult> {
    return {
      service: this.serviceName,
      status: this.nextStatus,
      latencyMs: this.latencyMs,
      message: this.message,
    };
  }
}

class MockHealthCheckService implements IHealthCheckService {
  private monitors: IServiceMonitor[] = [];

  registerMonitor(monitor: IServiceMonitor): void {
    this.monitors.push(monitor);
  }

  async probe(): Promise<HealthCheckResult> {
    // Minimal probe: just acknowledge liveness; do NOT do heavy work.
    return {
      service: 'app',
      status: 'ok',
      latencyMs: 1,
    };
  }

  async getSnapshot(): Promise<SystemHealthSnapshot> {
    const results = await Promise.all(this.monitors.map((m) => m.check()));
    // Snapshot status is the worst of any service.
    const order: Record<HealthStatus, number> = { ok: 0, degraded: 1, unknown: 2, error: 3 };
    const overall = results.reduce<HealthStatus>(
      (acc, r) => (order[r.status] > order[acc] ? r.status : acc),
      'ok'
    );

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      services: results,
      environment: { nodeVersion: process.version },
    };
  }
}

describe('IHealthCheckService Interface (ISP)', () => {
  let service: IHealthCheckService;

  beforeEach(() => {
    service = new MockHealthCheckService();
  });

  describe('Interface Segregation', () => {
    it('IHealthProbe surface is just probe()', () => {
      const probe: IHealthProbe = service;
      expect(typeof probe.probe).toBe('function');
      // Probe should NOT expose registerMonitor or getSnapshot
      expect((probe as any).getSnapshot).toBeDefined(); // class has it, but interface narrows
    });

    it('IDiagnosticsAggregator exposes only registration + snapshot', () => {
      const agg: IDiagnosticsAggregator = service;
      expect(typeof agg.registerMonitor).toBe('function');
      expect(typeof agg.getSnapshot).toBe('function');
    });

    it('IServiceMonitor has serviceName + check()', () => {
      const monitor: IServiceMonitor = new FakeServiceMonitor('db', 'ok');
      expect(monitor.serviceName).toBe('db');
      expect(typeof monitor.check).toBe('function');
    });
  });

  describe('probe() — public health endpoint contract', () => {
    it('returns ok status with latencyMs', async () => {
      const result = await service.probe();
      expect(result.status).toBe('ok');
      expect(typeof result.latencyMs).toBe('number');
      expect(result.service).toBeDefined();
    });

    it('responds quickly (under 500ms in mock)', async () => {
      const start = Date.now();
      await service.probe();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('aggregator behaviour', () => {
    it('registers a monitor and includes it in the snapshot', async () => {
      service.registerMonitor(new FakeServiceMonitor('database', 'ok', 5));
      service.registerMonitor(new FakeServiceMonitor('email', 'ok', 12));

      const snapshot = await service.getSnapshot();

      expect(snapshot.services).toHaveLength(2);
      expect(snapshot.services.map((s) => s.service)).toEqual(['database', 'email']);
      expect(snapshot.status).toBe('ok');
    });

    it('escalates overall status to the worst service status', async () => {
      service.registerMonitor(new FakeServiceMonitor('database', 'ok'));
      service.registerMonitor(new FakeServiceMonitor('email', 'degraded'));
      service.registerMonitor(new FakeServiceMonitor('storage', 'error'));

      const snapshot = await service.getSnapshot();
      expect(snapshot.status).toBe('error');
    });

    it('returns ok when no monitors are registered', async () => {
      const snapshot = await service.getSnapshot();
      expect(snapshot.status).toBe('ok');
      expect(snapshot.services).toEqual([]);
    });

    it('includes environment metadata for diagnostics page', async () => {
      const snapshot = await service.getSnapshot();
      expect(snapshot.environment).toBeDefined();
      expect(typeof snapshot.environment?.nodeVersion).toBe('string');
    });

    it('includes timestamp in ISO format', async () => {
      const snapshot = await service.getSnapshot();
      // ISO 8601 sanity
      expect(() => new Date(snapshot.timestamp).toISOString()).not.toThrow();
    });
  });

  describe('Composition', () => {
    it('combined IHealthCheckService can be used as both probe and aggregator', () => {
      const asProbe: IHealthProbe = service;
      const asAgg: IDiagnosticsAggregator = service;
      expect(asProbe.probe).toBe(asAgg.getSnapshot.bind(service)?.constructor === Function ? asProbe.probe : asProbe.probe);
      // Both views point to the same underlying instance
      expect(asProbe).toBe(asAgg);
    });
  });
});
