"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { refreshWarehouse, sites } from "../../dist/analytics-data.mjs";
import styles from "./walkthrough.module.css";

const nodes = {
  apps: { title: "Business Apps", caption: "Owner portal · Admin CRM", detail: "The portal captures interest. Staff record the viewing, explanation and handover in the CRM." },
  lake: { title: "Raw imports (Data Lake)", caption: "Campaign and roster files", detail: "This is where original campaign and roster files would be kept so the team can process them again. The demo uses sample records." },
  external: { title: "External APIs", caption: "Future connections", detail: "LINE, point of sale and advertising APIs can supply source records after the pilot." },
  events: { title: "Real-time Data", caption: "Operational events", detail: "The handover changes the operational record immediately. Reports reflect it once the warehouse refreshes." },
  agent: { title: "Data Agent", caption: "ELT run & checks", detail: "The workflow reads source records, loads the warehouse and transforms them into reporting marts. This node represents a controlled job with a run log." },
  warehouse: { title: "Data Warehouse", caption: "Shared records · Supabase in pilot", detail: "The warehouse links the enquiry, animal, campaign, showroom and sale. This walkthrough computes the snapshot locally." },
  sales: { title: "Sales mart", caption: "Handovers · Revenue", detail: "Completed sales by route, with revenue and contribution after direct costs." },
  marketing: { title: "Marketing mart", caption: "Campaign attribution", detail: "The tracked enquiry source is kept separate from the sales route. The handover rolls up under its source." },
  operations: { title: "Operations mart", caption: "Availability · Roster", detail: "Once handed over, the animal exits sale-ready inventory. Roster hours feed a site staffing comparison." },
  forecast: { title: "Forecast job", caption: "Python on GitHub Actions in pilot", detail: "The planned Python job reads the reporting data and writes a forecast back to Supabase. This walkthrough computes the sample forecast in your browser." },
} as const;

type NodeId = keyof typeof nodes;

const steps: {
  title: string;
  action: string;
  description: string;
  teamView: string;
  businessUse: string;
  nodes: readonly NodeId[];
}[] = [
  {
    title: "Buyer enquiry",
    action: "Submit sample enquiry",
    description: "A buyer finds Mugi through a LINE campaign and registers interest.",
    teamView: "Sales sees which animal the buyer asked about and how they found the shop. If the source is missing, the enquiry is marked unattributed.",
    businessUse: "Staff can follow up from one queue and see which enquiries still need a viewing booked.",
    nodes: ["apps", "warehouse"],
  },
  {
    title: "Import source files",
    action: "Load sample files",
    description: "Stage the campaign spend and Tokyo showroom roster.",
    teamView: "Marketing supplies spend by campaign and period. Operations supplies roster hours by site and week. This demo loads one sample record from each.",
    businessUse: "Use spend to compare acquisition costs and roster hours to spot coverage gaps. In the pilot, the team would review unmatched campaign or site records before using the totals.",
    nodes: ["lake", "warehouse"],
  },
  {
    title: "Viewing and handover",
    action: "Record sample handover",
    description: "Record qualification, the viewing, the in-person explanation and the completed sale.",
    teamView: "Showroom staff record the viewing, the in-person explanation and the actual handover. The completed sale links to the original enquiry and animal.",
    businessUse: "See who is still considering a purchase, which animals have been handed over, and when each sale was completed.",
    nodes: ["apps", "events"],
  },
  {
    title: "Warehouse refresh",
    action: "Run sample ELT",
    description: "Link the enquiry, sale, animal and site, then rebuild the reports.",
    teamView: "The refresh shows how many records it loaded and which handover it linked. Run it twice and the sale still counts once.",
    businessUse: "Use one set of linked records for the weekly review. In the pilot, a failed refresh would leave the last successful report available and flag it as stale.",
    nodes: ["lake", "agent", "warehouse"],
  },
  {
    title: "Trace the reports",
    action: "Show the three marts",
    description: "Check how the same handover changes Sales, Marketing and Operations.",
    teamView: "Sales sees revenue and contribution after direct costs. Marketing credits the tracked campaign. Operations sees one fewer animal available for sale.",
    businessUse: "Compare sales routes, decide where to spend the next marketing yen, and plan available stock by site using the same underlying handover.",
    nodes: ["warehouse", "sales", "marketing", "operations"],
  },
  {
    title: "Viewing forecast",
    action: "Run sample forecast",
    description: "Estimate next week’s showroom attendance and compare it with a booking-based baseline.",
    teamView: "The manager sees expected attendance for the next seven days alongside the estimate based on current bookings. A live pilot needs attendance, cancellation and no-show records.",
    businessUse: "Set aside enough showroom time for viewings. Use the model only if it improves on the booking estimate when checked against real attendance.",
    nodes: ["forecast", "warehouse", "apps"],
  },
];

