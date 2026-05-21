import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { IotSensor, ReportTicket, CitizenBill, DistrictStats } from "./src/types";

dotenv.config();

// Initialize Gemini SDK safely server-side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API Client initialized successfully.");
} else {
  console.warn("GEMINI_API_KEY not found in environment. AI features will fallback to rule-based diagnostics.");
}

const app = express();
app.use(express.json());

const PORT = 3000;

// ==========================================
// 1. IN-MEMORY SEED DATA (REPRESENTING GHANA WATER COMPANY LTD CORE NETWORK)
// ==========================================

let districtStats: DistrictStats[] = [
  { name: "Accra West (Weija)", totalSupplied: 450000, totalBilled: 315000, waterLossPercentage: 30.0, revenueArrears: 420000, activeLeaks: 3, activeThefts: 4 },
  { name: "Accra East (Spintex)", totalSupplied: 510000, totalBilled: 418200, waterLossPercentage: 18.0, revenueArrears: 610000, activeLeaks: 2, activeThefts: 1 },
  { name: "Kumasi Metro (Kejetia)", totalSupplied: 380000, totalBilled: 285000, waterLossPercentage: 25.0, revenueArrears: 310000, activeLeaks: 4, activeThefts: 2 },
  { name: "Tema Industrial Area", totalSupplied: 890000, totalBilled: 756500, waterLossPercentage: 15.0, revenueArrears: 1250000, activeLeaks: 1, activeThefts: 3 },
  { name: "Tamale Central (Northern)", totalSupplied: 190000, totalBilled: 161500, waterLossPercentage: 15.0, revenueArrears: 95000, activeLeaks: 2, activeThefts: 0 }
];

let iotSensors: IotSensor[] = [
  {
    id: "SEN-ACC-001",
    location: "Weija Transmission Main, Accra West",
    region: "Greater Accra",
    flowRateIn: 250,   // L/s out of treatment plant
    flowRateOut: 175,  // Sum of retail household rates
    pressure: 4.2,     // Bar
    theftRisk: "High",
    status: "Theft Alert",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "SEN-ACC-002",
    location: "Spintex Road Bypass Valve, Accra East",
    region: "Greater Accra",
    flowRateIn: 130,
    flowRateOut: 105,
    pressure: 1.8,  // Abnormal drop (typical: 3.5 Bar)
    theftRisk: "Medium",
    status: "Leakage Alert",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "SEN-KMS-001",
    location: "Kejetia Central Loop, Kumasi Metro",
    region: "Ashanti Region",
    flowRateIn: 180,
    flowRateOut: 175,
    pressure: 3.1,
    theftRisk: "Low",
    status: "Normal",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "SEN-TEM-001",
    location: "Tema Heavy Industrial Trunk Line",
    region: "Greater Accra",
    flowRateIn: 450,
    flowRateOut: 310,  // Severe Commercial Discrepancy!
    pressure: 4.8,
    theftRisk: "High",
    status: "Theft Alert",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "SEN-TML-001",
    location: "Jubilee Park Distribution, Tamale North",
    region: "Northern Region",
    flowRateIn: 95,
    flowRateOut: 90,
    pressure: 2.1,
    theftRisk: "Low",
    status: "Normal",
    lastUpdated: new Date().toISOString()
  }
];

