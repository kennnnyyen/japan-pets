const enquiryPrefix = "tokyo-pet.analytics.v1.enquiry.";
export const stages = ["Enquiry", "Qualified", "Viewing booked", "Explanation recorded", "Handed over"];
export const sites = [
  { id: "tokyo", name: "Tokyo showroom", plannedCareFte: 3, rosterHours: 140, animalSlots: 12 },
  { id: "kasama", name: "Kasama · Building A", plannedCareFte: 8, rosterHours: 300, animalSlots: 32 },
];
const channels = [
  { id: "search", name: "Google Search", spend: 210000 },
  { id: "line", name: "LINE campaign", spend: 120000 },
  { id: "instagram", name: "Instagram", spend: 95000 },
  { id: "portal", name: "Portal · direct visit", spend: 0 },
  { id: "unknown", name: "Unattributed", spend: null },
];
const routes = ["Tokyo showroom", "Breeder-direct", "Auction"];
const historicalMonths = ["2026-08", "2026-09", "2026-10"];
const historicalEnquiries = historicalMonths.flatMap((month, index) =>
  Array.from({ length: 18 + index * 4 }, (_, number) => {
    const stage = [4, 3, 4, 2, 1, 0, 4, 1, 4, 2, 0][(number + index) % 11];
    const route = stage === 4 ? routes[number % routes.length] : null;
    const date = day => month + "-" + String(day).padStart(2, "0") + "T01:00:00.000Z";
    return {
      id: month + "-" + number, site: number % 3 === 0 ? "kasama" : "tokyo",
      channel: channels[(number + index) % channels.length].id,
      events: stages.slice(0, stage + 1).map((_, offset) => date(4 + offset * 3)),
      sale: route && { route, price: route === "Auction" ? 130000 : 360000, cost: 165000 },
    };
  })
);
const campaignSpend = historicalMonths.flatMap(month => channels
  .filter(channel => channel.spend !== null)
  .map(channel => ({ month, channel: channel.id, amount: channel.spend })));

export function readEnquiries(storage) {
  const records = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(enquiryPrefix)) continue;
    const record = JSON.parse(storage.getItem(key));
    if (record?.id && record.animalId && Array.isArray(record.events)) records.push(record);
  }
  return records.sort((a, b) => b.events[0].localeCompare(a.events[0]));
}

export function captureEnquiry(storage, { animalId, campaign, date = new Date(), id = crypto.randomUUID() }) {
  const channel = channels.find(item => item.id === campaign && item.spend > 0);
  const record = {
    id, animalId, channel: channel?.id ?? (campaign ? "unknown" : "portal"),
    site: "tokyo", events: [date.toISOString()], sale: null,
  };
  storage.setItem(enquiryPrefix + id, JSON.stringify(record));
  return record;
}

export function advanceEnquiry(storage, id, expectedStage, { price, cost, date = new Date() } = {}) {
  const records = readEnquiries(storage);
  const record = records.find(item => item.id === id);
  if (!record || expectedStage !== record.events.length || record.events.length >= stages.length) {
    throw new Error("This enquiry has changed. Review the current stage and try again.");
  }
  if (record.events.length === stages.length - 1) {
    if (![price, cost].every(value => Number.isSafeInteger(value) && value >= 0) || price === 0) {
      throw new Error("A valid sale price and direct cost are required.");
    }
    if (records.some(item => item.animalId === record.animalId && item.sale)) {
      throw new Error("This animal already has a completed demo handover.");
    }
    record.sale = { route: routes[0], price, cost };
  }
  record.events.push(date.toISOString());
  storage.setItem(enquiryPrefix + id, JSON.stringify(record));
  return record;
}

const monthFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit",
});
function monthOf(date) {
  const parts = monthFormat.formatToParts(new Date(date));
  return parts.find(part => part.type === "year").value + "-" + parts.find(part => part.type === "month").value;
}

