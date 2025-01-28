import { useLocalStorage } from "../hooks/useLocalStorage";

interface DashboardPreferences {
  timePeriod: string;
  chartView: "individual" | "cumulative";
  lineView: "separate" | "combined";
}

interface ExpensesPreferences {
  page: number;
  limit: number;
  year: string;
  month: string;
  category: string;
}

export function useDashboardPreferences() {
  return useLocalStorage<DashboardPreferences>("dashboard-preferences", {
    timePeriod: "6m",
    chartView: "individual",
    lineView: "separate",
  });
}

export function useExpensesPreferences() {
  return useLocalStorage<ExpensesPreferences>("expenses-preferences", {
    page: 1,
    limit: 10,
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString().padStart(2, "0"),
    category: "all",
  });
} 