let reportTickets: ReportTicket[] = [
  {
    id: "REP-001",
    title: "Major burst pipe near Spintex Shell Station",
    type: "Leakage",
    reporterName: "Emmanuel Osei",
    reporterPhone: "+233 24 456 7890",
    gpsLocation: { latitude: 5.6231, longitude: -0.0912 },
    locationDesc: "Spintex Road downstream, directly opposite the Shell filling station, leaking heavy clean water.",
    region: "Greater Accra",
    severity: "High",
    status: "In Progress",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
    aiAnalysis: "EMERGENCY INSIGHT: Historical records indicate a legacy 12-inch asbestos cement pipe at this intersection. Immediate dispatch of the Accra East rapid burst response unit is recommended. Estimated water loss rate is ~8.5 Liters/second.",
    technicianNotes: "Field crew was dispatched with 12-inch mechanical repair clamps. Digging ongoing."
  },
  {
    id: "REP-002",
    title: "Suspicious bypass connection behind building construction",
    type: "Illegal Connection",
    reporterName: "Anonymous",
    reporterPhone: "",
    gpsLocation: { latitude: 5.5492, longitude: -0.2185 },
    locationDesc: "Dansoman, behind the newly cemented multi-story commercial structure on Guggisberg Ave.",
    region: "Greater Accra",
    severity: "Critical",
    status: "Pending",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24h ago
    aiAnalysis: "ANOMALY ANALYSIS: High probability of commercial water theft. Satellite logs indicate active concrete mixing on-site with zero metered commercial water usage registered for this client profile. Inspect for illegal direct tap preceding the main digital household meter.",
    technicianNotes: ""
  },
  {
    id: "REP-003",
    title: "Low tap pressure in Adum residents sector",
    type: "Low Pressure",
    reporterName: "Yaa Ampofowaa",
    reporterPhone: "+233 20 889 1234",
    gpsLocation: { latitude: 6.6901, longitude: -1.6212 },
    locationDesc: "Adum, Kumasi. Close to the Methodist Church compound.",
    region: "Ashanti Region",
    severity: "Medium",
    status: "Dispatched",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8h ago
    aiAnalysis: "DIAGNOSTIC INSIGHT: Low distribution pressure reported while main district trunk shows stable 3.5 Bar. Points to local secondary line valve blockage or regional pipe constriction. Run local sub-valve diagnostic sweeps.",
    technicianNotes: "Inspector Boateng assigned to confirm regional gate valve limits."
  }
];

let citizenBills: CitizenBill[] = [
  {
    id: "BILL-201",
    customerName: "Samuel Kofi Mensah",
    meterNumber: "MTR-ACC-512-W",
    region: "Greater Accra",
    outstandingAmount: 840.50,
    dueDate: "2026-05-15",
    usageKlh: 48,
    status: "Overdue",
    illegalConnectionSuspected: true,
    paymentHistory: [
      { date: "2026-03-10", amount: 150.00, reference: "TXN-90218" },
      { date: "2026-04-12", amount: 180.00, reference: "TXN-95412" }
    ]
  },
  {
    id: "BILL-202",
    customerName: "Hajia Fatima Ibrahim",
    meterNumber: "MTR-TML-409-S",
    region: "Northern Region",
    outstandingAmount: 0.00,
    dueDate: "2026-06-10",
    usageKlh: 18,
    status: "Paid",
    illegalConnectionSuspected: false,
    paymentHistory: [
      { date: "2026-05-18", amount: 125.00, reference: "TXN-GHW-10492" }
    ]
  },
  {
    id: "BILL-203",
    customerName: "George Kwame Boateng",
    meterNumber: "MTR-KMS-382-K",
    region: "Ashanti Region",
    outstandingAmount: 1450.00,
    dueDate: "2026-04-01",
    usageKlh: 92,
    status: "Overdue",
    illegalConnectionSuspected: true,
    paymentHistory: []
  },
  {
    id: "BILL-204",
    customerName: "Nii Armah & Sons Block Factory",
    meterNumber: "MTR-TEM-891-I",
    region: "Greater Accra",
    outstandingAmount: 12400.00,
    dueDate: "2026-04-20",
    usageKlh: 520,
    status: "Overdue",
    illegalConnectionSuspected: true,
    paymentHistory: [
      { date: "2026-02-15", amount: 3500.00, reference: "TXN-IND-8041" }
    ]
  },
  {
    id: "BILL-205",
    customerName: "Grace Akolgo",
    meterNumber: "MTR-TML-120-N",
    region: "Northern Region",
    outstandingAmount: 65.20,
    dueDate: "2026-06-05",
    usageKlh: 12,
    status: "Unpaid",
    illegalConnectionSuspected: false,
    paymentHistory: [
      { date: "2026-05-01", amount: 80.00, reference: "TXN-01928" }
    ]
  }
];

// ==========================================
// 2. WATER SECTOR API ROUTING
// ==========================================

// Get all sensors, tickets, bills
app.get("/api/sensors", (req, res) => {
  res.json(iotSensors);
});

app.get("/api/reports", (req, res) => {
  res.json(reportTickets);
});

app.get("/api/bills", (req, res) => {
  res.json(citizenBills);
});

app.get("/api/districts", (req, res) => {
  res.json(districtStats);
});

