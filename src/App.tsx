import React, { useState, useEffect } from "react";
import { 
  Droplet, 
  MapPin, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  PlusCircle, 
  Send, 
  Search, 
  FileText, 
  DollarSign, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Phone, 
  Radio, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  HelpCircle, 
  Laptop, 
  AlertCircle, 
  Smartphone,
  ChevronRight,
  RefreshCw,
  Wallet
} from "lucide-react";
import Header from "./components/Header";
import { IotSensor, ReportTicket, CitizenBill, DistrictStats } from "./types";

export default function App() {
  const [currentRole, setCurrentRole] = useState<"authority" | "technician" | "citizen">("authority");
  
  // User Authentication State
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [signInName, setSignInName] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  
  // Data States
  const [sensors, setSensors] = useState<IotSensor[]>([]);
  const [reports, setReports] = useState<ReportTicket[]>([]);
  const [bills, setBills] = useState<CitizenBill[]>([]);
  const [districts, setDistricts] = useState<DistrictStats[]>([]);
  
  // App Loading and Busy States
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview"); // overview, mapping, forensics, audit (authority)

  // Citizen Report Ticket Form
  const [newReport, setNewReport] = useState({
    title: "",
    type: "Leakage" as ReportTicket["type"],
    reporterName: "",
    reporterPhone: "",
    locationDesc: "",
    region: "Greater Accra",
    severity: "Medium" as ReportTicket["severity"],
    lat: 5.6037,
    lng: -0.1870
  });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Bill payment Modal/Inline Simulator
  const [selectedBill, setSelectedBill] = useState<CitizenBill | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [momoChannel, setMomoChannel] = useState<string>("MTN MoMo");
  const [momoPhone, setMomoPhone] = useState<string>("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Technician Update Dialog
  const [selectedTicket, setSelectedTicket] = useState<ReportTicket | null>(null);
  const [techNotes, setTechNotes] = useState<string>("");
  const [techStatus, setTechStatus] = useState<ReportTicket["status"]>("In Progress");
  const [updatingTicket, setUpdatingTicket] = useState(false);

  // AI Smart Anomaly Analyzer Form (Technician Sandbox)
  const [sandboxSensor, setSandboxSensor] = useState<IotSensor | null>(null);
  const [customFlowIn, setCustomFlowIn] = useState<number>(200);
  const [customFlowOut, setCustomFlowOut] = useState<number>(140);
  const [customPressure, setCustomPressure] = useState<number>(2.4);
  const [sandboxAnalysis, setSandboxAnalysis] = useState<string | null>(null);
  const [isAnalyzingSandbox, setIsAnalyzingSandbox] = useState(false);

  // Filter keys
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("All");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [resSensors, resReports, resBills, resDistricts] = await Promise.all([
        fetch("/api/sensors"),
        fetch("/api/reports"),
        fetch("/api/bills"),
        fetch("/api/districts")
      ]);

      const dataSensors = await resSensors.json();
      const dataReports = await resReports.json();
      const dataBills = await resBills.json();
      const dataDistricts = await resDistricts.json();

      setSensors(dataSensors);
      setReports(dataReports);
      setBills(dataBills);
      setDistricts(dataDistricts);

      // Pre-select first sensor for technique sandbox
      if (dataSensors && dataSensors.length > 0) {
        setSandboxSensor(dataSensors[0]);
        setCustomFlowIn(dataSensors[0].flowRateIn);
        setCustomFlowOut(dataSensors[0].flowRateOut);
        setCustomPressure(dataSensors[0].pressure);
      }
    } catch (err) {
      console.error("Error fetching data from server:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync / Refresh telemetry data Simulation
  const handleReloadSensors = async () => {
    setIsSimulating(true);
    // Randomize telemetry fluctuations slightly to simulate stream
    try {
      for (const sensor of sensors) {
        const deltaIn = (Math.random() - 0.5) * 8;
        const deltaOut = (Math.random() - 0.5) * 12;
        const deltaPressure = (Math.random() - 0.5) * 0.4;

        await fetch(`/api/sensors/${sensor.id}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flowRateIn: Math.max(50, Math.round(sensor.flowRateIn + deltaIn)),
            flowRateOut: Math.max(30, Math.round(sensor.flowRateOut + deltaOut)),
            pressure: Math.max(0.5, parseFloat((sensor.pressure + deltaPressure).toFixed(2)))
          })
        });
      }
      // Re-fetch all
      await fetchInitialData();
    } catch (err) {
      console.error("Simulation sweep failed", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Citizen Report Submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title || !newReport.locationDesc) {
      alert("Please provide a title and detailed location description.");
      return;
    }

    try {
      setSubmittingReport(true);
      setReportSuccess(null);

      const payload = {
        title: newReport.title,
        type: newReport.type,
        reporterName: newReport.reporterName || "Anonymous Citizen",
        reporterPhone: newReport.reporterPhone,
        locationDesc: newReport.locationDesc,
        region: newReport.region,
        severity: newReport.severity,
        gpsLocation: {
          latitude: newReport.lat,
          longitude: newReport.lng
        }
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Could not file report.");

      const resultTicket = await res.json();
      
      // Update local report list immediately
      setReports([resultTicket, ...reports]);
      setReportSuccess(`Kyerɛw krataa bi dze ma hɛn (Report Submitted)! Your report was filed with ticket ID: ${resultTicket.id}. Our AI has instantly computed GWCL diagnostic recommendations.`);
      
      // Clear form except name/phone
      setNewReport({
        ...newReport,
        title: "",
        locationDesc: "",
        lat: parseFloat((5.5 + Math.random() * 0.2).toFixed(4)),
        lng: parseFloat((-0.2 - Math.random() * 0.1).toFixed(4))
      });

      // Refresh districts info reflecting newly added reports
      const resDistricts = await fetch("/api/districts");
      setDistricts(await resDistricts.json());

    } catch (err: any) {
      alert("Filing report failed: " + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Pay MoMo Bill
  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0 || amt > selectedBill.outstandingAmount) {
      alert("Please enter a valid payment sum up to the total outstanding balance.");
      return;
    }

    try {
      setIsPaying(true);
      setPaymentSuccessMsg(null);

      const res = await fetch(`/api/bills/${selectedBill.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          channel: momoChannel,
          reference: `TXN-MOMO-${Math.floor(100000 + Math.random() * 900000)}`
        })
      });

      if (!res.ok) throw new Error("Payment transaction declined by gateway.");

      const result = await res.json();

      // Update state
      setBills(bills.map(b => b.id === selectedBill.id ? result.bill : b));
      setPaymentSuccessMsg(`Medaase! Received GH₵ ${amt.toFixed(2)} seamlessly via ${momoChannel}. Receipt logged in permanent registry.`);
      setSelectedBill(result.bill);
      setPayAmount("");

      // Refresh stats
      const resDistricts = await fetch("/api/districts");
      setDistricts(await resDistricts.json());
    } catch (err: any) {
      alert("Transaction Error: " + err.message);
    } finally {
      setIsPaying(false);
    }
  };

  // Update Ticket Status (Technician)
  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setUpdatingTicket(true);
      const res = await fetch(`/api/reports/${selectedTicket.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: techStatus,
          technicianNotes: techNotes
        })
      });

      if (!res.ok) throw new Error("Could not update field incident report status.");

      const updated = await res.json();
      setReports(reports.map(r => r.id === selectedTicket.id ? updated : r));
      setSelectedTicket(updated);
      alert(`Success! Updated Ticket ${updated.id} to state: ${techStatus}.`);
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Simulate specific sensor change manually in sandbox
  const handleUpdateSandboxSensor = async () => {
    if (!sandboxSensor) return;
    try {
      setIsAnalyzingSandbox(true);
      setSandboxAnalysis(null);

      // 1. Simulate change on server
      await fetch(`/api/sensors/${sandboxSensor.id}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowRateIn: customFlowIn,
          flowRateOut: customFlowOut,
          pressure: customPressure
        })
      });

      // 2. Query Gemini specialized diagnostic reasoning
      const resAnalysis = await fetch("/api/analyze-anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pressure: customPressure,
          discrepancy: customFlowIn - customFlowOut,
          location: sandboxSensor.location,
          context: `Operational sector contains key commercial users. Current leakage status flag: ${customFlowIn - customFlowOut > 50 ? 'Anomaly Detected' : 'Normal Operations'}`
        })
      });

      const dataAnalysis = await resAnalysis.json();
      setSandboxAnalysis(dataAnalysis.diagnosis || dataAnalysis.error);

      // Re-fetch datasets
      const resSensors = await fetch("/api/sensors");
      const refreshedSensors = await resSensors.json();
      setSensors(refreshedSensors);
      
      const newActive = refreshedSensors.find((s: IotSensor) => s.id === sandboxSensor.id);
      if (newActive) setSandboxSensor(newActive);

    } catch (err: any) {
      setSandboxAnalysis("Technical diagnostic pipeline timeout. Live error: " + err.message);
    } finally {
      setIsAnalyzingSandbox(false);
    }
  };

  // Run Bulk Smart Water Audit (Generates AI Report)
  const handleTriggerAIAudit = async () => {
    try {
      setIsAuditing(true);
      setAuditResult(null);

      const res = await fetch("/api/bills/audit", {
        method: "POST"
      });
      const data = await res.json();
      setAuditResult(data.auditReport);
    } catch (err: any) {
      setAuditResult("Failed to perform national audit sweep. Details: " + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  // Calculate high level metrics
  const totalWaterLossSupplied = districts.reduce((sum, d) => sum + d.totalSupplied, 0);
  const totalWaterLossBilled = districts.reduce((sum, d) => sum + d.totalBilled, 0);
  const aggregateLossPercent = totalWaterLossSupplied > 0 
    ? ((totalWaterLossSupplied - totalWaterLossBilled) / totalWaterLossSupplied) * 100 
    : 0;
  const totalArrears = districts.reduce((sum, d) => sum + d.revenueArrears, 0);
  const criticalLeaksCount = reports.filter(r => r.severity === "Critical" || r.severity === "High").filter(r => r.status !== "Resolved").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#EA9E1A]/20" id="main-portal">
      
      {/* Dynamic Navigation Header Component */}
      <Header 
        currentRole={currentRole} 
        onRoleChange={(newRole) => {
          setCurrentRole(newRole);
          // Set sensible defaults tabs based on selected role
          if (newRole === "authority") setActiveTab("overview");
          if (newRole === "technician") setActiveTab("alerts");
          if (newRole === "citizen") setActiveTab("report-portal");
        }} 
        isSimulating={isSimulating}
        onTriggerSimulation={handleReloadSensors}
        serverOnline={!loading}
        user={user}
        onSignInClick={() => setIsSignInModalOpen(true)}
        onSignOut={() => setUser(null)}
      />

      {/* Main Content View with elegant visual margins */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4" id="loader">
            <div className="w-12 h-12 border-4 border-[#0A3C6B]/20 border-t-[#EA9E1A] rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-mono">Fetching Ghana Water GWCL Real-Time Telemetry Data...</p>
          </div>
        ) : (
          <>
            {/* National Headline banner describing specific local contexts */}
            <div className="mb-8 p-6 bg-slate-900 text-white rounded-2xl relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="headline-banner">
              {/* Background watermark subtle shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A3C6B]/50 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
              
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#EA9E1A] text-slate-950 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md font-mono">
                    GWCL Operations
                  </span>
                  <span className="text-xs text-slate-300">Sync Date: May 20, 2026</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-medium tracking-tight mb-2">
                  National Non-Revenue Water (NRW) Reducer
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  Targeting physical pipeline leakages, unbilled consumption, commercial meter bypasses, and MoMo billing recoveries.
                </p>
              </div>

              {/* Dynamic summary indicator block */}
              <div className="relative z-10 grid grid-cols-2 gap-4 bg-slate-800/80 p-4 rounded-xl border border-white/10 w-full md:w-auto">
                <div>
                  <div className="text-xs text-slate-400">Total Unpaid Arrears</div>
                  <div className="text-xl font-bold font-mono text-[#EA9E1A]">GH₵ {totalArrears.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Average Water Loss</div>
                  <div className="text-xl font-bold font-mono text-cyan-400">{aggregateLossPercent.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* ====== 1. AUTHORITIES CONTROL ROOM (GWCL HEADQUARTERS VIEW) ====== */}
            {currentRole === "authority" && (
              <div id="role-authority-view" className="space-y-8">
                {/* Secondary Authorities Navigation Tabs */}
                <div className="flex border-b border-slate-200 gap-4 overflow-x-auto pb-px">
                  <button 
                    id="tab-btn-overview"
                    onClick={() => setActiveTab("overview")}
                    className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                      activeTab === "overview" 
                        ? "border-[#0A3C6B] text-[#0A3C6B]" 
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🚀 National Performance Dashboard
                  </button>
                  <button 
                    id="tab-btn-mapping"
                    onClick={() => setActiveTab("mapping")}
                    className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                      activeTab === "mapping" 
                        ? "border-[#0A3C6B] text-[#0A3C6B]" 
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🛰️ IoT Sensor Stream & Map GIS
                  </button>
                  <button 
                    id="tab-btn-forensics"
                    onClick={() => setActiveTab("forensics")}
                    className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                      activeTab === "forensics" 
                        ? "border-[#0A3C6B] text-[#0A3C6B]" 
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🚨 Illegal Connection & Billing Audit
                  </button>
                </div>

                {/* TAB 1: Dashboard overview */}
                {activeTab === "overview" && (
                  <div className="space-y-8 animate-fade-in" id="tab-content-overview">
                    {/* Key Metrics Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                          <span className="p-2.5 bg-[#EA9E1A]/10 text-[#EA9E1A] rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-mono text-red-500 bg-red-100/50 px-2 py-0.5 rounded-md font-semibold">Active Alerts</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                          {sensors.filter(s => s.status !== "Normal").length} Sector Hazards
                        </h3>
                        <p className="text-xs text-slate-500">Unresolved pipeline anomalies or theft risk zones.</p>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="p-2.5 bg-sky-100 text-[#0A3C6B] rounded-xl">
                            <Activity className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-mono text-cyan-600 bg-cyan-100/50 px-2 py-0.5 rounded-md font-semibold">Real-time NRW</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                          {aggregateLossPercent.toFixed(1)}% Losses
                        </h3>
                        <p className="text-xs text-slate-500">Normal acceptable GWCL loss ceiling is &lt; 15%.</p>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                            <TrendingUp className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-mono text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md font-semibold">MoMo Inflow</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                          {bills.filter(b => b.status === "Paid").length} Paid Bills
                        </h3>
                        <p className="text-xs text-slate-500">Overdue bills: {bills.filter(b => b.status === "Overdue").length} outstanding.</p>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="p-2.5 bg-rose-100 text-rose-500 rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-mono text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-md font-semibold">{criticalLeaksCount} Critical</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                          {reports.filter(r => r.status !== "Resolved").length} Active Tickets
                        </h3>
                        <p className="text-xs text-slate-500">Citizen filings and leaks pending repair dispatch.</p>
                      </div>
                    </div>

                    {/* Regional performance & loss breakdown via custom SVG presentation */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Regional list with progress bars */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-display font-bold text-slate-800">Regional Water Distribution & Loss Performance</h3>
                            <p className="text-xs text-slate-500">Monitored sectors supplying Accra, Kumasi, Tema, and Tamale reservoirs.</p>
                          </div>
                          <span className="text-xs text-[#0A3C6B] font-semibold bg-[#0A3C6B]/5 px-2.5 py-1 rounded-lg">Operational Audit</span>
                        </div>

                        <div className="space-y-6">
                          {districts.map((district) => {
                            const unbilledVol = district.totalSupplied - district.totalBilled;
                            return (
                              <div key={district.name} className="border-b border-slate-100 pb-4 last:border-none last:pb-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${district.waterLossPercentage > 25 ? "bg-red-500 animate-pulse" : district.waterLossPercentage > 15 ? "bg-[#EA9E1A]" : "bg-emerald-500"}`}></div>
                                    <span className="text-sm font-semibold text-slate-800">{district.name}</span>
                                  </div>
                                  <div className="text-xs text-slate-600 flex gap-4">
                                    <span>Supplied: <strong>{(district.totalSupplied / 1000).toFixed(0)}k m³</strong></span>
                                    <span>Loss Level: <strong className={district.waterLossPercentage > 20 ? "text-red-600" : "text-emerald-600"}>{district.waterLossPercentage}%</strong></span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-l-full" 
                                    style={{ width: `${100 - district.waterLossPercentage}%` }}
                                    title={`Billed water ${100 - district.waterLossPercentage}%`}
                                  ></div>
                                  <div 
                                    className="h-full bg-rose-500 rounded-r-full" 
                                    style={{ width: `${district.waterLossPercentage}%` }}
                                    title={`Loss unbilled water ${district.waterLossPercentage}%`}
                                  ></div>
                                </div>
                                <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400">
                                  <span>Outstanding unpaid bills: <strong>GH₵ {district.revenueArrears.toLocaleString()}</strong></span>
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                    Active Discrepancies: {district.activeLeaks + district.activeThefts} (Leaks: {district.activeLeaks}, Theft: {district.activeThefts})
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Side widget: Rapid National AI Loss Insight Warning Panel */}
                      <div className="bg-[#0A3C6B] text-white p-6 rounded-2xl border border-[#1E4E7E] shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 bg-[#EA9E1A] text-slate-950 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md w-max mb-4">
                            <Sparkles className="w-3.5 h-3.5" />
                            GEMINI DIRECTIVES
                          </div>
                          
                          <h3 className="text-lg font-display font-bold mb-3 leading-tight text-white">
                            Accra & Tema Critical Intervention Required
                          </h3>
                          
                          <p className="text-sm text-sky-100/90 leading-relaxed mb-4">
                            High-density monitoring at Tema Heavy Industrial Tank shows a staggering **{( (890000 - 756500) / 890000 * 100 ).toFixed(1)}% commercial bypass hazard**. Industrial block production and concrete mixers are drawing from unmetered bypass plumbing before main digital telemetry units.
                          </p>
                          
                          <div className="bg-slate-900/40 border border-white/10 p-3.5 rounded-xl text-xs space-y-2.5 text-sky-200">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Pipes at Risk: Weija Asbestos Mains</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EA9E1A]"></span>
                              <span>Action: Flush illegal bypass in Accra West</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-sky-400/20 mt-6 mt-auto">
                          <button 
                            id="btn-switch-tab-forensics"
                            onClick={() => setActiveTab("forensics")}
                            className="w-full flex items-center justify-between text-xs font-semibold bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl border border-white/10 transition"
                          >
                            <span>Initialize Technical Billing Audit</span>
                            <ChevronRight className="w-4 h-4 text-[#EA9E1A]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: IoT Sensor Stream & Map GIS */}
                {activeTab === "mapping" && (
                  <div className="space-y-8 animate-fade-in" id="tab-content-mapping">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Live IoT Sensor Feed */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-display font-bold text-slate-800">Dynamic IoT Telemetry Flow Meters</h3>
                            <p className="text-xs text-slate-500">Comparing source inflow treatment values against aggregated physical residential meters.</p>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">Active Transmissions</span>
                        </div>

                        <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                          {sensors.map((sensor) => {
                            const disc = sensor.flowRateIn - sensor.flowRateOut;
                            const percentDisc = sensor.flowRateIn > 0 ? ((disc) / sensor.flowRateIn * 100).toFixed(1) : "0";
                            
                            return (
                              <div 
                                key={sensor.id} 
                                className={`border p-4 rounded-xl transition ${
                                  sensor.status === "Theft Alert" 
                                    ? "bg-red-50/50 border-red-200 hover:bg-red-50" 
                                    : sensor.status === "Leakage Alert" 
                                      ? "bg-amber-50/50 border-amber-200 hover:bg-amber-50" 
                                      : "bg-slate-50/50 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                        {sensor.id}
                                      </span>
                                      <span className="text-xs text-slate-500 font-mono">
                                        Updated: {new Date(sensor.lastUpdated).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <h4 className="font-semibold text-slate-800 text-sm mt-1">{sensor.location}</h4>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                      sensor.status === "Theft Alert" 
                                        ? "bg-red-100 text-red-700" 
                                        : sensor.status === "Leakage Alert" 
                                          ? "bg-amber-100 text-amber-700" 
                                          : "bg-emerald-100 text-emerald-700"
                                    }`}>
                                      {sensor.status}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                      sensor.theftRisk === "High" 
                                        ? "bg-rose-100 text-rose-700" 
                                        : sensor.theftRisk === "Medium" 
                                          ? "bg-yellow-100 text-yellow-700" 
                                          : "bg-sky-100 text-sky-700"
                                    }`}>
                                      Risk: {sensor.theftRisk}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/85 p-3 rounded-lg border border-slate-100 text-xs shadow-inner">
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">Inflow rate</span>
                                    <strong className="text-slate-800 text-sm font-mono">{sensor.flowRateIn} L/s</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">Aggregated outflow</span>
                                    <strong className="text-slate-800 text-sm font-mono">{sensor.flowRateOut} L/s</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">Discrepancy</span>
                                    <strong className={`text-sm font-mono ${disc > 30 ? "text-red-600 font-bold" : "text-emerald-700"}`}>
                                      {disc} L/s ({percentDisc}%)
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">Sensor pressure</span>
                                    <strong className={`text-slate-800 text-sm font-mono ${sensor.pressure < 2.0 ? "text-red-500" : ""}`}>
                                      {sensor.pressure.toFixed(1)} Bar
                                    </strong>
                                  </div>
                                </div>
                                
                                {/* Anomaly simulator trigger for testing */}
                                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex flex-wrap gap-2 items-center justify-between">
                                  <span className="text-[11px] text-slate-500 font-mono">Simulate water pipe flow anomalies:</span>
                                  <div className="flex gap-1.5">
                                    <button 
                                      id={`simulate-normal-${sensor.id}`}
                                      onClick={async () => {
                                        const res = await fetch(`/api/sensors/${sensor.id}/simulate`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ flowRateIn: 100, flowRateOut: 98, pressure: 3.5 })
                                        });
                                        const updated = await res.json();
                                        setSensors(sensors.map(s => s.id === sensor.id ? updated.sensor : s));
                                      }}
                                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded transition"
                                    >
                                      Normal Operations
                                    </button>
                                    <button 
                                      id={`simulate-burst-${sensor.id}`}
                                      onClick={async () => {
                                        const res = await fetch(`/api/sensors/${sensor.id}/simulate`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ flowRateIn: 220, flowRateOut: 130, pressure: 1.2 })
                                        });
                                        const updated = await res.json();
                                        setSensors(sensors.map(s => s.id === sensor.id ? updated.sensor : s));
                                      }}
                                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded transition"
                                    >
                                      Simulate Leak / Burst
                                    </button>
                                    <button 
                                      id={`simulate-theft-${sensor.id}`}
                                      onClick={async () => {
                                        const res = await fetch(`/api/sensors/${sensor.id}/simulate`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ flowRateIn: 450, flowRateOut: 210, pressure: 4.5 })
                                        });
                                        const updated = await res.json();
                                        setSensors(sensors.map(s => s.id === sensor.id ? updated.sensor : s));
                                      }}
                                      className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded transition"
                                    >
                                      Simulate Bypass Theft
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Map GIS Simulation Visualization Panel */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
                        <div className="mb-4">
                          <h3 className="text-lg font-display font-bold text-slate-800">Ghana Smart Water GIS Map</h3>
                          <p className="text-xs text-slate-500">Live coordinates mapping leak reports & localized low telemetry zones across Southern and Central Ghana grids.</p>
                        </div>

                        {/* Custom Interactive SVG Map Vector representation of Ghana */}
                        <div className="bg-sky-50 rounded-xl relative border border-slate-200 p-4 h-96 flex flex-col justify-between overflow-hidden shadow-inner">
                          {/* Compass indicator */}
                          <div className="absolute top-3 right-3 bg-white/70 backdrop-blur border border-slate-200 rounded-lg p-1.5 text-[9px] font-mono text-slate-500 flex flex-col items-center">
                            <span>N 5.6037°</span>
                            <span>W 0.1870°</span>
                          </div>

                          {/* SVG Plotting of some major cities */}
                          <svg className="w-full h-full absolute inset-0 opacity-40 select-none pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Lake Volta simulation */}
                            <path d="M 55,20 C 65,30 60,45 62,55 C 64,65 57,75 50,80 C 48,75 42,65 48,55 C 49,45 42,35 55,20" fill="#bae6fd" stroke="#38bdf8" strokeWidth="1"/>
                            {/* Coast line */}
                            <path d="M 0,85 C 30,85 70,82 100,80" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="3,3" fill="none"/>
                          </svg>

                          <div className="relative z-10 space-y-3">
                            <span className="text-[10px] font-mono bg-[#0A3C6B] text-white px-2 py-0.5 rounded uppercase">GIS Telemetry Overlay</span>
                          </div>

                          {/* Dynamic GIS markers mapped overlay */}
                          <div className="relative flex-1 flex flex-col justify-around py-4">
                            
                            {/* Marker: Tamale */}
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer">
                              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] border-2 border-white ring-2 ring-emerald-300">
                                T
                              </div>
                              <span className="text-[10px] bg-slate-950/80 text-white font-mono px-1 rounded mt-1">Tamale Sector</span>
                            </div>

                            {/* Marker: Adum Kumasi */}
                            <div className="absolute top-1/2 left-1/4 flex flex-col items-center group cursor-pointer">
                              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                              <div className="w-4.5 h-4.5 rounded-full bg-[#EA9E1A] flex items-center justify-center text-slate-900 font-bold text-[9px] border border-white">
                                K
                              </div>
                              <span className="text-[9px] bg-white text-slate-800 font-sans font-bold px-1.5 border border-slate-200 rounded shadow mt-1">Kumasi (Alert)</span>
                            </div>

                            {/* Marker: Weija Accra West */}
                            <div className="absolute bottom-16 left-1/3 flex flex-col items-center group cursor-pointer">
                              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                              <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-[10px] stroke-white stroke-2 border-2 border-white">
                                W
                              </div>
                              <span className="text-[9px] bg-white text-slate-800 shadow font-bold px-1.5 rounded mt-1">Accra West (Weija Break)</span>
                            </div>

                            {/* Marker: Tema Main */}
                            <div className="absolute bottom-14 right-1/4 flex flex-col items-center group cursor-pointer">
                              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                              <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[9px] border-2 border-white">
                                T
                              </div>
                              <span className="text-[9px] bg-white text-slate-800 block shadow font-bold px-1.5 rounded mt-1">Tema (Theft Risk)</span>
                            </div>

                          </div>

                          <div className="bg-white/95 backdrop-blur p-3 rounded-lg border border-slate-100 text-xs shadow">
                            <h4 className="font-semibold text-slate-800 mb-1">GIS Marker Key:</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal Sector
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pressure Drop
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Pipe Break / Severe Leak
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span> Commercial Theft Suspect
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Forensics & Gemini Digital Audit */}
                {activeTab === "forensics" && (
                  <div className="space-y-8 animate-fade-in" id="tab-content-forensics">
                    {/* Bulk AI Operations */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-[#EA9E1A]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
                      
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                        <div className="max-w-xl">
                          <span className="bg-[#EA9E1A] text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase mb-2 inline-block">
                            Advanced Gemini AI Suite
                          </span>
                          <h3 className="text-xl md:text-2xl font-display font-medium tracking-tight text-white mb-2">
                            Run Bulk National Water Loss & Billing Audit
                          </h3>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            Triggers a system-wide AI scan of Ghanaian residential and commercial accounts to spot outliers, classify potential industrial bypassing, and draft customized consumer repayment notices.
                          </p>
                        </div>
                        
                        <button
                          id="trigger-bulk-audit"
                          onClick={handleTriggerAIAudit}
                          disabled={isAuditing}
                          className="w-full lg:w-auto bg-[#EA9E1A] hover:bg-[#EA9E1A]/90 text-slate-950 font-bold px-6 py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2.5 shrink-0"
                        >
                          <Sparkles className="w-5 h-5" />
                          <span>{isAuditing ? "Processing Audit Sweeps..." : "Run AI Digital Audit Sweep"}</span>
                        </button>
                      </div>

                      {/* Displaying AI generated markdown sweep */}
                      {auditResult && (
                        <div className="mt-8 bg-slate-950/80 border border-white/10 p-6 rounded-2xl max-h-[450px] overflow-y-auto" id="audit-result-render">
                          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-xs font-mono text-[#EA9E1A]">
                            <span>GWCL REVENUE PROTECTION INTELLIGENCE REPORT</span>
                            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full uppercase text-[10px]">ANALYSES SECURE</span>
                          </div>
                          
                          <div className="prose prose-invert prose-sm text-slate-300 max-w-none space-y-4">
                            {/* Simple text conversion or rendering since we received Markdown */}
                            {auditResult.split("\n").map((line, i) => {
                              if (line.startsWith("###")) {
                                return <h3 key={i} className="text-md font-bold text-white mt-4 font-display">{line.replace("###", "")}</h3>;
                              }
                              if (line.startsWith("-") || line.startsWith("*")) {
                                return (
                                  <li key={i} className="ml-4 list-disc text-slate-300 py-1 font-sans">
                                    {line.replace(/^-\s*/, "").replace(/^\*\s*/, "")}
                                  </li>
                                );
                              }
                              if (line.match(/^\d+\./)) {
                                return (
                                  <div key={i} className="font-semibold text-[#EA9E1A] mt-3">
                                    {line}
                                  </div>
                                );
                              }
                              return <p key={i} className="text-sm text-slate-300 leading-relaxed font-sans">{line}</p>;
                            })}
                          </div>

                          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3 text-xs">
                            <button 
                              id="btn-dismiss-audit"
                              onClick={() => setAuditResult(null)}
                              className="text-slate-400 hover:text-white px-3 py-2 rounded transition"
                            >
                              Clear Audit Output
                            </button>
                            <button 
                              id="btn-copy-sms-remind"
                              onClick={() => {
                                alert("Polite local SMS reminders copied to systems clipboard for bulk distribution.");
                              }}
                              className="bg-[#0A3C6B] text-sky-200 border border-sky-600/35 hover:bg-[#0A3C6B]/80 px-4 py-2 rounded transition"
                            >
                              Copy SMS Reminders
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Master Client list to inspect suspected connections */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-display font-bold text-slate-800">Master Revenue Ledger & Billing Suspicion Check</h3>
                          <p className="text-xs text-slate-500 font-sans">Water arrears exceeding GH₵ 500 trigger digital billing audits due to potential secondary bypass taps.</p>
                        </div>

                        {/* Direct Filters */}
                        <div className="flex gap-2">
                          <input 
                            id="ledger-search-box"
                            type="text" 
                            placeholder="Filter by customer name or meter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#0A3C6B]"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                              <th className="py-3 px-4">Customer Details</th>
                              <th className="py-3 px-4">Meter Number</th>
                              <th className="py-3 px-4">District / Region</th>
                              <th className="py-3 px-4 text-right">Outstanding Balance</th>
                              <th className="py-3 px-4">Suspected Bypass Tap</th>
                              <th className="py-3 px-4">Payment Status</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bills
                              .filter(bill => 
                                bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                bill.meterNumber.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((bill) => (
                                <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition align-middle">
                                  <td className="py-3.5 px-4">
                                    <div className="font-semibold text-slate-800">{bill.customerName}</div>
                                    <div className="text-[10px] text-slate-400">ID: {bill.id}</div>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-slate-500 font-medium">
                                    {bill.meterNumber}
                                  </td>
                                  <td className="py-3.5 px-4 font-sans text-slate-600">
                                    {bill.region}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-right text-slate-900 font-bold">
                                    GH₵ {bill.outstandingAmount.toFixed(2)}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {bill.illegalConnectionSuspected ? (
                                      <span className="flex items-center gap-1.5 text-rose-600 font-medium text-[11px] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full w-max">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                        SUSPECT BYPASS
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                      bill.status === "Paid" 
                                        ? "bg-emerald-100 text-emerald-800" 
                                        : bill.status === "Overdue" 
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-slate-100 text-slate-800"
                                    }`}>
                                      {bill.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <button
                                      id={`bill-inspect-${bill.id}`}
                                      onClick={() => {
                                        // Auto-populate citizen simulation values for rapid troubleshooting
                                        setCurrentRole("citizen");
                                        setActiveTab("bills-portal");
                                        setSelectedBill(bill);
                                        setPayAmount(bill.outstandingAmount.toFixed(0));
                                      }}
                                      className="text-[11px] bg-slate-900 text-slate-100 hover:bg-[#0A3C6B] px-3 py-1.5 rounded-lg font-semibold transition"
                                    >
                                      Test Pay Gate
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ====== 2. FIELD TECHNICIAN COMPANION MOBILE APP SUITE ====== */}
            {currentRole === "technician" && (
              <div id="role-technician-view" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Live Incident Pipeline Flow */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-display font-bold text-slate-800">Ghana Grid Dispatch Incidents Pipeline</h3>
                        <p className="text-xs text-slate-500">View leaks, burst pipes, and citizen reported illegal direct taps.</p>
                      </div>

                      {/* Filter by incident state */}
                      <div className="flex gap-2">
                        <select 
                          id="incident-filter-drop"
                          value={selectedRegionFilter}
                          onChange={(e) => setSelectedRegionFilter(e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
                        >
                          <option value="All">All Regions</option>
                          <option value="Greater Accra">Greater Accra</option>
                          <option value="Ashanti Region">Ashanti Region</option>
                          <option value="Northern Region">Northern Region</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                      {reports
                        .filter(rep => selectedRegionFilter === "All" || rep.region === selectedRegionFilter)
                        .map((ticket) => (
                          <div 
                            key={ticket.id} 
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setTechStatus(ticket.status);
                              setTechNotes(ticket.technicianNotes || "");
                            }}
                            className={`border p-5 rounded-xl transition cursor-pointer ${
                              selectedTicket?.id === ticket.id 
                                ? "ring-2 ring-[#0A3C6B] bg-slate-50 border-[#0A3C6B]" 
                                : "bg-white hover:bg-slate-50/50 border-slate-100"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <span className="font-mono text-xs font-bold bg-[#0A3C6B]/10 text-[#0A3C6B] px-2 py-0.5 rounded">
                                    {ticket.id}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    ticket.severity === "Critical" 
                                      ? "bg-rose-100 text-rose-700" 
                                      : ticket.severity === "High" 
                                        ? "bg-amber-100 text-amber-700" 
                                        : "bg-slate-100 text-slate-700"
                                  }`}>
                                    {ticket.severity} Impact
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Filed: {new Date(ticket.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                <h4 className="font-display font-semibold text-slate-950 text-base">{ticket.title}</h4>
                                <p className="text-xs text-slate-500 mt-2 font-sans line-clamp-2">{ticket.locationDesc}</p>
                                
                                <div className="flex items-center gap-1.5 mt-3.5 text-xs text-slate-600 font-mono">
                                  <MapPin className="w-3.5 h-3.5 text-[#EA9E1A]" />
                                  <span>{ticket.region} (Lat: {ticket.gpsLocation.latitude.toFixed(4)}, Lng: {ticket.gpsLocation.longitude.toFixed(4)})</span>
                                </div>
                              </div>

                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded ${
                                ticket.status === "Pending" 
                                  ? "bg-red-100 text-red-800" 
                                  : ticket.status === "Dispatched" 
                                    ? "bg-amber-100 text-amber-800" 
                                    : ticket.status === "In Progress" 
                                      ? "bg-sky-100 text-sky-800" 
                                      : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {ticket.status}
                              </span>
                            </div>

                            {/* Show summary indicator if notes or AI insights exist */}
                            {ticket.aiAnalysis && (
                              <div className="mt-4 bg-[#0A3C6B]/5 border border-[#0A3C6B]/10 p-3 rounded-lg flex items-start gap-2 text-xs">
                                <Sparkles className="w-4 h-4 text-[#EA9E1A] shrink-0 mt-0.5 animate-pulse" />
                                <div>
                                  <span className="font-semibold text-[#0A3C6B] block">Gemini Operations Intel:</span>
                                  <span className="text-slate-600 italic line-clamp-2">{ticket.aiAnalysis}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Technical Details & Flow Diagnostics */}
                <div className="space-y-6">
                  {/* Incident Dispatch Detail */}
                  {selectedTicket ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm" id="tech-dispatch-panel">
                      <div className="border-b border-slate-100 pb-4 mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Selected Incident File</span>
                        <h3 className="font-display font-bold text-slate-900 text-lg">{selectedTicket.id}: {selectedTicket.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-sans">{selectedTicket.locationDesc}</p>
                      </div>

                      {/* AI Reasoning Section */}
                      {selectedTicket.aiAnalysis && (
                        <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 mb-6 text-xs">
                          <div className="flex items-center gap-1.5 text-[#EA9E1A] font-bold font-mono mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span>AI DECISION RECOMMENDATIONS</span>
                          </div>
                          <p className="leading-relaxed font-sans text-sky-100/90">{selectedTicket.aiAnalysis}</p>
                        </div>
                      )}

                      {/* Update dispatch status or technical comments */}
                      <form onSubmit={handleUpdateTicket} className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Grid Dispatch Status</label>
                          <select 
                            id="tech-status-select"
                            value={techStatus} 
                            onChange={(e) => setTechStatus(e.target.value as ReportTicket["status"])}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                          >
                            <option value="Pending">Pending (Awaiting Dispatch)</option>
                            <option value="Dispatched">Dispatched Team</option>
                            <option value="In Progress">In Progress (Active Repair)</option>
                            <option value="Resolved">Resolved (Ancillary leak secured)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Field Engineering Notes & Material usage</label>
                          <textarea 
                            id="tech-notes-textarea"
                            value={techNotes} 
                            onChange={(e) => setTechNotes(e.target.value)}
                            placeholder="Specify size of repair clamps used, depth of trench, or details on bypassed digital water meter confiscation..."
                            rows={4}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3C6B]"
                          />
                        </div>

                        <button
                          id="btn-update-ticket-submit"
                          type="submit"
                          disabled={updatingTicket}
                          className="w-full text-xs font-bold uppercase tracking-wider bg-[#0A3C6B] hover:bg-[#0A3C6B]/90 text-white py-3 rounded-lg transition"
                        >
                          {updatingTicket ? "Registering notes..." : "Save Technical Log"}
                        </button>
                      </form>

                      {selectedTicket.reporterName && (
                        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                          <span className="font-semibold text-slate-700 block mb-1">Reporter Information</span>
                          <div>Name: {selectedTicket.reporterName}</div>
                          {selectedTicket.reporterPhone && <div>Phone: {selectedTicket.reporterPhone}</div>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#0A3C6B]/5 border border-dashed border-[#0A3C6B]/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Wrench className="w-10 h-10 text-[#0A3C6B]/40 mb-3" />
                      <h4 className="font-semibold text-slate-700 text-sm">Select GWCL Incident</h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">Tap any reported hazard from the Ghana grid map or dispatch pipeline to allocate staff, view AI diagnosis, or log repairs.</p>
                    </div>
                  )}

                  {/* AI Specialized Technical Diagnostic Sandbox (What-if Analyzer) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm" id="anomaly-sandbox">
                    <span className="bg-[#EA9E1A]/10 text-[#EA9E1A] text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase mb-3 inline-block">
                      Diagnostic Laboratory
                    </span>
                    <h3 className="text-base font-display font-semibold text-slate-800 mb-2">Technical Discrepancy Simulator</h3>
                    <p className="text-xs text-slate-500 mb-4">Input custom flow rates representing real-time bypass pipe zones to generate an instant Gemini geological anomaly interpretation.</p>

                    <div className="space-y-3.5 text-xs text-slate-700">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Inlet Target Flow: <strong>{customFlowIn} L/s</strong></span>
                        </div>
                        <input 
                          id="sim-flow-in"
                          type="range" 
                          min="10" 
                          max="800" 
                          value={customFlowIn} 
                          onChange={(e) => setCustomFlowIn(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Aggregated Customer Billing Outlet: <strong>{customFlowOut} L/s</strong></span>
                        </div>
                        <input 
                          id="sim-flow-out"
                          type="range" 
                          min="10" 
                          max="800" 
                          value={customFlowOut} 
                          onChange={(e) => setCustomFlowOut(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Main Pipe Pressure: <strong>{customPressure.toFixed(1)} Bar</strong></span>
                        </div>
                        <input 
                          id="sim-pressure"
                          type="range" 
                          min="0.5" 
                          max="6.5" 
                          step="0.1"
                          value={customPressure} 
                          onChange={(e) => setCustomPressure(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          id="btn-run-analyzer-sweep"
                          onClick={handleUpdateSandboxSensor}
                          disabled={isAnalyzingSandbox}
                          className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs py-2 rounded font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#EA9E1A]" />
                          <span>{isAnalyzingSandbox ? "Analyzing Pipe Flows..." : "Run AI Anomaly Diagnostic"}</span>
                        </button>
                      </div>

                      {sandboxAnalysis && (
                        <div className="mt-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-600 space-y-2 text-[11px] leading-relaxed max-h-56 overflow-y-auto" id="sandbox-analysis-render">
                          <strong className="text-slate-800 block border-b pb-1">Gemini Laboratory Diagnostic:</strong>
                          <p className="whitespace-pre-line">{sandboxAnalysis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ====== 3. CITIZEN WATER PORTAL SUITE ====== */}
            {currentRole === "citizen" && (
              <div id="role-citizen-view" className="space-y-8 animate-fade-in">
                {/* Citizens Portal Internal Sub-tabs */}
                <div className="flex bg-slate-200/60 p-1.5 rounded-xl border border-slate-300/30 max-w-md">
                  <button
                    id="citizen-subtab-report"
                    onClick={() => setActiveTab("report-portal")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      activeTab === "report-portal" 
                        ? "bg-white text-[#0A3C6B] shadow-sm font-bold" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🚀 Report Leakage / Theft
                  </button>
                  <button
                    id="citizen-subtab-bills"
                    onClick={() => setActiveTab("bills-portal")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      activeTab === "bills-portal" 
                        ? "bg-white text-[#0A3C6B] shadow-sm font-bold" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    💳 Pay With Mobile Money (MoMo)
                  </button>
                </div>

                {/* Sub Tab: Citizens Leakage & Illegal Bypass Reporter */}
                {activeTab === "report-portal" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="citizen-report-section">
                    
                    {/* Report Form */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
                      <div className="border-b border-slate-100 pb-4 mb-6">
                        <span className="text-[#EA9E1A] text-xs uppercase font-bold tracking-wider font-mono">Ghana Citizen Taskforce</span>
                        <h3 className="text-xl font-display font-extrabold text-[#0A3C6B] mt-0.5">Let's Secure Ghana's Water Wealth</h3>
                        <p className="text-xs text-slate-500 mt-1">Water loss leads to dry taps. Help Ghana Water CO. pinpoint leaks or suspected industrial bypass connections instantly.</p>
                      </div>

                      {reportSuccess && (
                        <div className="bg-emerald-50 text-emerald-800 p-4 border border-emerald-200 rounded-xl mb-6 text-xs flex gap-2" id="citizen-report-success">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold block">Kyerɛw krataa bi dze ma hɛn (Submitted successfully)!</span>
                            <span className="leading-relaxed block mt-1">{reportSuccess}</span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleReportSubmit} className="space-y-4 text-xs text-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Incident Headline / Title *</label>
                            <input 
                              id="citizen-form-title"
                              type="text"
                              required
                              value={newReport.title}
                              onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                              placeholder="e.g. Major burst pipe on main junction"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Incident Classification *</label>
                            <select 
                              id="citizen-form-type"
                              value={newReport.type}
                              onChange={(e) => setNewReport({ ...newReport, type: e.target.value as ReportTicket["type"] })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-sans"
                            >
                              <option value="Leakage">Physical Leakage / Bursted Pipe</option>
                              <option value="Illegal Connection">Commercial Bypass / Illegal Connection</option>
                              <option value="Vandalism/Theft">Vandalism of Water Meter Box</option>
                              <option value="Low Pressure">Low Pressure / Dry Neighborhood Taps</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Description & Landmark *</label>
                          <textarea 
                            id="citizen-form-desc"
                            required
                            rows={3}
                            value={newReport.locationDesc}
                            onChange={(e) => setNewReport({ ...newReport, locationDesc: e.target.value })}
                            placeholder="e.g. Near Spintex Shell station, behind the block cement factory. Water is flooding the drainage ditch."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Your Name (Optional)</label>
                            <input 
                              id="citizen-form-name"
                              type="text"
                              value={newReport.reporterName}
                              onChange={(e) => setNewReport({ ...newReport, reporterName: e.target.value })}
                              placeholder="e.g. Kofi Boateng"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Your MoMo Phone (for verification)</label>
                            <input 
                              id="citizen-form-phone"
                              type="tel"
                              value={newReport.reporterPhone}
                              onChange={(e) => setNewReport({ ...newReport, reporterPhone: e.target.value })}
                              placeholder="e.g. +233 24 123 4567"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Grid Area / Region / Municipality</label>
                            <select 
                              id="citizen-form-region"
                              value={newReport.region}
                              onChange={(e) => setNewReport({ ...newReport, region: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                            >
                              <option value="Greater Accra">Greater Accra Region (Osu, Spintex, Weija)</option>
                              <option value="Ashanti Region">Ashanti Region (Kumasi, Adum)</option>
                              <option value="Northern Region">Northern Region (Tamale, Jubilee Park)</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive Geolocation Picker Simulation */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-700">Attach Precise GPS Tracking Coordinates</span>
                            <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded uppercase">Simulated GPS Pick</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Latitude Coordinate</span>
                              <input 
                                id="citizen-form-lat"
                                type="number" 
                                step="any"
                                value={newReport.lat} 
                                onChange={(e) => setNewReport({ ...newReport, lat: parseFloat(e.target.value) })}
                                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Longitude Coordinate</span>
                              <input 
                                id="citizen-form-lng"
                                type="number" 
                                step="any"
                                value={newReport.lng} 
                                onChange={(e) => setNewReport({ ...newReport, lng: parseFloat(e.target.value) })}
                                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <button
                              id="gps-use-location"
                              type="button"
                              onClick={() => {
                                // Simulate user retrieving current GPS
                                setNewReport({
                                  ...newReport,
                                  lat: 5.6037 + (Math.random() - 0.5) * 0.1,
                                  lng: -0.1870 + (Math.random() - 0.5) * 0.1
                                });
                              }}
                              className="bg-slate-900 text-white hover:bg-[#0A3C6B] px-3 py-1.5 rounded transition font-medium flex items-center gap-1.5"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              Get My Exact GPS Coordinates
                            </button>
                            <button
                              id="gps-set-tem"
                              type="button"
                              onClick={() => setNewReport({ ...newReport, lat: 5.6231, lng: -0.0912 })}
                              className="text-slate-600 hover:text-slate-950 px-2 py-1 bg-white border border-slate-200 rounded font-mono transition"
                            >
                              Set Accra East
                            </button>
                            <button
                              id="gps-set-kms"
                              type="button"
                              onClick={() => setNewReport({ ...newReport, lat: 6.6901, lng: -1.6212 })}
                              className="text-slate-600 hover:text-slate-950 px-2 py-1 bg-white border border-slate-200 rounded font-mono transition"
                            >
                              Set Kumasi
                            </button>
                          </div>
                        </div>

                        <button
                          id="citizen-report-btn-submit"
                          type="submit"
                          disabled={submittingReport}
                          className="w-full bg-[#0A3C6B] hover:bg-[#0A3C6B]/90 text-white font-bold py-3.5 rounded-xl transition text-xs uppercase tracking-wider"
                        >
                          {submittingReport ? "Validating & Querying AI diagnostics..." : "Transmit Citizen Dispatch Ticket"}
                        </button>
                      </form>
                    </div>

                    {/* Left widget: GWCL citizen service charter advice */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-[#0A3C6B] to-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-inner">
                        <div className="relative z-10">
                          <h3 className="text-base font-display font-semibold mb-3">Citizens Compensation Scheme</h3>
                          <p className="text-xs text-sky-100/90 leading-relaxed space-y-2">
                            Ghana Water Company GWCL operates an incentive framework for citizen-led water protection:
                          </p>
                          <ul className="text-xs text-sky-100/95 space-y-2 mt-3 list-disc pl-4 font-sans">
                            <li>Verified reports of <strong>major physical commercial leaks</strong> receive swift repairs with digital recognition points.</li>
                            <li>Reporting <strong>clandestine bypass layouts</strong> triggers structural billing audits, rewarding verified citizens with water charge credits of up to GH₵ 200.</li>
                            <li>Restoring pressures ensures community health.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Recent reports posted by public */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative">
                        <h4 className="font-display font-semibold text-slate-800 text-sm mb-3">Recent Citizen Filings</h4>
                        <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                          {reports.slice(0, 4).map((r) => (
                            <div key={r.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-none last:pb-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-[#0A3C6B]">{r.id}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  r.status === "Pending" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                }`}>
                                  {r.status}
                                </span>
                              </div>
                              <p className="font-medium text-slate-800 line-clamp-1">{r.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono italic block mt-0.5">{r.region}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub Tab: Mobile Money Billing Recovery Gateway */}
                {activeTab === "bills-portal" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs font-sans text-slate-800" id="citizen-billing-section">
                    
                    {/* Unpaid Bills Stream */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
                      <div className="border-b border-slate-100 pb-4 mb-6">
                        <h3 className="text-lg font-display font-bold text-slate-900">Ghana Water Company Ltd Billing Dashboard</h3>
                        <p className="text-xs text-slate-500 mt-1">Select your household account ledger below to simulate immediate payment via Mobile Money (MoMo).</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bills.map((billItem) => (
                          <div 
                            key={billItem.id} 
                            onClick={() => {
                              setSelectedBill(billItem);
                              setPayAmount(billItem.outstandingAmount.toFixed(2));
                              setPaymentSuccessMsg(null);
                            }}
                            className={`border p-4 rounded-xl cursor-pointer transition flex flex-col justify-between h-40 ${
                              selectedBill?.id === billItem.id 
                                ? "ring-2 ring-[#0A3C6B] bg-slate-50/50 border-[#0A3C6B]" 
                                : "bg-white hover:bg-slate-50/50 border-slate-100"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-mono text-slate-400">Meter: {billItem.meterNumber}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  billItem.status === "Paid" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : billItem.status === "Overdue" 
                                      ? "bg-red-100 text-red-800" 
                                      : "bg-slate-100 text-slate-800"
                                }`}>
                                  {billItem.status}
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{billItem.customerName}</h4>
                              <span className="text-[10px] text-slate-500 block">{billItem.region} district</span>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Outstanding</span>
                                <strong className="text-slate-950 font-mono text-base">GH₵ {billItem.outstandingAmount.toFixed(2)}</strong>
                              </div>
                              
                              <span className="text-[10px] font-semibold text-[#0A3C6B] flex items-center gap-1">
                                Pay Now <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Mobile Money Payment Gateway (Simulated) */}
                    <div>
                      {selectedBill ? (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm" id="momo-checkout-panel">
                          <div className="text-center border-b border-slate-100 pb-4 mb-4">
                            <span className="p-3 bg-indigo-50 text-[#0A3C6B] inline-flex rounded-2xl mb-2 items-center justify-center">
                              <Wallet className="w-6 h-6" />
                            </span>
                            <h3 className="font-display font-extrabold text-[#0A3C6B] text-base">Simulated Ghana MoMo Gate</h3>
                            <p className="text-xs text-slate-500 mt-1">Paying bill for <strong>{selectedBill.customerName}</strong></p>
                          </div>

                          {paymentSuccessMsg && (
                            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 mb-4 text-xs" id="momo-pay-success">
                              {paymentSuccessMsg}
                            </div>
                          )}

                          <form onSubmit={handlePayBill} className="space-y-4 text-xs text-slate-700">
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">MoMo Operator Network</label>
                              <div className="grid grid-cols-3 gap-2">
                                {["MTN MoMo", "Telecel", "AT Money"].map((op) => (
                                  <button
                                    id={`momo-picker-${op.replace(/ /g, "-")}`}
                                    key={op}
                                    type="button"
                                    onClick={() => setMomoChannel(op)}
                                    className={`py-2 text-[10px] font-mono rounded-lg border text-center font-bold ${
                                      momoChannel === op 
                                        ? "bg-amber-400 border-amber-500 text-slate-950" 
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {op}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Subscriber Mobile Number (Ghana Pin)</label>
                              <input 
                                id="momo-subscriber-phone"
                                type="tel"
                                required
                                value={momoPhone}
                                onChange={(e) => setMomoPhone(e.target.value)}
                                placeholder="e.g. 0244123456"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                                <span>Specific Payment Amount (GH₵)</span>
                                <span>Max: {selectedBill.outstandingAmount.toFixed(2)}</span>
                              </div>
                              <input 
                                id="momo-pay-amount"
                                type="number"
                                required
                                min="1"
                                step="any"
                                max={selectedBill.outstandingAmount}
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-sm"
                              />
                            </div>

                            <button
                              id="momo-trigger-checkout"
                              type="submit"
                              disabled={isPaying || selectedBill.outstandingAmount <= 0}
                              className="w-full bg-[#0A3C6B] hover:bg-[#0A3C6B]/90 text-white font-bold py-3.5 rounded-lg transition"
                            >
                              {isPaying ? "Authorizing with MoMo..." : `Pay GH₵ ${parseFloat(payAmount || "0").toFixed(2)} via MoMo`}
                            </button>
                          </form>

                          {selectedBill.paymentHistory && selectedBill.paymentHistory.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                              <span className="font-semibold text-slate-800 block mb-2">Simulated Account History:</span>
                              <div className="space-y-2 max-h-36 overflow-y-auto">
                                {selectedBill.paymentHistory.map((hist, ind) => (
                                  <div key={ind} className="bg-slate-50 border border-slate-100 p-2 rounded text-[11px] flex justify-between">
                                    <div>
                                      <span className="font-semibold block text-slate-800">GH₵ {hist.amount.toFixed(2)}</span>
                                      <span className="text-[10px] text-slate-400 font-mono italic">{hist.reference}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{hist.date}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#0A3C6B]/5 border border-dashed border-[#0A3C6B]/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                          <Wallet className="w-10 h-10 text-[#0A3C6B]/40 mb-3" />
                          <h4 className="font-semibold text-slate-700 text-sm">Select Billing Account</h4>
                          <p className="text-xs text-slate-400 max-w-xs mt-1">Tap any unpaid bills card from the left panel to trigger secure checkout simulation via electronic mobile channels.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modern, descriptive footer representing regional utilities */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 mt-auto border-t border-slate-900" id="portal-footer">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <strong className="text-white font-display">Ghana Water Company Limited (GWCL) Joint Initiative</strong>
            </div>
            <p className="text-slate-500 text-[11px]">Deploying machine learning analytics and flow telemetry to safe-keep national water grids.</p>
          </div>
          <div className="flex gap-4 font-mono text-[10px] text-slate-500">
            <span>Server: V1.4.2</span>
            <span>Local Time: Accra (UTC+0)</span>
          </div>
        </div>
      </footer>

      {/* Dynamic interactive Sign In Dialog Popup Modal */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="sign-in-modal-container">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* National flag ribbon accent */}
            <div className="h-1 w-full flex">
              <div className="h-full bg-red-600 w-1/3"></div>
              <div className="h-full bg-yellow-400 w-1/3"></div>
              <div className="h-full bg-emerald-600 w-1/3"></div>
            </div>

            <div className="bg-[#0A3C6B] text-white p-6 relative">
              <button 
                onClick={() => setIsSignInModalOpen(false)}
                className="absolute top-4 right-4 text-sky-200 hover:text-white transition text-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 bg-sky-500/20 rounded-lg border border-sky-400/30">
                  <Droplet className="w-5 h-5 text-[#EA9E1A]" />
                </div>
                <h3 className="font-display font-bold text-lg">GWCL Authentication Grid</h3>
              </div>
              <p className="text-xs text-sky-200/80">Access authorized national leakage mapping & billing diagnostics.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!signInName.trim() || !signInEmail.trim()) {
                  alert("Please provide both a name and an email address.");
                  return;
                }
                setUser({ name: signInName, email: signInEmail });
                setIsSignInModalOpen(false);
              }}
              className="p-6 space-y-4"
              id="sign-in-form"
            >
              {/* Preset Ghana Water Admin profiles for quick access */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-2">Select a GWCL Officer Profile:</span>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInName("Officer Kofi");
                      setSignInEmail("kofi.owusu@gwcl.gov.gh");
                    }}
                    className={`p-2.5 text-left rounded-xl border text-xs transition cursor-pointer ${
                      signInEmail === "kofi.owusu@gwcl.gov.gh"
                        ? "bg-[#0A3C6B]/5 border-[#0A3C6B] text-[#0A3C6B] font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block font-medium text-slate-800">Officer Kofi</span>
                    <span className="text-[10px] text-slate-400">Field Technician</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInName("Fred Okley");
                      setSignInEmail("okleyfred32@gmail.com");
                    }}
                    className={`p-2.5 text-left rounded-xl border text-xs transition cursor-pointer ${
                      signInEmail === "okleyfred32@gmail.com"
                        ? "bg-[#0A3C6B]/5 border-[#0A3C6B] text-[#0A3C6B] font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block font-medium text-[#EA9E1A] font-bold">Fred Okley</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Officer Head</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2"></div>

              {/* Custom Profile info */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name / Callsign</label>
                  <input
                    type="text"
                    required
                    value={signInName}
                    onChange={(e) => setSignInName(e.target.value)}
                    placeholder="e.g. Inspector Kwabena"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3C6B] focus:border-[#0A3C6B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">GWCL Email Address</label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="e.g. officer@gwcl.gov.gh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3C6B] focus:border-[#0A3C6B]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSignInModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#EA9E1A] hover:bg-[#EA9E1A]/95 text-slate-950 text-xs font-bold py-3 rounded-xl transition shadow-md cursor-pointer"
                >
                  Confirm Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
