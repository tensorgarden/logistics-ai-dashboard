import { describe, it, expect } from "vitest";
import {
  demoShipments,
  demoCarriers,
  demoTrackingEvents,
  demoRoutes,
  demoMetrics,
} from "@/lib/demo-data";

describe("Logistics AI Dashboard — demo data integrity", () => {
  it("has at least 10 shipments", () => {
    expect(demoShipments.length).toBeGreaterThanOrEqual(10);
  });

  it("every shipment references a valid carrier", () => {
    const carrierIds = new Set(demoCarriers.map((c) => c.id));
    for (const s of demoShipments) {
      expect(
        carrierIds.has(s.carrierId),
        `Shipment ${s.id} has unknown carrier ${s.carrierId}`
      ).toBe(true);
    }
  });

  it("every shipment references a valid route", () => {
    const routeIds = new Set(demoRoutes.map((r) => r.id));
    for (const s of demoShipments) {
      expect(
        routeIds.has(s.routeId),
        `Shipment ${s.id} has unknown route ${s.routeId}`
      ).toBe(true);
    }
  });

  it("tracking events reference existing shipments", () => {
    const shipmentIds = new Set(demoShipments.map((s) => s.id));
    for (const e of demoTrackingEvents) {
      expect(
        shipmentIds.has(e.shipmentId),
        `Tracking event ${e.id} references unknown shipment ${e.shipmentId}`
      ).toBe(true);
    }
  });

  it("all shipment statuses are valid", () => {
    const valid = [
      "in_transit",
      "delayed",
      "delivered",
      "customs_hold",
      "pending",
      "cancelled",
    ];
    for (const s of demoShipments) {
      expect(valid).toContain(s.status);
    }
  });

  it("delivered shipments have actualDelivery set", () => {
    for (const s of demoShipments) {
      if (s.status === "delivered") {
        expect(s.actualDelivery).not.toBeNull();
      }
    }
  });

  it("carriers have sensible on-time rates", () => {
    for (const c of demoCarriers) {
      expect(c.onTimeRate).toBeGreaterThanOrEqual(0);
      expect(c.onTimeRate).toBeLessThanOrEqual(100);
      expect(c.avgTransitDays).toBeGreaterThan(0);
      expect(c.rating).toBeGreaterThanOrEqual(1);
      expect(c.rating).toBeLessThanOrEqual(5);
    }
  });

  it("routes have at least one segment each", () => {
    for (const r of demoRoutes) {
      expect(r.segments.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("warehouse metrics are internally consistent", () => {
    const inTransit = demoShipments.filter(
      (s) => s.status === "in_transit"
    ).length;
    const delayed = demoShipments.filter(
      (s) => s.status === "delayed" || s.status === "customs_hold"
    ).length;
    expect(demoMetrics.activeShipments).toBeGreaterThan(0);
    expect(demoMetrics.onTimeRate).toBeGreaterThan(0);
    expect(demoMetrics.onTimeRate).toBeLessThanOrEqual(100);
    expect(demoMetrics.totalCarriers).toBe(demoCarriers.length);
    expect(demoMetrics.totalInTransit).toBe(inTransit);
    expect(demoMetrics.delayedCount).toBe(delayed);
  });

  it("shipment values are positive", () => {
    for (const s of demoShipments) {
      expect(s.value).toBeGreaterThan(0);
      expect(s.weight).toBeGreaterThan(0);
      expect(s.packages).toBeGreaterThanOrEqual(1);
    }
  });
});
