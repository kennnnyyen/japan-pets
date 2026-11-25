export const slides = [
  {
    "title": "One pet, one connected workflow",
    "label": "START THE STORY",
    "handoff": "Mugi’s record will connect the buyer’s enquiry to the showroom and the forecast.",
    "stage": 0,
    "text": [
      "TOKYO PET OS",
      "A showroom sale and the data it creates, from the first enquiry to next week’s forecast.",
      "Business prototype · Illustrative scenario"
    ]
  },
  {
    "title": "Mugi’s animal record",
    "label": "ANIMAL RECORD TO PORTAL",
    "handoff": "Staff record Mugi’s details once. The owner portal shows the fields buyers can see.",
    "stage": 0,
    "text": [
      "Care staff · Admin CRM · Tokyo showroom",
      "What care staff enter",
      "A record for Mugi with a stable animal ID, litter, age, site and current health or availability status.",
      "Where it lives",
      "Supabase Postgres stores Mugi’s record in the pilot. The portal reads the fields buyers can see.",
      "What the team uses it for",
      "Staff can see which animals are ready to show, which are on hold and which need follow-up.",
      "Prototype screen · Admin animal inventory"
    ]
  },
  {
    "title": "The buyer’s enquiry",
    "label": "PORTAL TO CRM",
    "handoff": "Aki’s enquiry carries Mugi’s animal ID and the tracked LINE source into the staff CRM.",
    "stage": 1,
    "text": [
      "Aki, a fictional buyer · Owner portal",
      "What Aki enters",
      "Contact preference, purchase timing, an optional message and consent for staff follow-up.",
      "What the system adds",
      "An enquiry ID, timestamp and the campaign source if it came through a tracked link.",
      "What sales sees",
      "A follow-up item linked to Mugi and the Tokyo showroom. Missing sources appear as unattributed.",
      "Prototype screen · Owner portal interest form"
    ]
  },
  {
    "title": "Viewing and handover",
    "label": "CRM TO WAREHOUSE",
    "handoff": "The advisor records the handover against the same enquiry. That sale is ready for the next refresh.",
    "stage": 2,
    "text": [
      "Showroom advisor · Admin CRM",
      "01  Viewing",
      "The advisor qualifies the enquiry, books a viewing and records the appointment outcome.",
      "02  Explanation",
      "At the showroom, staff record the in-person explanation and confirm Mugi can be handed over.",
      "03  Handover",
      "Staff save the completed handover, sale price and direct cost against the original enquiry.",
      "Prototype screen · Staff mark the handover complete",
      "What changes straight away",
      "The operational record shows the sale and the animal’s new status. The reporting totals change after the next warehouse refresh."
    ]
  },
  {
    "title": "25-second Blender cutaway",
    "label": "FOLLOW THE HANDOVER",
    "handoff": "Watch the record move from the showroom into the warehouse, the three reports and next week’s forecast.",
    "stage": 2,
    "text": [
      "Aki meets Mugi at the Tokyo showroom. Aki registers interest in the owner portal and the advisor records handover in the CRM.",
      "The warehouse links the enquiry, animal and sale. Original campaign and roster files remain available for reprocessing.",
      "The illustrative handover adds ¥480,000 in sales revenue, one LINE handover and one fewer animal available.",
      "The sample forecast shows 18 expected viewings against a booking baseline of 17. Soft instrumental audio accompanies the animation."
    ]
  },
  {
    "title": "Raw files, shared records and ELT",
    "label": "WAREHOUSE TO REPORTS",
    "handoff": "The refresh links the sale, animal, campaign and site before it updates the reports.",
    "stage": 3,
    "text": [
      "Proposed backend for one Tokyo showroom",
      "SOURCE DATA",
      "Portal enquiries and CRM events arrive alongside sample campaign spend and staff roster files.",
      "STORAGE",
      "Supabase Postgres holds operational records, imported rows and reporting tables in separate schemas.",
      "PROCESSING",
      "An ELT refresh loads source rows, links enquiries, animals, sales and sites, then updates the three marts.",
      "Raw imports (Data Lake)",
      "Keep original campaign and roster files in shared file storage so the team can check them and run imports again.",
      "Refresh check",
      "The run log shows rows loaded and last success. Rerunning the same handover leaves one sale in the reports.",
      "Prototype run status. ELT means extract, load and transform."
    ]
  },
  {
    "title": "One handover in three reports",
    "label": "REPORTS TO PLANNING",
    "handoff": "The same handover updates revenue, LINE attribution and available stock.",
    "stage": 4,
    "text": [
      "Sales, Marketing and Operations · CRM Analytics · Illustrative transaction",
      "Sales",
      "¥480,000 in revenue",
      "¥315,000 contribution after ¥165,000 in direct costs.",
      "Marketing",
      "1 tracked LINE handover",
      "Compare campaign cost with completed handovers.",
      "Operations",
      "1 fewer animal available",
      "Mugi leaves sale-ready stock at the showroom.",
      "Prototype screen excerpts · Demo totals include sample history"
    ]
  },
  {
    "title": "Next week’s viewing forecast",
    "label": "FORECAST TO SHOP MANAGER",
    "handoff": "The forecast and booking baseline give the manager a starting point for scheduling showroom time.",
    "stage": 5,
    "text": [
      "Shop manager · CRM forecast view",
      "18",
      "Expected viewings",
      "17",
      "Booking baseline",
      "How the pilot runs it",
      "A weekly Python job on GitHub Actions reads bookings and attendance, then writes the forecast and baseline to Supabase.",
      "How the manager uses it",
      "Set aside showroom time for appointments. Compare the model with the baseline once actual attendance comes in.",
      "Prototype screen · Forecast uses six synthetic weeks"
    ]
  },
  {
    "title": "The one-shop pilot",
    "label": "BACK TO THE SHOP",
    "handoff": "The one-shop pilot checks that a single handover appears once across all three reports.",
    "stage": 5,
    "text": [
      "The full loop is one enquiry, one handover and one weekly planning decision.",
      "WHAT WORKS IN THE DEMO",
      "Follow an enquiry, enter a sample handover, run the refresh, inspect the three reports and see a sample viewing forecast.",
      "WHAT THE PILOT ADDS",
      "Shared records across the portal and staff CRM, real attendance outcomes, retained source files and a scheduled forecast.",
      "HOW THE BUSINESS KNOWS IT WORKS",
      "Use two browsers. Trace one completed handover into the three reports, refresh again and confirm the sale still counts once.",
      "Open the live Data Platform Demo"
    ]
  }
] as const;
