export type ShipmentStatus =
  | "in_transit"
  | "delayed"
  | "delivered"
  | "customs_hold"
  | "pending"
  | "cancelled";

export type CarrierStatus = "active" | "suspended" | "under_review";

export type Priority = "high" | "medium" | "low";

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrierId: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  actualDelivery: string | null;
  weight: number;
  packages: number;
  value: number;
  priority: Priority;
  customerName: string;
  customerCompany: string;
  routeId: string;
  lastKnownLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Carrier {
  id: string;
  name: string;
  code: string;
  status: CarrierStatus;
  onTimeRate: number;
  avgTransitDays: number;
  activeShipments: number;
  totalShipments: number;
  rating: number;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  timestamp: string;
  location: string;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
}

export type PortDwellRiskLevel = "low" | "medium" | "high" | "critical";

export type DockAppointmentStatus = "ready" | "at_risk" | "blocked";

export type DockCheckInMode = "digital" | "manual";

export type DockGateValidationStatus = "validated" | "needs_review" | "missing";

export type DockPreArrivalPacketStatus =
  | "complete"
  | "missing_vehicle_id"
  | "cargo_mismatch";

export type DockAppointmentConstraint =
  | "yard_congestion"
  | "receiver_closed"
  | "unstaged_freight"
  | "slot_overrun"
  | "none";

export type DockDoorAssignmentStatus =
  | "confirmed"
  | "reassignment_required"
  | "unassigned";

export interface PortDwellRisk {
  shipmentId: string;
  facility: string;
  dwellHours: number;
  freeTimeHoursRemaining: number;
  riskLevel: PortDwellRiskLevel;
  nextAction: string;
  detentionDailyRate: number;
  estimatedDemurrageCost: number;
}

export interface DockAppointmentRisk {
  shipmentId: string;
  facility: string;
  appointmentWindow: string;
  appointmentSlotMinutes: number;
  etaMinutesAway: number;
  dockTurnMinutes: number;
  freightStaged: boolean;
  checkInMode: DockCheckInMode;
  gateValidationStatus: DockGateValidationStatus;
  preArrivalPacketStatus: DockPreArrivalPacketStatus;
  assignedDockDoor: string | null;
  dockDoorAssignmentStatus: DockDoorAssignmentStatus;
  receiverConstraint: DockAppointmentConstraint;
  rescheduleByMinutes: number | null;
  cutoffRiskMinutes: number | null;
  status: DockAppointmentStatus;
  mitigation: string;
}

export interface RouteSegment {
  from: string;
  to: string;
  distanceKm: number;
  mode: "road" | "rail" | "air" | "sea";
  avgHours: number;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  avgTransitHours: number;
  segments: RouteSegment[];
  waypoints: string[];
  optimized: boolean;
}

export interface WarehouseMetrics {
  activeShipments: number;
  onTimeRate: number;
  avgTransitDays: number;
  activeAlerts: number;
  totalCarriers: number;
  totalInTransit: number;
  delayedCount: number;
  deliveredToday: number;
}
