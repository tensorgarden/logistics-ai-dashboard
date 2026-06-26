import { describe, it, expect } from "vitest";
import {
  demoShipments,
  demoCarriers,
  demoTrackingEvents,
  demoRoutes,
  demoMetrics,
  demoPortDwellRisks,
  demoDockAppointmentRisks,
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

  it("dwell risk alerts reference active shipments and include playbook actions", () => {
    const shipmentIds = new Set(demoShipments.map((s) => s.id));
    for (const risk of demoPortDwellRisks) {
      const shipment = demoShipments.find((s) => s.id === risk.shipmentId);
      expect(shipmentIds.has(risk.shipmentId)).toBe(true);
      expect(shipment?.actualDelivery).toBeNull();
      expect(risk.dwellHours).toBeGreaterThanOrEqual(0);
      expect(risk.freeTimeHoursRemaining).toBeGreaterThanOrEqual(0);
      expect(risk.nextAction.length).toBeGreaterThan(25);
    }
  });

  it("high-severity dwell risks have urgent free-time windows", () => {
    const urgentLevels = new Set(["high", "critical"]);
    const urgentRisks = demoPortDwellRisks.filter((risk) =>
      urgentLevels.has(risk.riskLevel)
    );

    expect(urgentRisks.length).toBeGreaterThanOrEqual(1);
    for (const risk of urgentRisks) {
      expect(risk.freeTimeHoursRemaining).toBeLessThanOrEqual(12);
    }
  });

  it("all dwell risks carry a positive detention daily rate", () => {
    for (const risk of demoPortDwellRisks) {
      expect(risk.detentionDailyRate).toBeGreaterThan(0);
    }
  });

  it("estimated demurrage cost is never negative", () => {
    for (const risk of demoPortDwellRisks) {
      expect(risk.estimatedDemurrageCost).toBeGreaterThanOrEqual(0);
    }
  });

  it("critical risk has the highest detention daily rate", () => {
    const critical = demoPortDwellRisks.find((r) => r.riskLevel === "critical");
    const others = demoPortDwellRisks.filter((r) => r.riskLevel !== "critical");
    expect(critical).toBeDefined();
    for (const r of others) {
      expect(critical!.detentionDailyRate).toBeGreaterThan(r.detentionDailyRate);
    }
  });

  it("risks with minimal free time show accrued demurrage cost", () => {
    const urgent = demoPortDwellRisks.filter(
      (r) => r.freeTimeHoursRemaining <= 6
    );
    for (const r of urgent) {
      expect(
        r.estimatedDemurrageCost,
        `Risk at ${r.facility} has ${r.freeTimeHoursRemaining}h free but shows $0 demurrage — should reflect exposure`
      ).toBeGreaterThan(0);
    }
  });

  it("dock appointment risks reference active shipments and live ETA data", () => {
    for (const risk of demoDockAppointmentRisks) {
      const shipment = demoShipments.find((s) => s.id === risk.shipmentId);
      expect(shipment, `Missing shipment for ${risk.facility}`).toBeDefined();
      expect(shipment?.actualDelivery).toBeNull();
      expect(risk.etaMinutesAway).toBeGreaterThan(0);
      expect(risk.dockTurnMinutes).toBeGreaterThan(0);
      expect(risk.appointmentSlotMinutes).toBeGreaterThan(0);
      expect(risk.appointmentWindow.length).toBeGreaterThan(5);
    }
  });

  it("at-risk dock appointments identify a practical detention root cause", () => {
    const interventions = demoDockAppointmentRisks.filter(
      (risk) => risk.status !== "ready"
    );

    expect(interventions.length).toBeGreaterThanOrEqual(1);
    for (const risk of interventions) {
      const hasOperationalRootCause =
        risk.freightStaged === false ||
        risk.checkInMode === "manual" ||
        risk.dockTurnMinutes > risk.appointmentSlotMinutes;

      expect(hasOperationalRootCause).toBe(true);
      expect(risk.receiverConstraint).not.toBe("none");
      expect(risk.rescheduleByMinutes).not.toBeNull();
      expect(risk.rescheduleByMinutes!).toBeGreaterThan(0);
      expect(risk.rescheduleByMinutes!).toBeLessThanOrEqual(
        risk.etaMinutesAway
      );
      expect(risk.mitigation.length).toBeGreaterThan(50);
    }
  });

  it("ready dock appointments fit the reserved slot and avoid manual gate check-in", () => {
    const readyAppointments = demoDockAppointmentRisks.filter(
      (risk) => risk.status === "ready"
    );

    expect(readyAppointments.length).toBeGreaterThanOrEqual(1);
    for (const risk of readyAppointments) {
      expect(risk.freightStaged).toBe(true);
      expect(risk.checkInMode).toBe("digital");
      expect(risk.receiverConstraint).toBe("none");
      expect(risk.rescheduleByMinutes).toBeNull();
      expect(risk.dockTurnMinutes).toBeLessThanOrEqual(
        risk.appointmentSlotMinutes
      );
    }
  });
});
