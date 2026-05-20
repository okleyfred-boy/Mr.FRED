export interface IotSensor {
  id: string;
  location: string;
  region: string;
  flowRateIn: number;   // L/s entering sector
  flowRateOut: number;  // L/s metered by household bills
  pressure: number;     // Bar
  theftRisk: "Low" | "Medium" | "High";
  status: "Normal" | "Mishap" | "Leakage Alert" | "Theft Alert";
  lastUpdated: string;
}

export interface ReportTicket {
  id: string;
  title: string;
  type: "Leakage" | "Illegal Connection" | "Vandalism/Theft" | "Low Pressure" | "Billing Arrears";
  reporterName: string;
  reporterPhone: string;
  gpsLocation: {
    latitude: number;
    longitude: number;
  };
  locationDesc: string;
  region: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "Dispatched" | "In Progress" | "Resolved";
  photoUrl?: string;
  aiAnalysis?: string;
  technicianNotes?: string;
  createdAt: string;
}

export interface CitizenBill {
  id: string;
  customerName: string;
  meterNumber: string;
  region: string;
  outstandingAmount: number; // in GH₵ (Ghana Cedis)
  dueDate: string;
  usageKlh: number; // m3
  status: "Paid" | "Unpaid" | "Overdue";
  illegalConnectionSuspected: boolean;
  paymentHistory: {
    date: string;
    amount: number;
    reference: string;
  }[];
}

export interface DistrictStats {
  name: string;
  totalSupplied: number; // m3
  totalBilled: number;   // m3
  waterLossPercentage: number; // Non-Revenue Water (NRW) %
  revenueArrears: number;      // GH₵
  activeLeaks: number;
  activeThefts: number;
}