// Create new citizen or technican report
app.post("/api/reports", async (req, res) => {
  const { title, type, reporterName, reporterPhone, gpsLocation, locationDesc, region, severity, photoUrl } = req.body;
  if (!title || !type) {
    return res.status(400).json({ error: "Title and incident type are required fields." });
  }

  const generatedId = `REP-${Math.floor(100 + Math.random() * 900)}`;
  const defaultLocation = gpsLocation && gpsLocation.latitude ? gpsLocation : { latitude: 5.5562, longitude: -0.1969 }; // Defaults to Accra coordinates

  // Start with default analytical notes
  let diagInsights = "DIAGNOSTIC PENDING: Trigger AI analysis to generate real-time local solutions.";

  // Create Ticket Object
  const newReport: ReportTicket = {
    id: generatedId,
    title,
    type,
    reporterName: reporterName || "Anonymous Citizen",
    reporterPhone: reporterPhone || "",
    gpsLocation: defaultLocation,
    locationDesc: locationDesc || "No description provided",
    region: region || "Greater Accra",
    severity: severity || "Medium",
    status: "Pending",
    createdAt: new Date().toISOString(),
    aiAnalysis: diagInsights,
    technicianNotes: "",
    photoUrl: photoUrl || ""
  };

  // Add active diagnostic counts to corresponding district
  const matchedDistrict = districtStats.find(d => d.name.toLowerCase().includes(region ? region.toLowerCase() : "accra"));
  if (matchedDistrict) {
    if (type === "Leakage" || type === "Low Pressure") matchedDistrict.activeLeaks++;
    if (type === "Illegal Connection" || type === "Vandalism/Theft") matchedDistrict.activeThefts++;
  }

  // Pre-generate AI Insights on-demand if Gemini is active, or fallback gracefully
  if (aiClient) {
    try {
      const prompt = `You are the Ghana Water Company Limited (GWCL) Expert Diagnostic AI System.
Analyze this user-reported ticket from Ghana:
Type: ${type}
Title: ${title}
Location Description: ${locationDesc}
Region: ${region || "Greater Accra"}
Severity: ${severity}

Provide a concise, professional diagnostic summary (2-3 sentences max) outlining:
1. Probable root cause (e.g., pipe age, construction interference, deliberate industrial meter bypass).
2. Actionable dispatch recommendation for GWCL field engineers.
3. Estimated impact magnitude on Ghanaian Non-Revenue Water (NRW).`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert utility operations consultant with comprehensive knowledge of Ghanaian water infrastructure, GWCL meters, pipe networks, and industrial bypass fraud."
        }
      });

      if (response && response.text) {
        newReport.aiAnalysis = response.text.trim();
      }
    } catch (err: any) {
      console.error("Error generating Gemini AI ticket insights:", err.message);
      newReport.aiAnalysis = `AI AUTO DIAGNOSIS: High risk warning for regional ${type.toLowerCase()}. Highly recommended to dispatch immediate inspection teams to prevent continuous reservoir drawdowns.`;
    }
  } else {
    newReport.aiAnalysis = `DIAGNOSTIC INSIGHT (Rule-Engine): Regional reports show increased anomalies around ${region || "Accra"}. Immediate field validation advised for ${type.toLowerCase()} to restore water pressure and secure billing revenue collections.`;
  }

  reportTickets.unshift(newReport);
  res.status(201).json(newReport);
});

// Update technician notes or ticket status
app.post("/api/reports/:id/update", (req, res) => {
  const { id } = req.params;
  const { status, technicianNotes } = req.body;
  
  const ticket = reportTickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  if (status) {
    ticket.status = status;
    // If ticket resolved, decrement active leak or theft counts in district
    if (status === "Resolved") {
      const matchDist = districtStats.find(d => d.name.toLowerCase().includes(ticket.region.toLowerCase()));
      if (matchDist) {
        if (ticket.type === "Leakage" || ticket.type === "Low Pressure") {
          matchDist.activeLeaks = Math.max(0, matchDist.activeLeaks - 1);
        } else {
          matchDist.activeThefts = Math.max(0, matchDist.activeThefts - 1);
        }
      }
    }
  }
  if (technicianNotes !== undefined) {
    ticket.technicianNotes = technicianNotes;
  }

  res.json(ticket);
});

