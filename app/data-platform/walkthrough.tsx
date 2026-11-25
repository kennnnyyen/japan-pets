"use client";

import { useState } from "react";
import { refreshWarehouse, sites } from "../../dist/analytics-data.mjs";
import styles from "./walkthrough.module.css";

const nodes = {
  apps: { title: "Business Apps", caption: "Owner portal · Admin CRM", detail: "The portal captures interest. Staff record the viewing, explanation and handover in the CRM." },
  lake: { title: "Data Lake", caption: "Raw imports", detail: "The POC stages sample campaign spend and roster files. In a pilot, the raw records can live in a separate Supabase schema." },
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

const steps: { title: string; action: string; description: string; nodes: readonly NodeId[] }[] = [
  { title: "Buyer enquiry", action: "Submit sample enquiry", description: "A buyer finds Mugi through a LINE campaign and registers interest.", nodes: ["apps", "warehouse"] },
  { title: "Import source files", action: "Load sample files", description: "Stage the campaign spend and Tokyo showroom roster.", nodes: ["lake", "warehouse"] },
  { title: "Viewing and handover", action: "Record sample handover", description: "Record qualification, the viewing, the in-person explanation and the completed sale.", nodes: ["apps", "events"] },
  { title: "Warehouse refresh", action: "Run sample ELT", description: "Link the enquiry, sale, animal and site, then rebuild the reports.", nodes: ["lake", "agent", "warehouse"] },
  { title: "Trace the reports", action: "Show the three marts", description: "Check how the same handover changes Sales, Marketing and Operations.", nodes: ["warehouse", "sales", "marketing", "operations"] },
  { title: "Viewing forecast", action: "Run sample forecast", description: "Estimate next week’s showroom attendance and compare it with a booking-based baseline.", nodes: ["forecast", "warehouse", "apps"] },
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
  const activeStep = steps[selected];
  const remaining = completed < steps.length;

  function runElt() {
    setSnapshot(refreshWarehouse([enquiry], inventory, sources));
    setRunCount(count => count + 1);
  }

  function advance() {
    if (!remaining) return;
    if (completed === 3) runElt();
    if (completed === 5) setForecast(sampleForecast());
    setSelected(completed);
    setInspected(null);
    setCompleted(completed + 1);
  }

  function reset() {
    setCompleted(0);
    setSelected(0);
    setInspected(null);
    setRunCount(0);
    setSnapshot(null);
    setForecast(null);
  }

  function node(id: NodeId) {
    const info = nodes[id];
    return (
      <button key={id} type="button" className={styles.node}
        data-active={activeStep.nodes.includes(id)}
        data-future={id === "external"} aria-pressed={inspected === id}
        onClick={() => setInspected(id === inspected ? null : id)}>
        <strong>{info.title}</strong>
        <span>{info.caption}</span>
      </button>
    );
  }

  const directSales = snapshot && snapshot.sales[0].sales - before.sales[0].sales;
  const lineSales = snapshot && snapshot.marketing[1].sales - before.marketing[1].sales;

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
          <p>Walk one Tokyo showroom enquiry through Carson’s diagram, from the first contact to reporting and a viewing forecast.</p>
          <p className={styles.dataNote}>Interactive simulation · Synthetic data · Runs in this browser</p>
        </div>
        <div className={styles.workbench}>
          <section className={styles.actions} aria-labelledby="walkthrough-actions">
            <h2 id="walkthrough-actions">Demo actions</h2>
            <div className={styles.progress}>
              <label htmlFor="demo-progress">{completed} of {steps.length} actions complete</label>
              <progress id="demo-progress" value={completed} max={steps.length} />
            </div>
            <div className={styles.controls}>
              {remaining ? <button className={styles.primary} type="button" onClick={advance}>{steps[completed].action}</button>
                : <button className={styles.primary} type="button" onClick={reset}>Restart demo</button>}
              {completed > 0 && remaining && <button className={styles.textButton} type="button" onClick={reset}>Reset</button>}
            </div>
            <p className={styles.linkedNodes}>Linked nodes · {activeStep.nodes.map(id => nodes[id].title).join(" · ")}</p>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li key={step.title}>
                  <button type="button" className={styles.step} aria-current={selected === index ? "step" : undefined}
                    onClick={() => { setSelected(index); setInspected(null); }}>
                    <strong>{step.title}</strong>
                    <span>{index < completed ? "Done" : index === completed ? "Next" : "Preview"}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <section className={styles.diagramPanel} aria-labelledby="architecture-heading">
            <div className={styles.diagramHeader}>
              <h2 id="architecture-heading">Carson’s diagram</h2>
              <p>Select a node to inspect its role.</p>
            </div>
            <div className={styles.diagram} aria-label="Data platform architecture">
              <div className={styles.triple}>{node("apps")}{node("lake")}{node("external")}</div>
              <div className={styles.connector} data-branches="three" aria-hidden="true" />
              <div className={styles.double}>{node("events")}{node("agent")}</div>
              <div className={styles.connector} data-branches="two" aria-hidden="true" />
              <div className={styles.single}>{node("warehouse")}</div>
              <div className={styles.connector} data-branches="three" aria-hidden="true" />
              <div className={styles.triple}>{node("sales")}{node("marketing")}{node("operations")}</div>
              <div className={styles.connector} aria-hidden="true" />
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
                  <div><dt>Sales mart</dt><dd>+{directSales} handover</dd><small>{yen.format(snapshot.sales[0].revenue - before.sales[0].revenue)} in revenue</small></div>
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
            {snapshot && <button className={styles.textButton} type="button" onClick={() => { runElt(); setSelected(3); setInspected(null); }}>Rerun ELT</button>}
          </section>
        </div>
      </main>
    </div>
  );
}