export function refreshWarehouse(enquiries, inventory) {
  const warehouse = {
    enquiries: [...historicalEnquiries, ...enquiries],
    campaignSpend,
    inventory,
    sites,
  };
  const deals = warehouse.enquiries.filter(enquiry => enquiry.sale);
  const placedAnimals = new Set(deals.map(deal => deal.animalId));
  const sales = routes.map(route => {
    const closed = deals.filter(deal => deal.sale.route === route);
    return {
      route, sales: closed.length,
      revenue: closed.reduce((total, deal) => total + deal.sale.price, 0),
      contribution: closed.reduce((total, deal) => total + deal.sale.price - deal.sale.cost, 0),
    };
  });
  const marketing = channels.map(channel => {
    const leads = warehouse.enquiries.filter(enquiry => enquiry.channel === channel.id);
    const spend = channel.spend === null ? null : warehouse.campaignSpend
      .filter(record => record.channel === channel.id).reduce((total, record) => total + record.amount, 0);
    const historicalSales = historicalEnquiries.filter(enquiry => enquiry.channel === channel.id && enquiry.sale).length;
    return {
      channel: channel.name, spend, enquiries: leads.length,
      qualified: leads.filter(lead => lead.events.length >= 2).length,
      sales: leads.filter(lead => lead.sale).length,
      costPerSale: spend && historicalSales ? spend / historicalSales : null,
    };
  });
  const operations = warehouse.sites.map(site => {
    const stock = warehouse.inventory.filter(animal => animal.site === site.id && !placedAnimals.has(animal.id));
    const rosterFte = site.rosterHours / 40;
    const placements = enquiries.filter(enquiry => enquiry.site === site.id && enquiry.sale);
    const duration = placements.reduce((days, enquiry) => days
      + (Date.parse(enquiry.events[4]) - Date.parse(enquiry.events[0])) / 86400000, 0);
    return {
      name: site.name, ready: stock.filter(animal => animal.status === "Available").length,
      onHold: stock.filter(animal => animal.status === "Health hold").length,
      transfers: stock.filter(animal => animal.status === "Awaiting transfer").length, handovers: placements.length,
      averagePlacementDays: placements.length ? duration / placements.length : null,
      staffingHeadroom: rosterFte - site.plannedCareFte, facilityHeadroom: site.animalSlots - stock.length,
    };
  });
  const months = [...new Set([...historicalMonths, ...warehouse.enquiries.flatMap(
    enquiry => enquiry.events.map(monthOf)
  )])].sort();
  const monthlyActivity = months.flatMap(month => sites.map(site => {
    const records = warehouse.enquiries.filter(enquiry => enquiry.site === site.id);
    return {
      month, site: site.id,
      enquiries: records.filter(enquiry => monthOf(enquiry.events[0]) === month).length,
      viewings: records.filter(enquiry => enquiry.events[2] && monthOf(enquiry.events[2]) === month).length,
      handovers: records.filter(enquiry => enquiry.events[4] && monthOf(enquiry.events[4]) === month).length,
    };
  }));
  return {
    sales, marketing, operations, monthlyActivity,
    funnel: stages.map((stage, index) => ({
      stage, count: warehouse.enquiries.filter(enquiry => enquiry.events.length > index).length,
    })),
    loadedRows: warehouse.enquiries.length + warehouse.campaignSpend.length + inventory.length + sites.length,
  };
}

export function compareExpansion({ demand, delay, startingCash, contribution }) {
  const plans = [
    { name: "Build now", upfront: 220000000, monthly: 7800000, before: 22, after: 50, opening: 5 },
    { name: "Refurbish in stages", upfront: 115000000, monthly: 5400000, before: 28, after: 38, opening: 3 },
  ];
  return plans.map(plan => {
    let cash = startingCash - plan.upfront;
    let minimumCash = cash;
    let firstShortfall = cash < 0 ? 0 : null;
    let sales = 0;
    for (let month = 1; month <= 12; month += 1) {
      const capacity = month < plan.opening + delay ? plan.before : plan.after;
      const sold = Math.min(demand, capacity);
      sales += sold;
      cash += sold * contribution - plan.monthly;
      minimumCash = Math.min(minimumCash, cash);
      if (cash < 0 && firstShortfall === null) firstShortfall = month;
    }
    return { ...plan, cash, minimumCash, firstShortfall, unservedDemand: demand * 12 - sales };
  });
}