const inventory = [{ id: "AN-088", site: "tokyo", status: "Available" }];
const enquiry = {
  id: "ENQ-DEMO-001",
  animalId: "AN-088",
  channel: "line",
  site: "tokyo",
  events: [
    "2026-11-25T01:00:00Z", "2026-11-25T03:00:00Z", "2026-11-26T02:00:00Z",
    "2026-11-28T02:00:00Z", "2026-11-28T03:00:00Z",
  ],
  sale: { route: "Tokyo showroom", price: 480000, cost: 165000 },
};
const sources = {
  additionalSpend: [{ month: "2026-11", channel: "line", amount: 120000 }],
  siteRecords: sites.map(site => site.id === "tokyo" ? { ...site, rosterHours: 140 } : site),
};
const before = refreshWarehouse([], inventory);
const yen = new Intl.NumberFormat("en-JP", { style: "currency", currency: "JPY" });
const historicalWeeks = [
  { prebooked: 8, attendedFromPrebooking: 6, lateAttendance: 2 },
  { prebooked: 11, attendedFromPrebooking: 8, lateAttendance: 3 },
  { prebooked: 13, attendedFromPrebooking: 9, lateAttendance: 3 },
  { prebooked: 15, attendedFromPrebooking: 11, lateAttendance: 4 },
  { prebooked: 19, attendedFromPrebooking: 14, lateAttendance: 5 },
  { prebooked: 22, attendedFromPrebooking: 16, lateAttendance: 6 },
];

function sampleForecast() {
  const nextWeekBookings = 18;
  const rows = historicalWeeks.map(week => ({
    bookings: week.prebooked,
    attended: week.attendedFromPrebooking + week.lateAttendance,
  }));
  const totalBookings = rows.reduce((sum, row) => sum + row.bookings, 0);
  const meanBookings = totalBookings / rows.length;
  const meanAttendance = rows.reduce((sum, row) => sum + row.attended, 0) / rows.length;
  const slope = rows.reduce((sum, row) => sum + (row.bookings - meanBookings) * (row.attended - meanAttendance), 0)
    / rows.reduce((sum, row) => sum + (row.bookings - meanBookings) ** 2, 0);
  const historicalShowRate = historicalWeeks.reduce((sum, week) => sum + week.attendedFromPrebooking, 0) / totalBookings;
  const lateAttendance = historicalWeeks.reduce((sum, week) => sum + week.lateAttendance, 0) / rows.length;
  return {
    bookings: nextWeekBookings,
    predicted: Math.round(meanAttendance + slope * (nextWeekBookings - meanBookings)),
    baseline: Math.round(nextWeekBookings * historicalShowRate + lateAttendance),
  };
}

