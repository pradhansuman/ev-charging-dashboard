import { useQuery } from "@tanstack/react-query";

// ── Type definitions ──────────────────────────────────────────────────────────

interface SummaryStats {
  totalLocations: number;
  totalChargers: number;
  operationalLocations: number;
  acChargers: number;
  dcFastChargers: number;
  ultraFastChargers: number;
  ccs2Chargers: number;
  chademoChargers: number;
  gbtChargers: number;
  type2Chargers: number;
  bharatAC001: number;
  bharatDC001: number;
  teslaCompatible: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  offlineStations: number;
  closedStations: number;
  charging24x7: number;
}

interface StateBreakdown {
  state: string;
  stations: number;
  chargers: number;
  dcFast: number;
  ultraFast: number;
}

interface OperatorMarketShare {
  operator: string;
  stations: number;
  chargers: number;
  share: number;
}

interface MonthlyTrend {
  month: string;
  installations: number;
  chargers: number;
}

interface Distribution {
  type: string;
  count: number;
}

interface StatsResponse {
  lastUpdated: string;
  summary: SummaryStats;
  stateBreakdown: StateBreakdown[];
  operatorMarketShare: OperatorMarketShare[];
  monthlyTrend: MonthlyTrend[];
  chargerTypeDistribution: Distribution[];
  connectorDistribution: Distribution[];
}

interface Station {
  id: string;
  name: string;
  operator: string;
  state: string;
  district: string;
  city: string;
  address: string;
  pinCode: string;
  highway: string | null;
  latitude: number;
  longitude: number;
  totalChargers: number;
  acChargers: number;
  dcFastChargers: number;
  ultraFastChargers: number;
  ccs2Chargers: number;
  chademoChargers: number;
  gbtChargers: number;
  type2Chargers: number;
  bharatAC001: number;
  bharatDC001: number;
  teslaCompatible: number;
  powerRatingsKW: string;
  is24x7: boolean;
  amenities: string;
  parkingAvailable: boolean;
  paymentMethods: string;
  status: string;
  dateOperational: string;
  confidenceScore: number;
}

interface StationsResponse {
  stations: Station[];
  total: number;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
}

interface AlertsResponse {
  alerts: Alert[];
}

interface RouteAnalysis {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  totalDistanceKm: number;
  chargerCount: number;
  maxDistanceBetween: number;
  fastChargingAvailable: boolean;
  charging24x7: boolean;
  avgWaitingTimeMin: number;
  safeTravelScore: number;
  recommendedStops: string;
  backupStations: string;
  riskFactors: string;
}

interface RoutesResponse {
  routes: RouteAnalysis[];
}

interface InvestmentOpportunity {
  id: string;
  location: string;
  state: string;
  city: string;
  trafficDensity: string;
  tourismPotential: boolean;
  evPopulation: number;
  existingChargerDist: number;
  nearbyRestaurants: number;
  nearbyFuelStations: number;
  nearbyMalls: number;
  nearbyHotels: number;
  nearbyParking: number;
  expectedUtilization: number;
  roiPotential: string;
  priorityScore: number;
}

interface InvestmentsResponse {
  investments: InvestmentOpportunity[];
}

interface ChargingDesert {
  id: string;
  location: string;
  state: string;
  nearestCharger: string;
  nearestChargerDistanceKm: number;
  roadCondition: string;
  mobileNetwork: string;
  recommendedBatteryPct: number;
  recommendedMinRangeKm: number;
  emergencyChargingAlt: string;
  nearbyHotels: number;
  nearbyRepairShops: number;
  nearbyHospitals: number;
  policeStationDistanceKm: number;
  towingAvailable: boolean;
  riskLevel: string;
}

interface DesertsResponse {
  deserts: ChargingDesert[];
}

// ── Query configuration ───────────────────────────────────────────────────────

const QUERY_OPTIONS = {
  staleTime: 60_000,
  refetchInterval: 120_000,
} as const;

export function useEVDashboard() {
  const statsQuery = useQuery<StatsResponse>({
    queryKey: ["ev-stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const allStationsQuery = useQuery<StationsResponse>({
    queryKey: ["ev-stations", "all"],
    queryFn: () =>
      fetch("/api/stations?filter=all").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const newStationsQuery = useQuery<StationsResponse>({
    queryKey: ["ev-stations", "new"],
    queryFn: () =>
      fetch("/api/stations?filter=new").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const offlineStationsQuery = useQuery<StationsResponse>({
    queryKey: ["ev-stations", "offline"],
    queryFn: () =>
      fetch("/api/stations?filter=offline").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const alertsQuery = useQuery<AlertsResponse>({
    queryKey: ["ev-alerts"],
    queryFn: () => fetch("/api/alerts").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const routesQuery = useQuery<RoutesResponse>({
    queryKey: ["ev-routes"],
    queryFn: () => fetch("/api/routes").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const investmentsQuery = useQuery<InvestmentsResponse>({
    queryKey: ["ev-investments"],
    queryFn: () => fetch("/api/investments").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const desertsQuery = useQuery<DesertsResponse>({
    queryKey: ["ev-deserts"],
    queryFn: () => fetch("/api/deserts").then((r) => r.json()),
    ...QUERY_OPTIONS,
  });

  const isLoading =
    statsQuery.isLoading ||
    allStationsQuery.isLoading ||
    newStationsQuery.isLoading ||
    offlineStationsQuery.isLoading ||
    alertsQuery.isLoading ||
    routesQuery.isLoading ||
    investmentsQuery.isLoading ||
    desertsQuery.isLoading;

  const isError =
    statsQuery.isError ||
    allStationsQuery.isError ||
    newStationsQuery.isError ||
    offlineStationsQuery.isError ||
    alertsQuery.isError ||
    routesQuery.isError ||
    investmentsQuery.isError ||
    desertsQuery.isError;

  const error =
    statsQuery.error ??
    allStationsQuery.error ??
    newStationsQuery.error ??
    offlineStationsQuery.error ??
    alertsQuery.error ??
    routesQuery.error ??
    investmentsQuery.error ??
    desertsQuery.error ??
    null;

  return {
    // Data
    stats: statsQuery.data ?? null,
    allStations: allStationsQuery.data?.stations ?? [],
    allStationsTotal: allStationsQuery.data?.total ?? 0,
    newStations: newStationsQuery.data?.stations ?? [],
    newStationsTotal: newStationsQuery.data?.total ?? 0,
    offlineStations: offlineStationsQuery.data?.stations ?? [],
    offlineStationsTotal: offlineStationsQuery.data?.total ?? 0,
    alerts: alertsQuery.data?.alerts ?? [],
    routes: routesQuery.data?.routes ?? [],
    investments: investmentsQuery.data?.investments ?? [],
    deserts: desertsQuery.data?.deserts ?? [],

    // States
    isLoading,
    isError,
    error,

    // Refetch helpers
    refetchAll: () => {
      statsQuery.refetch();
      allStationsQuery.refetch();
      newStationsQuery.refetch();
      offlineStationsQuery.refetch();
      alertsQuery.refetch();
      routesQuery.refetch();
      investmentsQuery.refetch();
      desertsQuery.refetch();
    },
  };
}

export type {
  SummaryStats,
  StateBreakdown,
  OperatorMarketShare,
  MonthlyTrend,
  Distribution,
  StatsResponse,
  Station,
  StationsResponse,
  Alert,
  AlertsResponse,
  RouteAnalysis,
  RoutesResponse,
  InvestmentOpportunity,
  InvestmentsResponse,
  ChargingDesert,
  DesertsResponse,
};