// Static EV data — reads from JSON files (no database needed)
// Generated for Vercel deployment

export interface Station {
  id: string; name: string; operator: string; state: string; district: string;
  city: string; address: string; pinCode: string; highway: string | null;
  latitude: number; longitude: number; totalChargers: number; acChargers: number;
  dcFastChargers: number; ultraFastChargers: number; ccs2Chargers: number;
  chademoChargers: number; gbtChargers: number; type2Chargers: number;
  bharatAC001: number; bharatDC001: number; teslaCompatible: number;
  powerRatingsKW: string; is24x7: boolean; amenities: string;
  parkingAvailable: boolean; paymentMethods: string; status: string;
  dateOperational: string; confidenceScore: number;
}
export interface Alert { id: string; type: string; severity: string; title: string; description: string; location: string; timestamp: string; }
export interface Route { id: string; routeName: string; origin: string; destination: string; totalDistanceKm: number; chargerCount: number; maxDistanceBetween: number; fastChargingAvailable: boolean; charging24x7: boolean; avgWaitingTimeMin: number | null; safeTravelScore: number; recommendedStops: string; backupStations: string; riskFactors: string; }
export interface Investment { id: string; location: string; state: string; city: string; trafficDensity: string; tourismPotential: boolean; evPopulation: number; existingChargerDist: number; nearbyRestaurants: number; nearbyFuelStations: number; nearbyMalls: number; nearbyHotels: number; nearbyParking: number; expectedUtilization: number; roiPotential: string; priorityScore: number; }
export interface Desert { id: string; location: string; state: string; nearestCharger: string; nearestChargerDistanceKm: number; roadCondition: string; mobileNetwork: string; recommendedBatteryPct: number; recommendedMinRangeKm: number; emergencyChargingAlt: string; nearbyHotels: number; nearbyRepairShops: number; nearbyHospitals: number; policeStationDistanceKm: number; towingAvailable: boolean; riskLevel: string; }

import stationsData from './stations.json';
import alertsData from './alerts.json';
import routesData from './routes.json';
import investmentsData from './investments.json';
import desertsData from './deserts.json';

export const stations: Station[] = stationsData;
export const alerts: Alert[] = alertsData;
export const routes: Route[] = routesData;
export const investments: Investment[] = investmentsData;
export const deserts: Desert[] = desertsData;