// Pay a water bill via simulated Mobile Money (MoMo: MTN, Telecel, AT Money)
app.post("/api/bills/:id/pay", (req, res) => {
  const { id } = req.params;
  const { amount, reference, channel } = req.body;

  const bill = citizenBills.find(b => b.id === id);
  if (!bill) {
    return res.status(404).json({ error: "Billing record not found." });
  }

  const payAmount = parseFloat(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ error: "Invalid payment amount provided." });
  }

  const originalAmount = bill.outstandingAmount;
  const paidReference = reference || `TXN-MOMO-${Math.floor(10000 + Math.random() * 90000)}`;

  bill.outstandingAmount = Math.max(0, originalAmount - payAmount);
  if (bill.outstandingAmount === 0) {
    bill.status = "Paid";
    bill.illegalConnectionSuspected = false;
  }

  bill.paymentHistory.unshift({
    date: new Date().toISOString().split('T')[0],
    amount: payAmount,
    reference: paidReference + ` (${channel || 'MTN MoMo'})`
  });

  // Reduce revenue arrears from corresponding district
  const dist = districtStats.find(d => d.name.toLowerCase().includes(bill.region.toLowerCase()));
  if (dist) {
    dist.revenueArrears = Math.max(0, dist.revenueArrears - payAmount);
  }

  res.json({
    success: true,
    message: `Payment of GH₵ ${payAmount.toFixed(2)} recorded through ${channel || 'MoMo'}.`,
    bill
  });
});

// Simulate sensor parameters in active zone to trigger or resolve leakage/theft alerts
app.post("/api/sensors/:id/simulate", (req, res) => {
  const { id } = req.params;
  const { flowRateIn, flowRateOut, pressure } = req.body;

  const sensor = iotSensors.find(s => s.id === id);
  if (!sensor) {
    return res.status(404).json({ error: "IoT flow meter not found." });
  }

  if (flowRateIn !== undefined) sensor.flowRateIn = Number(flowRateIn);
  if (flowRateOut !== undefined) sensor.flowRateOut = Number(flowRateOut);
  if (pressure !== undefined) sensor.pressure = Number(pressure);

  sensor.lastUpdated = new Date().toISOString();

  // Dynamic status evaluation based on flow discrepancy & pressure drops
  const discrepancy = sensor.flowRateIn - sensor.flowRateOut;
  const isPressureLow = sensor.pressure < 2.0;

  if (discrepancy > 60 && isPressureLow) {
    sensor.status = "Leakage Alert";
    sensor.theftRisk = "Medium";
  } else if (discrepancy > 80 && !isPressureLow) {
    sensor.status = "Theft Alert";
    sensor.theftRisk = "High";
  } else if (discrepancy > 30) {
    sensor.status = "Theft Alert";
    sensor.theftRisk = "Medium";
  } else if (isPressureLow) {
    sensor.status = "Leakage Alert";
    sensor.theftRisk = "Low";
  } else {
    sensor.status = "Normal";
    sensor.theftRisk = "Low";
  }

  res.json({
    message: "Sensor state simulated successfully.",
    sensor
  });
});

// Run AI Smart Audit sweep on current unpaid billing accounts (calls Gemini)
app.post("/api/bills/audit", async (req, res) => {
  if (!aiClient) {
    return res.json({
      success: true,
      auditReport: "### Ghana Water Co. Digital Audit Summary (Rule-Engine)\n\n" +
        "- **ACCRA SYSTEM CRITICAL FLAG**: Outlying blocks like 'Nii Armah Block Factory' (Arrears of GH₵ 12,400.00) show severe flow-in anomalies. Suggest immediate meter disconnection sweep.\n" +
        "- **REVENUE RESTORATION**: High arrears detected. Outstanding balance of GH₵ 1,450.00 at Kumasi Sector exceeds 60-day threshold without payment. High suspect of informal pipe bypass.\n" +
        "- **RECOMMENDED PLAN**: Set priority inspection patrols to check physical meters."
    });
  }

  try {
    const formattedBills = citizenBills.map(b => 
      `Customer: ${b.customerName}, Outstanding: GH₵ ${b.outstandingAmount}, Status: ${b.status}, Meter: ${b.meterNumber}, Region: ${b.region}, Suspected Theft Flag: ${b.illegalConnectionSuspected}`
    ).join("\n");

    const prompt = `Perform a rapid water loss and billing audit on these active Ghana Water Company client accounts:
${formattedBills}

Address the following points in beautiful structured Markdown format:
1. Identify the top 2 highest risk accounts contributing to Ghanaian utility revenue losses (Non-Revenue Water).
2. For accounts with 'illegalConnectionSuspected: true' or high commercial arrears, outline specific inspection steps a technician might perform (e.g. meter bypass, tampered dial checking).
3. Draft a polite, clear WhatsApp/SMS reminder template for outstanding balances suitable for Ghanaian consumers using local context (Mobile Money payment options).`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the head of revenue safety and leak diagnostic audit operations at Ghana Water Company Limited."
      }
    });

    res.json({
      success: true,
      auditReport: response.text ? response.text : "AI could not generate audit response at this brief moment."
    });
  } catch (err: any) {
    console.error("Gemini Audit Sweep execution error:", err);
    res.status(500).json({ error: "Failed to process AI audit sweep. " + err.message });
  }
});

