// RISE — Industry benchmarks for gap analysis
// Every metric RISE tracks gets compared to real industry averages

export interface Benchmark {
  grossMargin: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  cacPaybackMonths: number;
  closeRate: number;
  churnRateMonthly: number;
  revenueGrowthRate: number;
  speedToLeadMinutes: number;
}

const BENCHMARKS: Record<string, Benchmark> = {
  'Agency / Services': {
    grossMargin: 28, cac: 450, ltv: 8400, ltvCacRatio: 18.7,
    cacPaybackMonths: 10, closeRate: 22, churnRateMonthly: 4,
    revenueGrowthRate: 8, speedToLeadMinutes: 254,
  },
  'SaaS / Software': {
    grossMargin: 72, cac: 890, ltv: 14000, ltvCacRatio: 15.7,
    cacPaybackMonths: 9, closeRate: 18, churnRateMonthly: 2,
    revenueGrowthRate: 15, speedToLeadMinutes: 120,
  },
  'E-commerce / DTC': {
    grossMargin: 38, cac: 67, ltv: 420, ltvCacRatio: 6.3,
    cacPaybackMonths: 4, closeRate: 3, churnRateMonthly: 8,
    revenueGrowthRate: 12, speedToLeadMinutes: 0,
  },
  'Coaching / Consulting': {
    grossMargin: 65, cac: 300, ltv: 6000, ltvCacRatio: 20,
    cacPaybackMonths: 6, closeRate: 30, churnRateMonthly: 3,
    revenueGrowthRate: 10, speedToLeadMinutes: 180,
  },
  'Home Services': {
    grossMargin: 35, cac: 120, ltv: 1800, ltvCacRatio: 15,
    cacPaybackMonths: 5, closeRate: 35, churnRateMonthly: 5,
    revenueGrowthRate: 6, speedToLeadMinutes: 254,
  },
};

export function getBenchmark(industry: string): Benchmark {
  return BENCHMARKS[industry] ?? BENCHMARKS['Agency / Services'];
}

export function getLTVCACHealth(ratio: number): 'critical' | 'watch' | 'healthy' | 'strong' {
  if (ratio < 1) return 'critical';
  if (ratio < 2) return 'watch';
  if (ratio < 4) return 'healthy';
  return 'strong';
}
