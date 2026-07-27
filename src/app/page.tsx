import {
  demoShipments,
  demoCarriers,
  demoRoutes,
  demoTrackingEvents,
  demoMetrics,
  demoDockAppointmentRisks,
} from "@/lib/demo-data";
import type {
  Shipment,
  Carrier,
  TrackingEvent,
  Route,
  DockAppointmentRisk,
} from "@/lib/types";

// --- Reusable components ---

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "red" | "amber" | "blue" | "purple";
}) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

function ProgressBar({
  value,
  color = "indigo",
}: {
  value: number;
  color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-600",
  };
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full ${colors[color] || colors.indigo}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    in_transit: "bg-blue-400",
    delayed: "bg-red-400",
    delivered: "bg-emerald-400",
    customs_hold: "bg-amber-400",
    pending: "bg-slate-400",
    cancelled: "bg-slate-300",
  };
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${map[status] || "bg-slate-400"}`}
    />
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  const borders: Record<string, string> = {
    slate: "border-l-slate-300",
    green: "border-l-emerald-300",
    amber: "border-l-amber-300",
    red: "border-l-red-300",
    blue: "border-l-blue-300",
    purple: "border-l-indigo-300",
  };
  return (
    <div
      className={`rounded-2xl bg-white/90 p-5 shadow-sm border-l-4 ${borders[tone] || borders.slate}`}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_transit: "In Transit",
    delayed: "Delayed",
    delivered: "Delivered",
    customs_hold: "Customs Hold",
    pending: "Pending",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

function statusTone(status: string): "blue" | "red" | "green" | "amber" | "slate" | "purple" {
  const map: Record<string, "blue" | "red" | "green" | "amber" | "slate" | "purple"> = {
    in_transit: "blue",
    delayed: "red",
    delivered: "green",
    customs_hold: "amber",
    pending: "slate",
    cancelled: "slate",
  };
  return map[status] || "slate";
}

function dockStatusTone(
  status: DockAppointmentRisk["status"]
): "green" | "amber" | "red" {
  const map: Record<DockAppointmentRisk["status"], "green" | "amber" | "red"> = {
    ready: "green",
    at_risk: "amber",
    blocked: "red",
  };
  return map[status];
}

function findCarrier(id: string): Carrier | undefined {
  return demoCarriers.find((c) => c.id === id);
}

// --- Hero stats ---

function HeroStats() {
  const m = demoMetrics;
  const alertShipments = demoShipments.filter(
    (s) => s.status === "delayed" || s.status === "customs_hold"
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Active Shipments"
        value={String(m.activeShipments)}
        tone="blue"
      />
      <StatCard
        label="On-Time Rate"
        value={`${m.onTimeRate}%`}
        tone="green"
      />
      <StatCard
        label="Avg Transit"
        value={`${m.avgTransitDays} days`}
        tone="slate"
      />
      <StatCard
        label="Active Alerts"
        value={String(alertShipments.length)}
        tone="red"
      />
    </div>
  );
}

// --- Shipment tracking table ---

function ShipmentRow({ shipment }: { shipment: Shipment }) {
  const carrier = findCarrier(shipment.carrierId);
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <StatusDot status={shipment.status} />
          <span className="font-semibold text-slate-900 text-sm">
            {shipment.trackingNumber}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge tone={statusTone(shipment.status)}>
          {statusLabel(shipment.status)}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm text-slate-700">
        {shipment.origin} &rarr; {shipment.destination}
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">{carrier?.name || "—"}</td>
      <td className="py-3 px-4 text-sm text-slate-600">
        {shipment.lastKnownLocation}
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">
        {new Date(shipment.estimatedDelivery).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-slate-800">
        {formatCurrency(shipment.value)}
      </td>
    </tr>
  );
}

function ShipmentTable() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Shipment Tracking
        </h2>
        <span className="text-xs text-slate-500">
          {demoShipments.length} shipments
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-2 px-4">Tracking #</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Route</th>
              <th className="py-2 px-4">Carrier</th>
              <th className="py-2 px-4">Location</th>
              <th className="py-2 px-4">ETA</th>
              <th className="py-2 px-4">Value</th>
            </tr>
          </thead>
          <tbody>
            {demoShipments.map((s) => (
              <ShipmentRow key={s.id} shipment={s} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// --- Route optimization section ---

function RouteCard({ route }: { route: Route }) {
  const modeIcons: Record<string, string> = {
    road: "\uD83D\uDE9B",
    rail: "\uD83D\uDE82",
    air: "\u2708\uFE0F",
    sea: "\uD83D\uDEA2",
  };
  return (
    <div className="rounded-xl bg-white/80 border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-slate-900">
          {route.name}
        </span>
        {route.optimized && (
          <Badge tone="green">optimized</Badge>
        )}
      </div>
      <div className="text-xs text-slate-500 mb-2">
        {route.origin} &rarr; {route.destination}
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{route.distance.toLocaleString()} km</span>
        <span>{route.avgTransitHours}h avg</span>
        <span>
          {route.segments.map((s) => modeIcons[s.mode] || s.mode).join(" ")}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {route.segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-4">{modeIcons[seg.mode] || "•"}</span>
            <span>
              {seg.from} &rarr; {seg.to}
            </span>
            <span className="text-slate-300">{seg.distanceKm}km</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouteOptimization() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Route Optimization
        </h2>
        <Badge tone="blue">{demoRoutes.filter((r) => r.optimized).length} optimized</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoRoutes.map((r) => (
          <RouteCard key={r.id} route={r} />
        ))}
      </div>
    </Card>
  );
}

// --- Carrier performance cards ---

function CarrierCard({ carrier }: { carrier: Carrier }) {
  const perfColor =
    carrier.onTimeRate >= 90
      ? "text-emerald-600"
      : carrier.onTimeRate >= 80
        ? "text-amber-600"
        : "text-red-600";
  const statusTone =
    carrier.status === "active"
      ? "green"
      : carrier.status === "under_review"
        ? "amber"
        : "red";
  return (
    <div className="rounded-2xl bg-white/90 p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-slate-900">{carrier.name}</span>
        <Badge tone={statusTone}>{carrier.status.replace("_", " ")}</Badge>
      </div>
      <div className="text-xs text-slate-500 mb-3">
        {carrier.code} · Rating {carrier.rating}/5.0
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className={`text-lg font-bold ${perfColor}`}>
            {carrier.onTimeRate}%
          </div>
          <div className="text-xs text-slate-400">on-time</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800">
            {carrier.activeShipments}
          </div>
          <div className="text-xs text-slate-400">active</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800">
            {carrier.avgTransitDays}d
          </div>
          <div className="text-xs text-slate-400">avg transit</div>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar
          value={carrier.onTimeRate}
          color={
            carrier.onTimeRate >= 90
              ? "emerald"
              : carrier.onTimeRate >= 80
                ? "amber"
                : "red"
          }
        />
      </div>
    </div>
  );
}

function CarrierPerformance() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Carrier Performance
        </h2>
        <span className="text-xs text-slate-500">
          {demoCarriers.length} carriers
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...demoCarriers]
          .sort((a, b) => b.onTimeRate - a.onTimeRate)
          .map((c) => (
            <CarrierCard key={c.id} carrier={c} />
          ))}
      </div>
    </Card>
  );
}

// --- Delivery timeline ---

function TimelineEvent({ event }: { event: TrackingEvent }) {
  const shipment = demoShipments.find((s) => s.id === event.shipmentId);
  const icon: Record<string, string> = {
    picked_up: "\uD83D\uDCE6",
    in_transit: "\uD83D\uDE9A",
    delivered: "\u2705",
    delayed: "\u26A0\uFE0F",
    customs_hold: "\uD83D\uDEE3\uFE0F",
    departed_port: "\uD83D\uDEA2",
    arrived_port: "\uD83D\uDCF0",
  };
  const isDelayed = event.status === "delayed" || event.status === "customs_hold";
  return (
    <div
      className={`flex gap-3 items-start py-3 border-b border-slate-100 ${isDelayed ? "bg-red-50/50 -mx-2 px-2 rounded-lg" : ""}`}
    >
      <span className="text-lg mt-0.5">{icon[event.status] || "\u2022"}</span>
      <div className="flex-1">
        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-sm text-slate-900">
            {shipment?.trackingNumber || event.shipmentId}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(event.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-0.5">{event.description}</p>
        <p className="text-xs text-slate-400 mt-0.5">{event.location}</p>
      </div>
    </div>
  );
}

function DeliveryTimeline() {
  const sorted = [...demoTrackingEvents].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-900 mb-4">
        Delivery Timeline
      </h2>
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {sorted.map((e) => (
          <TimelineEvent key={e.id} event={e} />
        ))}
      </div>
    </Card>
  );
}

// --- Dock appointment readiness ---

function DockAppointmentPanel() {
  const blockedOrAtRisk = demoDockAppointmentRisks.filter(
    (risk) => risk.status !== "ready"
  ).length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Dock Appointment Readiness
        </h2>
        <Badge tone={blockedOrAtRisk > 0 ? "amber" : "green"}>
          {blockedOrAtRisk} interventions
        </Badge>
      </div>
      <div className="space-y-3">
        {demoDockAppointmentRisks.map((risk) => {
          const shipment = demoShipments.find((s) => s.id === risk.shipmentId);
          return (
            <div
              key={`${risk.shipmentId}-${risk.facility}`}
              className="rounded-xl border border-amber-100 bg-amber-50/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-slate-900">
                    {risk.facility}
                  </p>
                  <p className="text-xs text-slate-500">
                    {shipment?.trackingNumber || risk.shipmentId} · {risk.appointmentWindow}
                  </p>
                </div>
                <Badge tone={dockStatusTone(risk.status)}>
                  {risk.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-slate-500 sm:grid-cols-3">
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.etaMinutesAway}m
                  </div>
                  <div>live ETA</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.dockTurnMinutes}m/{risk.appointmentSlotMinutes}m
                  </div>
                  <div>turn / slot</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.freightStaged ? "yes" : "no"}
                  </div>
                  <div>freight staged</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.checkInMode}
                  </div>
                  <div>check-in</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.gateValidationStatus.replace("_", " ")}
                  </div>
                  <div>gate validation</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.preArrivalPacketStatus.replaceAll("_", " ")}
                  </div>
                  <div>pre-arrival packet</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.sealVerificationStatus.replaceAll("_", " ")}
                  </div>
                  <div>trailer seal</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.assignedDockDoor ?? "no door"}
                  </div>
                  <div>{risk.dockDoorAssignmentStatus.replaceAll("_", " ")}</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.dockFlowDirection}
                  </div>
                  <div>{risk.dockDoorFlowConflict.replaceAll("_", " ")}</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.laborReadiness.replaceAll("_", " ")}
                  </div>
                  <div>unload crew</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.equipmentReadiness.replaceAll("_", " ")}
                  </div>
                  <div>dock equipment</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.trailerSpottingStatus.replaceAll("_", " ")}
                  </div>
                  <div>
                    {risk.spotMoveEtaMinutes === null
                      ? "move ETA unplanned"
                      : risk.spotMoveEtaMinutes === 0
                        ? "at dock"
                        : `spot in ${risk.spotMoveEtaMinutes}m`}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-slate-600">
                    {risk.spotMoveWaitMinutes === null
                      ? `call-to-door not started · ${risk.spotMoveSlaMinutes}m target`
                      : `projected ${risk.spotMoveWaitMinutes + (risk.spotMoveEtaMinutes ?? 0)}m / ${risk.spotMoveSlaMinutes}m target`}
                  </div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.rescheduleByMinutes
                      ? `${risk.rescheduleByMinutes}m`
                      : "monitor"}
                  </div>
                  <div>rebook SLA</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.cutoffRiskMinutes ? `${risk.cutoffRiskMinutes}m` : "clear"}
                  </div>
                  <div>cutoff risk</div>
                </div>
                <div className="rounded-lg bg-white/70 p-2">
                  <div className="font-bold text-slate-800">
                    {risk.receiverConstraint.replace("_", " ")}
                  </div>
                  <div>constraint</div>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-amber-800">
                {risk.mitigation}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// --- Alert panel ---

function AlertPanel() {
  const alerts = demoShipments.filter(
    (s) => s.status === "delayed" || s.status === "customs_hold"
  );
  if (alerts.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Active Alerts
        </h2>
        <p className="text-sm text-slate-500">No active alerts. All shipments on track.</p>
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Active Alerts</h2>
        <Badge tone="red">{alerts.length} problems</Badge>
      </div>
      <div className="space-y-3">
        {alerts.map((s) => {
          const events = demoTrackingEvents.filter(
            (e) => e.shipmentId === s.id
          );
          const latest = events
            .filter((e) => e.status === "delayed" || e.status === "customs_hold")
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )[0];
          return (
            <div
              key={s.id}
              className="rounded-xl border border-red-100 bg-red-50/60 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <StatusDot status={s.status} />
                <span className="font-semibold text-sm text-slate-900">
                  {s.trackingNumber}
                </span>
                <Badge tone="red">{statusLabel(s.status)}</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-1">
                {s.origin} &rarr; {s.destination}
              </p>
              {latest && (
                <p className="text-xs text-red-600 font-medium">
                  {latest.description}
                </p>
              )}
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>
                  {findCarrier(s.carrierId)?.name || s.carrierId}
                </span>
                <span>
                  ETA:{" "}
                  {new Date(s.estimatedDelivery).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// --- Main page ---

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-6 py-8 font-sans text-slate-900 antialiased">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Logistics AI Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shipment tracking · route optimization · carrier management · freight
          analytics
        </p>
      </header>

      {/* Hero stats */}
      <HeroStats />

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <ShipmentTable />
          <CarrierPerformance />
          <RouteOptimization />
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <DockAppointmentPanel />
          <AlertPanel />
          <DeliveryTimeline />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400">
        Logistics AI Dashboard · Portfolio demonstration · All data is
        fictional · No production keys or network calls
      </footer>
    </div>
  );
}