export function DataPlatformDemo() {
  const [completed, setCompleted] = useState(0);
  const [selected, setSelected] = useState(0);
  const [inspected, setInspected] = useState<NodeId | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [snapshot, setSnapshot] = useState<typeof before | null>(null);
  const [forecast, setForecast] = useState<ReturnType<typeof sampleForecast> | null>(null);
  const [playback, setPlayback] = useState<"idle" | "playing" | "paused">("idle");
  const diagramPanel = useRef<HTMLElement>(null);
  const activeStep = steps[selected];
  const remaining = completed < steps.length;

  const runElt = useCallback(() => {
    setSnapshot(refreshWarehouse([enquiry], inventory, sources));
    setRunCount(count => count + 1);
  }, []);

  const advance = useCallback(() => {
    if (!remaining) return;
    if (completed === 3) runElt();
    if (completed === 5) {
      setForecast(sampleForecast());
      setPlayback("idle");
    }
    setSelected(completed);
    setInspected(null);
    setCompleted(completed + 1);
  }, [completed, remaining, runElt]);

  useEffect(() => {
    if (playback !== "playing" || !remaining) return;
    const timer = window.setTimeout(advance, completed === 0 ? 800 : 6200);
    return () => window.clearTimeout(timer);
  }, [advance, completed, playback, remaining]);

  function reset() {
    setPlayback("idle");
    setCompleted(0);
    setSelected(0);
    setInspected(null);
    setRunCount(0);
    setSnapshot(null);
    setForecast(null);
  }

  function pauseForInspection() {
    if (playback === "playing") setPlayback("paused");
  }

  function togglePlayback() {
    if (playback === "playing") {
      setPlayback("paused");
      return;
    }
    if (!remaining) reset();
    setInspected(null);
    setSelected(Math.max(0, remaining ? completed - 1 : 0));
    setPlayback("playing");
    if (window.matchMedia("(max-width: 690px)").matches) {
      diagramPanel.current?.scrollIntoView({ block: "start" });
    }
  }

  function node(id: NodeId) {
    const info = nodes[id];
    const signalOrder = activeStep.nodes.indexOf(id);
    return (
      <button key={id} type="button" className={styles.node}
        data-active={signalOrder >= 0}
        data-future={id === "external"} aria-pressed={inspected === id}
        onClick={() => { pauseForInspection(); setInspected(id === inspected ? null : id); }}>
        {signalOrder >= 0 && showTraces && (
          <span className={styles.nodeSignal} key={selected + "-" + completed + "-" + runCount}
            style={{ animationDelay: signalOrder * 140 + "ms" }} aria-hidden="true" />
        )}
        <strong>{info.title}</strong>
        <span>{info.caption}</span>
      </button>
    );
  }

  const directSales = snapshot && snapshot.sales[0].sales - before.sales[0].sales;
  const lineSales = snapshot && snapshot.marketing[1].sales - before.marketing[1].sales;
  const sceneNotes = [
    "Ready to trace a showroom enquiry",
    "LINE enquiry captured for the Tokyo showroom",
    "Campaign spend and showroom roster loaded",
    "Mugi handed over · " + yen.format(enquiry.sale.price) + " sale",
    "Warehouse refreshed · One linked handover",
    "One handover updates all three reports",
    forecast ? forecast.predicted + " expected visits · " + forecast.baseline + " booking baseline" : "",
  ];
  const pathsByStep = [
    [0, 1], [0, 1], [0], [1, 2], [2], [3],
  ];
  const showTraces = selected < completed && inspected === null;
  const playLabel = playback === "playing" ? "Pause presentation"
    : !remaining ? "Replay presentation"
    : playback === "paused" ? "Resume presentation" : "Play presentation";

  function connector(index: number, branches?: "two" | "three") {
    const lit = showTraces && pathsByStep[selected].includes(index);
    return (
      <div className={styles.connector} data-branches={branches} data-lit={lit} aria-hidden="true">
        {lit && <span className={styles.packet} key={selected + "-" + completed + "-" + runCount} />}
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">Tokyo Pet OS</a>
        <nav aria-label="Tokyo Pet OS">
          <a href="/">Home</a><a href="/crm#reports">CRM analytics</a>
        </nav>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Data Platform Demo</h1>
          <p>Raw files come in → ELT links them to CRM records → reports show what happened → the forecast helps plan next week.</p>
          <p className={styles.dataNote}>Interactive simulation · Synthetic data · Runs in this browser</p>
        </div>
        <div className={styles.presentationControl}>
          <button className={styles.playButton} type="button" onClick={togglePlayback}>
            <span className={styles.playIcon} data-pausing={playback === "playing"} aria-hidden="true" />
            {playLabel}
          </button>
        </div>
        <div className={styles.workbench} data-playback={playback}>
          <section className={styles.actions} aria-labelledby="walkthrough-actions">
            <h2 id="walkthrough-actions">Demo actions</h2>
            <div className={styles.progress}>
              <label htmlFor="demo-progress">{completed} of {steps.length} actions complete</label>
              <progress id="demo-progress" value={completed} max={steps.length} />
            </div>
            <div className={styles.controls}>
              {remaining ? <button className={styles.primary} type="button" onClick={() => { setPlayback("idle"); advance(); }}>{steps[completed].action}</button>
                : <button className={styles.textButton} type="button" onClick={reset}>Restart demo</button>}
              {completed > 0 && remaining && <button className={styles.textButton} type="button" onClick={reset}>Reset</button>}
            </div>
            <p className={styles.linkedNodes}>Linked nodes · {activeStep.nodes.map(id => nodes[id].title).join(" · ")}</p>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li key={step.title}>
                  <button type="button" className={styles.step} aria-current={selected === index ? "step" : undefined}
                    onClick={() => { pauseForInspection(); setSelected(index); setInspected(null); }}>
                    <strong>{step.title}</strong>
                    <span>{index < completed ? "Done" : index === completed ? "Next" : "Preview"}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className={styles.expectation} aria-live="polite" aria-atomic="true">
              <h3>What to expect</h3>
              <p className={styles.expectationStep}>{activeStep.title}</p>
              <dl>
                <dt>What the team sees</dt>
                <dd>{activeStep.teamView}</dd>
                <dt>How the business uses it</dt>
                <dd>{activeStep.businessUse}</dd>
              </dl>
            </div>
          </section>
          <section ref={diagramPanel} className={styles.diagramPanel} aria-labelledby="architecture-heading">
            <div className={styles.diagramHeader}>
              <h2 id="architecture-heading">Carson’s diagram</h2>
              <p>Select a node to inspect its role.</p>
            </div>
            <div className={styles.scene} aria-live="polite">
              <span className={styles.sceneCounter}>{String(completed).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
              <strong key={completed} className={completed ? styles.sceneArrival : undefined}>{sceneNotes[completed]}</strong>
            </div>
            <div className={styles.diagram} aria-label="Data platform architecture">
              <div className={styles.triple}>{node("apps")}{node("lake")}{node("external")}</div>
              {connector(0, "three")}
              <div className={styles.double}>{node("events")}{node("agent")}</div>
              {connector(1, "two")}
              <div className={styles.single}>{node("warehouse")}</div>
              {connector(2, "three")}
              <div className={styles.triple}>{node("sales")}{node("marketing")}{node("operations")}</div>
              {connector(3)}
              <div className={styles.single}>{node("forecast")}</div>
            </div>
            <div className={styles.inspector} aria-live="polite">
              <strong>{inspected ? nodes[inspected].title : activeStep.title}</strong>
              <p>{inspected ? nodes[inspected].detail : activeStep.description}</p>
            </div>
          </section>
          <section className={styles.results} aria-labelledby="demo-result">
            <h2 id="demo-result">Demo result</h2>
            <div aria-live="polite">
              {completed === 0 && <p>Submit the sample enquiry to start tracing the records.</p>}
              {completed === 1 && <p><strong>{enquiry.id}</strong> · Mugi · Tokyo showroom · LINE campaign</p>}
              {completed === 2 && <p>2 sample records staged · LINE spend {yen.format(sources.additionalSpend[0].amount)} · Tokyo roster {sources.siteRecords[0].rosterHours} hours/week</p>}
              {completed === 3 && <p><strong>Handover recorded</strong> · {enquiry.id} · {yen.format(enquiry.sale.price)}. The next warehouse refresh will update the reports.</p>}
              {snapshot && (completed === 4 || selected === 3) && (
                <p>ELT run {runCount} · {snapshot.loadedRows} source rows loaded · {directSales} new sale linked to {enquiry.id}. {runCount > 1 && "Rerun complete. The handover still counts once."}</p>
              )}
              {snapshot && completed >= 5 && (
                <dl className={styles.metrics}>
                  <div><dt>Sales mart</dt><dd>+{directSales} handover</dd><small>{yen.format(snapshot.sales[0].revenue - before.sales[0].revenue)} revenue · {yen.format(snapshot.sales[0].contribution - before.sales[0].contribution)} contribution</small></div>
                  <div><dt>Marketing mart</dt><dd>+{lineSales} LINE handover</dd><small>Attributed to the enquiry’s source</small></div>
                  <div><dt>Operations mart</dt><dd>{snapshot.operations[0].ready - before.operations[0].ready} sale-ready animal</dd><small>Mugi removed from available stock</small></div>
                </dl>
              )}
              {forecast && (
                <div className={styles.forecast}>
                  <h3>Next week · Tokyo showroom</h3>
                  <p><strong>{forecast.predicted} expected viewings</strong> · {forecast.baseline} booking baseline · {forecast.bookings} prebooked</p>
                  <small>Illustrative regression fitted to six synthetic weeks. The pilot would run Python on GitHub Actions.</small>
                </div>
              )}
            </div>
            {snapshot && <button className={styles.textButton} type="button" onClick={() => { setPlayback("idle"); runElt(); setSelected(3); setInspected(null); }}>Rerun ELT</button>}
          </section>
        </div>
      </main>
    </div>
  );
}
