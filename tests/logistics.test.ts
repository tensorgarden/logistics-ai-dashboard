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
import { isDockServiceReleased, isDetentionChargebackReady } from "@/lib/types";

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

  it("dock interventions expose cutoff pressure before missed appointments", () => {
    const interventions = demoDockAppointmentRisks.filter(
      (risk) => risk.status !== "ready"
    );

    expect(interventions.length).toBeGreaterThanOrEqual(1);
    for (const risk of interventions) {
      expect(
        risk.cutoffRiskMinutes,
        `${risk.facility} should show cutoff pressure for dispatchers`
      ).not.toBeNull();
      expect(risk.cutoffRiskMinutes!).toBeGreaterThan(0);
      expect(risk.cutoffRiskMinutes!).toBeLessThanOrEqual(risk.etaMinutesAway);
      expect(risk.mitigation.toLowerCase()).toMatch(
        /cutoff|receiver closes|overtime/
      );
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
      expect(risk.cutoffRiskMinutes).toBeNull();
      expect(risk.dockTurnMinutes).toBeLessThanOrEqual(
        risk.appointmentSlotMinutes
      );
    }
  });

  it("dock appointment records expose gate validation readiness", () => {
    const validationStatuses = new Set(["validated", "needs_review", "missing"]);
    const readyAppointments = demoDockAppointmentRisks.filter(
      (risk) => risk.status === "ready"
    );
    const interventions = demoDockAppointmentRisks.filter(
      (risk) => risk.status !== "ready"
    );

    for (const risk of demoDockAppointmentRisks) {
      expect(validationStatuses.has(risk.gateValidationStatus)).toBe(true);
    }

    for (const risk of readyAppointments) {
      expect(risk.gateValidationStatus).toBe("validated");
    }

    for (const risk of interventions) {
      expect(["needs_review", "missing"]).toContain(
        risk.gateValidationStatus
      );
      expect(risk.mitigation.toLowerCase()).toMatch(
        /gate|pass|check-in|validation|receiver|rebook|staging/
      );
    }
  });

  it("dock appointment records expose pre-arrival packet readiness", () => {
    const preArrivalStatuses = new Set([
      "complete",
      "missing_vehicle_id",
      "cargo_mismatch",
    ]);
    const readyAppointments = demoDockAppointmentRisks.filter(
      (risk) => risk.status === "ready"
    );
    const interventions = demoDockAppointmentRisks.filter(
      (risk) => risk.status !== "ready"
    );

    for (const risk of demoDockAppointmentRisks) {
      expect(preArrivalStatuses.has(risk.preArrivalPacketStatus)).toBe(true);
    }

    for (const risk of readyAppointments) {
      expect(risk.preArrivalPacketStatus).toBe("complete");
    }

    for (const risk of interventions) {
      expect(risk.preArrivalPacketStatus).not.toBe("complete");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /vehicle id|cargo|gate pass|carrier portal|appointment packet/
      );
    }
  });

  it("keeps dock appointments on hold until trailer seals are verified", () => {
    const sealExceptions = demoDockAppointmentRisks.filter(
      (risk) => risk.sealVerificationStatus !== "verified_intact"
    );
    const exceptionStatuses = new Set(
      sealExceptions.map((risk) => risk.sealVerificationStatus)
    );

    expect(exceptionStatuses).toEqual(
      new Set(["pending_verification", "damaged_hold"])
    );
    for (const risk of demoDockAppointmentRisks) {
      if (risk.status === "ready") {
        expect(risk.sealVerificationStatus).toBe("verified_intact");
      }
    }

    for (const risk of sealExceptions) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /seal|chain-of-custody|security hold/
      );

      if (risk.sealVerificationStatus === "damaged_hold") {
        expect(risk.status).toBe("blocked");
      }
    }
  });

  it("shared dock doors expose inbound and outbound flow conflicts", () => {
    const validDirections = new Set(["inbound", "outbound"]);
    const conflictRecords = demoDockAppointmentRisks.filter(
      (risk) => risk.dockDoorFlowConflict !== "none"
    );

    expect(conflictRecords.length).toBeGreaterThanOrEqual(1);
    for (const risk of demoDockAppointmentRisks) {
      expect(validDirections.has(risk.dockFlowDirection)).toBe(true);

      if (risk.status === "ready") {
        expect(risk.dockDoorFlowConflict).toBe("none");
      }
    }

    for (const risk of conflictRecords) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /inbound|outbound|shared-door/
      );
    }
  });

  it("dock appointments confirm unloading resources before ready status", () => {
    const resourceGaps = demoDockAppointmentRisks.filter(
      (risk) =>
        risk.laborReadiness !== "crew_confirmed" ||
        risk.equipmentReadiness !== "ready"
    );

    expect(resourceGaps.length).toBeGreaterThanOrEqual(1);
    for (const risk of demoDockAppointmentRisks) {
      if (risk.status === "ready") {
        expect(risk.laborReadiness).toBe("crew_confirmed");
        expect(risk.equipmentReadiness).toBe("ready");
      }
    }

    for (const risk of resourceGaps) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /crew|labor|forklift|equipment/
      );
    }
  });

  it("requires ready appointments to have the trailer spotted at the dock", () => {
    const spottingGaps = demoDockAppointmentRisks.filter(
      (risk) => risk.trailerSpottingStatus !== "spotted_at_door"
    );

    expect(spottingGaps.length).toBeGreaterThanOrEqual(1);
    for (const risk of demoDockAppointmentRisks) {
      if (risk.status === "ready") {
        expect(risk.trailerSpottingStatus).toBe("spotted_at_door");
        expect(risk.spotMoveEtaMinutes).toBe(0);
      }
    }

    for (const risk of spottingGaps) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /spotter|hostler|trailer|yard move/
      );
    }
  });

  it("keeps trailer spotting plans measurable and operationally coherent", () => {
    const queuedMoves = demoDockAppointmentRisks.filter(
      (risk) => risk.trailerSpottingStatus === "spotter_queued"
    );
    const unverifiedTrailers = demoDockAppointmentRisks.filter(
      (risk) => risk.trailerSpottingStatus === "trailer_location_unverified"
    );

    expect(queuedMoves.length).toBeGreaterThanOrEqual(1);
    expect(unverifiedTrailers.length).toBeGreaterThanOrEqual(1);
    for (const risk of queuedMoves) {
      expect(risk.spotMoveEtaMinutes).not.toBeNull();
      expect(risk.spotMoveEtaMinutes!).toBeGreaterThan(0);
      expect(risk.spotMoveEtaMinutes!).toBeLessThanOrEqual(15);
    }

    for (const risk of unverifiedTrailers) {
      expect(risk.spotMoveEtaMinutes).toBeNull();
      expect(risk.mitigation.toLowerCase()).toMatch(/locate|verify|trailer/);
    }
  });

  it("tracks spotter request age against call-to-door targets", () => {
    const queuedMoves = demoDockAppointmentRisks.filter(
      (risk) => risk.trailerSpottingStatus === "spotter_queued"
    );
    const unplannedMoves = demoDockAppointmentRisks.filter(
      (risk) => risk.trailerSpottingStatus === "trailer_location_unverified"
    );
    let projectedBreachCount = 0;

    for (const risk of demoDockAppointmentRisks) {
      expect(risk.spotMoveSlaMinutes).toBeGreaterThan(0);

      if (risk.status === "ready") {
        expect(risk.spotMoveWaitMinutes).toBe(0);
        expect(risk.spotMoveEtaMinutes).toBe(0);
      }
    }

    for (const risk of queuedMoves) {
      expect(risk.spotMoveWaitMinutes).not.toBeNull();
      expect(risk.spotMoveWaitMinutes!).toBeGreaterThan(0);
      expect(risk.spotMoveEtaMinutes).not.toBeNull();

      const projectedTurnMinutes =
        risk.spotMoveWaitMinutes! + risk.spotMoveEtaMinutes!;
      if (projectedTurnMinutes > risk.spotMoveSlaMinutes) {
        projectedBreachCount += 1;
        expect(risk.mitigation.toLowerCase()).toMatch(
          /escalat|call-to-door|spotter target/
        );
      }
    }

    expect(projectedBreachCount).toBeGreaterThanOrEqual(1);
    for (const risk of unplannedMoves) {
      expect(risk.spotMoveWaitMinutes).toBeNull();
      expect(risk.spotMoveEtaMinutes).toBeNull();
    }
  });

  it("releases the dock door only after the previous trailer is removed", () => {
    const removalGaps = demoDockAppointmentRisks.filter(
      (risk) => risk.emptyTrailerRemovalStatus !== "removed_door_released"
    );

    expect(removalGaps.length).toBeGreaterThanOrEqual(1);
    for (const risk of demoDockAppointmentRisks) {
      if (risk.status === "ready") {
        expect(risk.emptyTrailerRemovalStatus).toBe("removed_door_released");
      }
    }

    for (const risk of removalGaps) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /hostler|empty trailer|pull|removal/
      );
    }
  });

  it("distinguishes a queued trailer pull from an unplanned removal", () => {
    const queuedPulls = demoDockAppointmentRisks.filter(
      (risk) => risk.emptyTrailerRemovalStatus === "hostler_queued"
    );
    const unplannedRemovals = demoDockAppointmentRisks.filter(
      (risk) => risk.emptyTrailerRemovalStatus === "removal_unplanned"
    );

    expect(queuedPulls.length).toBeGreaterThanOrEqual(1);
    expect(unplannedRemovals.length).toBeGreaterThanOrEqual(1);

    for (const risk of queuedPulls) {
      expect(risk.assignedDockDoor).not.toBeNull();
      expect(risk.mitigation.toLowerCase()).toMatch(/hostler|pull|remove/);
    }

    for (const risk of unplannedRemovals) {
      expect(risk.mitigation.toLowerCase()).toMatch(/removal plan|empty trailer/);
    }
  });

  it("dock door assignments support live yard reallocation", () => {
    const validStatuses = new Set([
      "confirmed",
      "reassignment_required",
      "unassigned",
    ]);

    for (const risk of demoDockAppointmentRisks) {
      expect(validStatuses.has(risk.dockDoorAssignmentStatus)).toBe(true);

      if (risk.status === "ready") {
        expect(risk.dockDoorAssignmentStatus).toBe("confirmed");
        expect(risk.assignedDockDoor).not.toBeNull();
      } else {
        expect(risk.dockDoorAssignmentStatus).not.toBe("confirmed");
        expect(risk.mitigation.toLowerCase()).toMatch(/dock|door|reassign/);
      }

      if (risk.dockDoorAssignmentStatus === "reassignment_required") {
        expect(risk.assignedDockDoor).not.toBeNull();
      }

      if (risk.dockDoorAssignmentStatus === "unassigned") {
        expect(risk.assignedDockDoor).toBeNull();
      }
    }
  });

  it("requires a verified restraint and leveler interlock before dock service", () => {
    const readyAppointments = demoDockAppointmentRisks.filter(
      (risk) => risk.status === "ready"
    );

    expect(readyAppointments.length).toBeGreaterThanOrEqual(1);
    for (const risk of readyAppointments) {
      expect(risk.dockSafetyInterlockStatus).toBe("verified_ready");
    }
  });

  it("routes pending restraints and leveler faults to distinct intervention lanes", () => {
    const interlockExceptions = demoDockAppointmentRisks.filter(
      (risk) => risk.dockSafetyInterlockStatus !== "verified_ready"
    );
    const exceptionStates = new Set(
      interlockExceptions.map((risk) => risk.dockSafetyInterlockStatus)
    );

    expect(exceptionStates).toEqual(
      new Set(["restraint_pending", "leveler_fault_hold"])
    );
    for (const risk of interlockExceptions) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(/restraint|leveler|dockboard/);

      if (risk.dockSafetyInterlockStatus === "restraint_pending") {
        expect(risk.status).toBe("at_risk");
      }

      if (risk.dockSafetyInterlockStatus === "leveler_fault_hold") {
        expect(risk.status).toBe("blocked");
      }
    }
  });

  it("requires ready dock appointments to have stable trailer support", () => {
    const supportedStates = new Set([
      "tractor_coupled",
      "fixed_jacks_verified",
    ]);
    const readyAppointments = demoDockAppointmentRisks.filter(
      (risk) => risk.status === "ready"
    );

    expect(readyAppointments.length).toBeGreaterThanOrEqual(1);
    for (const risk of readyAppointments) {
      expect(supportedStates.has(risk.trailerSupportStatus)).toBe(true);
    }
  });

  it("blocks unsupported uncoupled trailers before forklift entry", () => {
    const supportStates = new Set(
      demoDockAppointmentRisks.map((risk) => risk.trailerSupportStatus)
    );
    const supportHolds = demoDockAppointmentRisks.filter(
      (risk) => risk.trailerSupportStatus === "support_required_hold"
    );

    expect(supportStates).toEqual(
      new Set([
        "tractor_coupled",
        "fixed_jacks_verified",
        "support_required_hold",
      ])
    );
    expect(supportHolds.length).toBeGreaterThanOrEqual(1);
    for (const risk of supportHolds) {
      expect(risk.status).toBe("blocked");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /uncoupled|fixed jack|trailer support|upend/
      );
    }
  });

  it("holds dock service when an otherwise-ready trailer lacks stable support", () => {
    const readySupported = demoDockAppointmentRisks.find(
      (risk) => risk.status === "ready"
    );
    expect(readySupported).toBeDefined();

    const unsupportedReady = {
      ...readySupported!,
      trailerSupportStatus: "support_required_hold" as const,
    };

    expect(isDockServiceReleased(readySupported!)).toBe(true);
    expect(isDockServiceReleased(unsupportedReady)).toBe(false);
    for (const risk of demoDockAppointmentRisks.filter(
      (appointment) => appointment.status !== "ready"
    )) {
      expect(isDockServiceReleased(risk)).toBe(false);
    }
  });

  it("gates refrigerated dock service on verified cold-chain status", () => {
    const exceptions = demoDockAppointmentRisks.filter(
      (risk) => risk.coldChainStatus !== "within_range_verified"
    );
    const exceptionStates = new Set(
      exceptions.map((risk) => risk.coldChainStatus)
    );

    expect(exceptionStates).toEqual(
      new Set(["pre_cool_pending", "temperature_excursion_hold"])
    );
    for (const risk of demoDockAppointmentRisks) {
      if (risk.status === "ready") {
        expect(risk.coldChainStatus).toBe("within_range_verified");
      }
    }

    for (const risk of exceptions) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /reefer|temperature|cold.?chain|pre.?cool|quarantine/
      );

      if (risk.coldChainStatus === "pre_cool_pending") {
        expect(risk.status).toBe("at_risk");
      }

      if (risk.coldChainStatus === "temperature_excursion_hold") {
        expect(risk.status).toBe("blocked");
        expect(risk.mitigation.toLowerCase()).toMatch(/quarantine|\bqa\b/);
      }
    }
  });

  it("holds dock service when an otherwise-ready load has a temperature excursion", () => {
    const readyVerified = demoDockAppointmentRisks.find(
      (risk) => risk.status === "ready"
    );
    expect(readyVerified).toBeDefined();

    const excursionReady = {
      ...readyVerified!,
      coldChainStatus: "temperature_excursion_hold" as const,
    };

    expect(isDockServiceReleased(readyVerified!)).toBe(true);
    expect(isDockServiceReleased(excursionReady)).toBe(false);
  });

  it("tracks detention cost for every dock appointment with valid rate and free-time window", () => {
    for (const risk of demoDockAppointmentRisks) {
      expect(risk.detentionFreeMinutes).toBeGreaterThan(0);
      expect(risk.detentionHourlyRate).toBeGreaterThan(0);
      expect(risk.estimatedDetentionCost).toBeGreaterThanOrEqual(0);

      const overFreeMinutes = Math.max(
        0,
        risk.dockTurnMinutes - risk.detentionFreeMinutes
      );
      const expectedCost = Math.round(
        (overFreeMinutes / 60) * risk.detentionHourlyRate
      );
      expect(risk.estimatedDetentionCost).toBe(expectedCost);
    }
  });

  it("zeroes out detention cost when the turn fits inside the free-time window", () => {
    const noDetention = demoDockAppointmentRisks.filter(
      (risk) => risk.dockTurnMinutes <= risk.detentionFreeMinutes
    );

    expect(noDetention.length).toBeGreaterThanOrEqual(1);
    for (const risk of noDetention) {
      expect(risk.estimatedDetentionCost).toBe(0);
    }
  });

  it("surfaces detention cost pressure for appointments that overrun the free window", () => {
    const detentionRisks = demoDockAppointmentRisks.filter(
      (risk) => risk.dockTurnMinutes > risk.detentionFreeMinutes
    );

    expect(detentionRisks.length).toBeGreaterThanOrEqual(1);
    for (const risk of detentionRisks) {
      expect(risk.estimatedDetentionCost).toBeGreaterThan(0);
      expect(risk.status).not.toBe("ready");
    }
  });

  it("keeps detention rates within reported US carrier contract ranges", () => {
    for (const risk of demoDockAppointmentRisks) {
      expect(risk.detentionHourlyRate).toBeGreaterThanOrEqual(50);
      expect(risk.detentionHourlyRate).toBeLessThanOrEqual(100);
    }
  });

  it("requires carrier responsibility and a complete timestamp chain before a detention chargeback", () => {
    const readyFixture = demoDockAppointmentRisks.find(
      (risk) => risk.status === "ready"
    );
    expect(readyFixture).toBeDefined();

    const billableBase = {
      ...readyFixture!,
      estimatedDetentionCost: 42,
      detentionResponsibility: "carrier" as const,
      detentionEvidenceStatus: "evidence_complete" as const,
    };
    expect(isDetentionChargebackReady(billableBase)).toBe(true);

    expect(
      isDetentionChargebackReady({
        ...billableBase,
        detentionResponsibility: "facility",
      })
    ).toBe(false);
    expect(
      isDetentionChargebackReady({
        ...billableBase,
        detentionResponsibility: "unattributed",
      })
    ).toBe(false);
    expect(
      isDetentionChargebackReady({
        ...billableBase,
        detentionEvidenceStatus: "missing_timestamps",
      })
    ).toBe(false);
    expect(
      isDetentionChargebackReady({
        ...billableBase,
        detentionEvidenceStatus: "conflicting_timestamps",
      })
    ).toBe(false);
    expect(
      isDetentionChargebackReady({ ...billableBase, estimatedDetentionCost: 0 })
    ).toBe(false);
  });

  it("keeps demo detention exposure out of auto-billing until evidence is reconciled", () => {
    const billableExposure = demoDockAppointmentRisks.filter(
      (risk) => risk.estimatedDetentionCost > 0
    );

    expect(billableExposure.length).toBeGreaterThanOrEqual(1);
    for (const risk of billableExposure) {
      expect(isDetentionChargebackReady(risk)).toBe(false);
    }

    const facilityAbsorbed = demoDockAppointmentRisks.find(
      (risk) => risk.detentionResponsibility === "facility"
    );
    expect(facilityAbsorbed).toBeDefined();
    expect(facilityAbsorbed!.detentionEvidenceStatus).toBe(
      "missing_timestamps"
    );
    expect(facilityAbsorbed!.mitigation.toLowerCase()).toMatch(
      /timestamp|gate check-in|door-release/
    );

    const disputedClaim = demoDockAppointmentRisks.find(
      (risk) => risk.detentionEvidenceStatus === "conflicting_timestamps"
    );
    expect(disputedClaim).toBeDefined();
    expect(disputedClaim!.detentionResponsibility).toBe("unattributed");
    expect(disputedClaim!.mitigation.toLowerCase()).toMatch(
      /reconcil|clock|billing review/
    );
  });

  it("labels detention responsibility and evidence state for every appointment", () => {
    const responsibilities = new Set(["carrier", "facility", "unattributed"]);
    const evidenceStates = new Set([
      "evidence_complete",
      "missing_timestamps",
      "conflicting_timestamps",
    ]);

    for (const risk of demoDockAppointmentRisks) {
      expect(responsibilities.has(risk.detentionResponsibility)).toBe(true);
      expect(evidenceStates.has(risk.detentionEvidenceStatus)).toBe(true);

      if (risk.status === "ready") {
        expect(risk.detentionEvidenceStatus).toBe("evidence_complete");
      }
    }

    const missing = demoDockAppointmentRisks.filter(
      (risk) => risk.detentionEvidenceStatus === "missing_timestamps"
    );
    const conflicting = demoDockAppointmentRisks.filter(
      (risk) => risk.detentionEvidenceStatus === "conflicting_timestamps"
    );
    expect(missing.length).toBeGreaterThanOrEqual(1);
    expect(conflicting.length).toBeGreaterThanOrEqual(1);
  });

  it("decomposes dock turn time into actionable dwell phases", () => {
    const dominantPhases = new Set<string>();

    for (const risk of demoDockAppointmentRisks) {
      const phases = risk.dwellBreakdown;
      const phaseMinutes = [
        phases.gateToDockMinutes,
        phases.dockToServiceMinutes,
        phases.serviceDurationMinutes,
        phases.serviceToGateOutMinutes,
      ];

      for (const minutes of phaseMinutes) {
        expect(minutes).toBeGreaterThan(0);
      }
      expect(phaseMinutes.reduce((total, minutes) => total + minutes, 0)).toBe(
        risk.dockTurnMinutes
      );
      dominantPhases.add(phases.dominantPhase);
    }

    expect(dominantPhases.size).toBeGreaterThanOrEqual(3);
  });

  it("labels the longest dwell phase for each appointment", () => {
    for (const risk of demoDockAppointmentRisks) {
      const phaseMinutes = {
        gate_to_dock: risk.dwellBreakdown.gateToDockMinutes,
        dock_to_service: risk.dwellBreakdown.dockToServiceMinutes,
        service_duration: risk.dwellBreakdown.serviceDurationMinutes,
        service_to_gate_out: risk.dwellBreakdown.serviceToGateOutMinutes,
      };
      const longestPhaseMinutes = Math.max(...Object.values(phaseMinutes));

      expect(phaseMinutes[risk.dwellBreakdown.dominantPhase]).toBe(
        longestPhaseMinutes
      );
    }
  });

  it('routes missed carrier check-ins through slot-release review', () => {
    const arrivalStatuses = new Set(['on_schedule', 'late_risk', 'no_show_review']);
    const recoveryStatuses = new Set([
      'not_required',
      'monitor_check_in',
      'operator_confirmation_required',
    ]);
    const lateRisks = demoDockAppointmentRisks.filter(
      (risk) => risk.carrierArrivalStatus === 'late_risk'
    );
    const noShowReviews = demoDockAppointmentRisks.filter(
      (risk) => risk.carrierArrivalStatus === 'no_show_review'
    );

    expect(lateRisks.length).toBeGreaterThanOrEqual(1);
    expect(noShowReviews.length).toBeGreaterThanOrEqual(1);
    for (const risk of demoDockAppointmentRisks) {
      expect(arrivalStatuses.has(risk.carrierArrivalStatus)).toBe(true);
      expect(recoveryStatuses.has(risk.noShowRecoveryStatus)).toBe(true);

      if (risk.status === 'ready') {
        expect(risk.carrierArrivalStatus).toBe('on_schedule');
        expect(risk.noShowRecoveryStatus).toBe('not_required');
      }
    }

    for (const risk of lateRisks) {
      expect(risk.status).not.toBe('ready');
      expect(risk.noShowRecoveryStatus).toBe('monitor_check_in');
      expect(risk.mitigation.toLowerCase()).toMatch(/check-in|appointment start/);
    }

    for (const risk of noShowReviews) {
      expect(risk.status).not.toBe('ready');
      expect(risk.noShowRecoveryStatus).toBe('operator_confirmation_required');
      expect(risk.mitigation.toLowerCase()).toMatch(
        /no-show|confirm.*empty|release.*slot|reassign/
      );
    }
  });

  it("tracks appointment confirmation ownership and timed follow-up", () => {
    const confirmationStatuses = new Set([
      "confirmed",
      "carrier_follow_up_due",
      "operator_escalation_due",
    ]);
    const pendingConfirmations = demoDockAppointmentRisks.filter(
      (risk) => risk.appointmentConfirmationStatus !== "confirmed"
    );

    expect(
      new Set(demoDockAppointmentRisks.map((risk) => risk.appointmentConfirmationStatus))
    ).toEqual(confirmationStatuses);
    expect(pendingConfirmations.length).toBeGreaterThanOrEqual(1);

    for (const risk of demoDockAppointmentRisks) {
      expect(confirmationStatuses.has(risk.appointmentConfirmationStatus)).toBe(true);
      expect(risk.confirmationOwner.trim().length).toBeGreaterThan(0);

      if (risk.status === "ready") {
        expect(risk.appointmentConfirmationStatus).toBe("confirmed");
        expect(risk.nextConfirmationDueMinutes).toBeNull();
      } else {
        expect(risk.appointmentConfirmationStatus).not.toBe("confirmed");
        expect(risk.nextConfirmationDueMinutes).not.toBeNull();
        expect(risk.nextConfirmationDueMinutes!).toBeGreaterThan(0);
        expect(risk.mitigation.toLowerCase()).toMatch(/confirm|follow-up|escalat/);
      }
    }
  });

  it("tracks gate queue wait before dock allocation", () => {
    const queuedAppointments = demoDockAppointmentRisks.filter(
      (risk) =>
        risk.gateQueueWaitMinutes !== null && risk.gateQueueWaitMinutes > 0
    );
    const notStartedAppointments = demoDockAppointmentRisks.filter(
      (risk) => risk.gateQueueWaitMinutes === null
    );

    expect(queuedAppointments.length).toBeGreaterThanOrEqual(1);
    expect(notStartedAppointments.length).toBeGreaterThanOrEqual(1);

    for (const risk of demoDockAppointmentRisks) {
      if (risk.gateQueueWaitMinutes !== null) {
        expect(risk.gateQueueWaitMinutes).toBeGreaterThanOrEqual(0);
      }

      if (risk.status === "ready") {
        expect(risk.gateQueueWaitMinutes).toBe(0);
      }
    }

    for (const risk of queuedAppointments) {
      expect(risk.status).not.toBe("ready");
      expect(risk.mitigation.toLowerCase()).toMatch(
        /gate|queue|check-in|wait/
      );
    }
  });

});
