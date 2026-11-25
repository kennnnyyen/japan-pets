import { advanceEnquiry, compareExpansion, readEnquiries, refreshWarehouse, stages } from "./analytics-data.mjs";

const integer = new Intl.NumberFormat("en-JP");
const yen = new Intl.NumberFormat("en-JP", { style: "currency", currency: "JPY" });
const decimal = new Intl.NumberFormat("en-JP", { maximumFractionDigits: 1 });
const time = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Tokyo",
});
const actions = ["Qualify enquiry", "Book viewing", "Record in-person explanation", "Complete handover"];

function element(tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function renderTable(container, name, headers, rows) {
  const region = element("div", undefined, {
    class: "analytics-table", role: "region", "aria-label": name, tabindex: "0",
  });
  const table = element("table", undefined, { "aria-label": name });
  const thead = table.createTHead().insertRow();
  headers.forEach(header => thead.append(element("th", header, { scope: "col" })));
  const tbody = table.createTBody();
  for (const values of rows) {
    const row = tbody.insertRow();
    row.append(element("th", values[0], { scope: "row" }));
    values.slice(1).forEach(value => row.append(element("td", value)));
  }
  region.append(table);
  container.replaceChildren(region);
}

function currency(value) {
  return value === null ? "—" : yen.format(value);
}

function exportCsv(rows) {
  const content = [
    "month_jst,site_id,enquiries,viewings_booked,handovers",
    ...rows.map(row => [row.month, row.site, row.enquiries, row.viewings, row.handovers].join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = element("a", undefined, { href: url, download: "tokyo-pet-demo-monthly-activity.csv" });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function initializeAnalytics(root, animals) {
  const find = id => root.querySelector("#" + id);
  const inventory = [
    ...animals.map(animal => ({ ...animal, site: "tokyo" })),
    { id: "AN-K01", site: "kasama", status: "Awaiting transfer" },
    { id: "AN-K02", site: "kasama", status: "Health hold" },
    { id: "AN-K03", site: "kasama", status: "Available" },
  ];
  const enquiryStatus = find("analytics-enquiry-status");
  const warehouseStatus = find("warehouse-status");
  const enquiryList = find("analytics-enquiries");
  let snapshot;

  function renderEnquiries(records, focusId) {
    const articles = records.map(record => {
      const animal = animals.find(item => item.id === record.animalId);
      const article = element("article", undefined, { class: "analytics-enquiry" });
      const summary = element("div");
      const stage = record.events.length;
      summary.append(
        element("strong", (animal?.name ?? record.animalId) + " · " + record.id.slice(0, 8)),
        element("small", stages[stage - 1] + " · " + time.format(new Date(record.events.at(-1))) + " JST"),
      );
      article.append(summary);
      if (stage === stages.length) {
        summary.append(element("small", "Completed demo sale · " + currency(record.sale.price)));
        if (focusId === record.id) summary.tabIndex = -1;
        return article;
      }
      const form = element("form", undefined, { class: "analytics-enquiry-actions" });
      if (stage === stages.length - 1) {
        const fields = [
          { label: "Sale price (¥)", name: "price", value: animal?.price.replace(/\D/g, "") ?? "", min: "1" },
          { label: "Direct cost (¥)", name: "cost", value: "165000", min: "0" },
        ];
        for (const { label, name, value, min } of fields) {
          const field = element("label", label);
          field.append(element("input", undefined, { name, type: "number", min, value, step: "1", required: "" }));
          form.append(field);
        }
      }
      const button = element("button", actions[stage - 1], { class: "secondary", type: "submit" });
      if (focusId === record.id) button.dataset.restoreFocus = "";
      form.append(button);
      form.addEventListener("submit", event => {
        event.preventDefault();
        const values = new FormData(form);
        try {
          const updated = advanceEnquiry(window.localStorage, record.id, stage, {
            price: Number(values.get("price")), cost: Number(values.get("cost")),
          });
          renderEnquiries(readEnquiries(window.localStorage), record.id);
          const message = stages[updated.events.length - 1] + ". Refresh the warehouse to update reports.";
          enquiryStatus.textContent = message;
          warehouseStatus.textContent = "Source activity changed. Refresh to update the marts.";
        } catch (error) {
          enquiryStatus.textContent = error.message + " Refresh the warehouse to review the latest records.";
        }
      });
      article.append(form);
      return article;
    });
    enquiryList.replaceChildren(...(articles.length ? articles : [
      element("p", "No portal enquiries recorded in this browser yet."),
    ]));
    enquiryList.querySelector("[data-restore-focus], [tabindex='-1']")?.focus();
  }

  function refresh() {
    try {
      const records = readEnquiries(window.localStorage);
      snapshot = refreshWarehouse(records, inventory);
      renderEnquiries(records);
      find("warehouse-rows").textContent = integer.format(snapshot.loadedRows) + " source rows loaded";
      warehouseStatus.textContent = "Refreshed " + time.format(new Date()) + " JST · Synthetic data";
      enquiryStatus.textContent = "";
      const funnel = snapshot.funnel.map(item => {
        const card = element("div");
        card.append(element("strong", integer.format(item.count)), element("span", item.stage));
        return card;
      });
      find("analytics-funnel").replaceChildren(...funnel);
      const viewings = snapshot.funnel[2].count;
      const handovers = snapshot.funnel[4].count;
      find("sales-conversion").textContent = viewings
        ? decimal.format(handovers / viewings * 100) + "% of booked viewing records reached handover (" + handovers + " of " + viewings + ")."
        : "Viewing-to-handover conversion is unavailable.";
      const showroom = snapshot.sales[0];
      if (showroom.sales) {
        find("scenario-contribution").textContent = "Observed showroom contribution in the demo mart averages "
          + currency(showroom.contribution / showroom.sales) + " per sale. You can enter this value below.";
      }
      renderTable(find("sales-mart"), "Sales by route",
        ["Sales route", "Handovers", "Revenue", "Contribution"],
        snapshot.sales.map(row => [row.route, row.sales, currency(row.revenue), currency(row.contribution)]));
      renderTable(find("marketing-mart"), "Marketing by source",
        ["Source", "Tracked spend", "Enquiries", "Qualified", "Handovers", "Cost per sale"],
        snapshot.marketing.map(row => [row.channel, currency(row.spend), row.enquiries, row.qualified, row.sales, currency(row.costPerSale)]));
      renderTable(find("operations-mart"), "Operations by site",
        ["Site", "Sale-ready", "Health holds", "Awaiting transfer", "Demo handovers",
          "Enquiry to handover", "Care FTE headroom", "Facility slots open"],
        snapshot.operations.map(row => [row.name, row.ready, row.onHold, row.transfers, row.handovers,
          row.averagePlacementDays === null ? "—" : decimal.format(row.averagePlacementDays) + " days",
          decimal.format(row.staffingHeadroom), row.facilityHeadroom]));
      find("analytics-export").disabled = false;
    } catch {
      warehouseStatus.textContent = "The refresh failed. Check browser storage and try again.";
    }
  }

  function updateScenario() {
    const values = new FormData(find("expansion-inputs"));
    const plans = compareExpansion({
      demand: Number(values.get("demand")),
      delay: Number(values.get("delay")),
      startingCash: Number(values.get("startingCash")) * 1000000,
      contribution: Number(values.get("contribution")),
    });
    renderTable(find("scenario-report"), "12-month scenario results",
      ["Plan", "Closing cash", "Lowest cash", "First cash shortfall", "Unmet demand"],
      plans.map(plan => [plan.name, currency(plan.cash), currency(plan.minimumCash),
        plan.firstShortfall === null ? "None in 12 months"
          : plan.firstShortfall === 0 ? "At investment" : "Month " + plan.firstShortfall, plan.unservedDemand]));
    renderTable(find("scenario-assumptions"), "Scenario assumptions",
      ["Plan", "Upfront spend", "Monthly fixed costs", "Opening month", "Monthly capacity before", "Monthly capacity after"],
      plans.map(plan => [plan.name, currency(plan.upfront), currency(plan.monthly),
        plan.opening, plan.before, plan.after]));
  }

  find("warehouse-refresh").addEventListener("click", refresh);
  find("analytics-export").addEventListener("click", () => {
    if (snapshot) exportCsv(snapshot.monthlyActivity);
  });
  find("expansion-inputs").addEventListener("submit", event => {
    event.preventDefault();
    updateScenario();
    find("scenario-status").textContent = "Scenario results updated.";
  });
  window.addEventListener("storage", () => {
    warehouseStatus.textContent = "Browser data changed. Refresh to load the latest demo records.";
  });
  updateScenario();
  refresh();
}