// AI Smart Balance SMS/WhatsApp reminder template draft for specific user using local context
app.post("/api/bills/:id/generate-sms", async (req, res) => {
  const { id } = req.params;
  const bill = citizenBills.find(b => b.id === id);
  if (!bill) {
    return res.status(404).json({ error: "Billing record not found for SMS draft." });
  }

  if (!aiClient) {
    return res.json({
      success: true,
      sms: `GWCL REMINDER: Dear ${bill.customerName}, your water account for meter ${bill.meterNumber} has an outstanding balance of GH₵ ${bill.outstandingAmount.toFixed(2)}. To avoid immediate service disconnection, kindly pay today via MTN MoMo (*170#), Telecel Cash (*110#), or AT Money. Medaase!`
    });
  }

  try {
    const prompt = `Compose a short, highly professional, polite but firm WhatsApp/SMS reminder for a Ghanaian customer regarding their unpaid water bill:
- Customer Name: ${bill.customerName}
- Outstanding Balance: GH₵ ${bill.outstandingAmount.toFixed(2)}
- Meter Number: ${bill.meterNumber}
- Due State: ${bill.status} (In Arrears)
- District Sector: ${bill.region}

Must mention:
1. Quick payment options via local Ghanaian Mobile Money networks: MTN MoMo (*170#), Telecel Cash (*110#), or AT Money.
2. The customer's meter number for account validation.
3. Keep it brief (within 140-160 words max), clear, and add a respectful Ghanaian closure such as "Medaase" (Thank you). Do not include any placeholder symbols like [Customer Name] – put real values directly.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the head of consumer relations and digital revenue accounting at Ghana Water Company Limited."
      }
    });

    res.json({
      success: true,
      sms: response.text ? response.text.trim() : "Unable to generate custom prompt. Please use the manual billing template framework."
    });
  } catch (err: any) {
    console.error("Gemini SMS Draft failure:", err);
    res.json({
      success: true,
      sms: `GWCL BILLING NOTICE: Dear ${bill.customerName}, prompt payment of GH₵ ${bill.outstandingAmount.toFixed(2)} for Meter ${bill.meterNumber} (${bill.region}) is required to safeguard continuous flow. Please transfer using MoMo options. Medaase!`
    });
  }
});

// AI Diagnostic analysis page for custom technician queries
app.post("/api/analyze-anomaly", async (req, res) => {
  const { pressure, discrepancy, location, context } = req.body;

  if (!aiClient) {
    return res.json({
      diagnosis: `DIAGNOSTIC BACKUP: Active monitoring detects a discrepancy of ${discrepancy || 0} Liters/sec at ${location || 'Ghana site'}. Suggest manually sending inspect team with acoustic leak listeners or checking connection points.`
    });
  }

  try {
    const prompt = `Analyze a technical discrepancy alert at location: "${location || 'Ghana Sector'}":
- Inlet vs Outlet Discrepancy: ${discrepancy || 0} L/s
- Local Pressure Reading: ${pressure || 0} Bar
- Tech Context: ${context || 'None provided'}

Provide a structured, technical engineering diagnostic addressing:
1. **Anomaly Classification**: Is this likely physical leakage (severe pressure loss) or commercial water theft/illegal connection bypass (high continuous discrepancy, stable high pressure)?
2. **Technician Action Steps**: 3 precise onsite inspection guidelines to confirm this.
3. **Loss Mitigation**: Preventive advice. Encourage the use of smart ultrasonic meters.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the chief network inspector at Accra GHANA water grid."
      }
    });

    res.json({
      success: true,
      diagnosis: response.text
    });
  } catch (err: any) {
    console.error("Gemini Technical diagnosis failure:", err);
    res.status(500).json({ error: "AI reasoning failed to respond. " + err.message });
  }
});

// ==========================================
// 3. VITE MIDDLEWARE CONFIG / STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static files served from dist in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ghana Water Management Server running dynamically on http://localhost:${PORT}`);
  });
}

startServer();
