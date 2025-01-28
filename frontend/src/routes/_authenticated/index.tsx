import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useDashboardPreferences } from "@/lib/stores/preferences";

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; chart: string }
> = {
  "Food & Dining": {
    bg: "bg-orange-100",
    text: "text-orange-800",
    chart: "#f97316",
  },
  Transportation: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    chart: "#3b82f6",
  },
  Shopping: { bg: "bg-pink-100", text: "text-pink-800", chart: "#ec4899" },
  "Bills & Utilities": {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    chart: "#eab308",
  },
  Entertainment: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    chart: "#a855f7",
  },
  "Health & Fitness": {
    bg: "bg-green-100",
    text: "text-green-800",
    chart: "#22c55e",
  },
  Travel: { bg: "bg-indigo-100", text: "text-indigo-800", chart: "#6366f1" },
  Home: { bg: "bg-red-100", text: "text-red-800", chart: "#ef4444" },
  Education: { bg: "bg-cyan-100", text: "text-cyan-800", chart: "#06b6d4" },
  Other: { bg: "bg-gray-100", text: "text-gray-800", chart: "#6b7280" },
};

const TIME_PERIODS = {
  "1m": { label: "Last Month", months: 1 },
  "3m": { label: "Last 3 Months", months: 3 },
  "6m": { label: "Last 6 Months", months: 6 },
  "1y": { label: "Last Year", months: 12 },
  ytd: { label: "Year to Date", months: 0 },
  all: { label: "All Time", months: 0 },
} as const;

type TimePeriod = keyof typeof TIME_PERIODS;

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

async function fetchDashboardData(period: TimePeriod) {
  const currentDate = new Date();
  let startDate: Date;
  const endDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  if (period === "ytd") {
    startDate = new Date(currentDate.getFullYear(), 0, 1);
  } else if (period === "all") {
    startDate = new Date(2020, 0, 1); // Some reasonable past date
  } else {
    startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - TIME_PERIODS[period].months,
      1
    );
  }

  const query = {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    limit: "500",
  };

  const res = await api.v1.expenses.$get({ query });
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface DashboardData {
  expenses: Array<{
    id: number;
    type: string;
    category: string;
    status: string;
    date: string;
    userId: string;
    title: string;
    description: string | null;
    amount: string;
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  pagination: {
    total: number;
    pages: number;
  };
}

function Dashboard() {
  const [preferences, setPreferences] = useDashboardPreferences();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard-data", preferences.timePeriod],
    queryFn: () => fetchDashboardData(preferences.timePeriod as TimePeriod),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-[400px] rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data?.expenses) return null;

  // Process data for charts
  const expensesByDay = new Map<string, { expenses: number; income: number }>();
  const categoryTotals = new Map<string, number>();
  let totalExpenses = 0;
  let totalIncome = 0;
  let biggestExpense = { amount: 0, title: "", category: "" };

  data.expenses.forEach((expense) => {
    const date = expense.date.split("T")[0];
    const amount = Number(expense.amount);

    // Daily totals
    if (!expensesByDay.has(date)) {
      expensesByDay.set(date, { expenses: 0, income: 0 });
    }
    const daily = expensesByDay.get(date)!;
    if (expense.type === "expense") {
      daily.expenses += amount;
      totalExpenses += amount;

      // Track biggest expense
      if (amount > biggestExpense.amount) {
        biggestExpense = {
          amount,
          title: expense.title,
          category: expense.category,
        };
      }

      // Category totals
      const currentTotal = categoryTotals.get(expense.category) || 0;
      categoryTotals.set(expense.category, currentTotal + amount);
    } else {
      daily.income += amount;
      totalIncome += amount;
    }
  });

  // Prepare line chart data with cumulative option
  const lineChartData = Array.from(expensesByDay.entries())
    .map(([date, values]) => ({
      date,
      Expenses: values.expenses,
      Income: values.income,
      Net: values.income - values.expenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate cumulative values if needed
  if (preferences.chartView === "cumulative") {
    let cumulativeExpenses = 0;
    let cumulativeIncome = 0;
    lineChartData.forEach((day) => {
      cumulativeExpenses += day.Expenses;
      cumulativeIncome += day.Income;
      day.Expenses = cumulativeExpenses;
      day.Income = cumulativeIncome;
      day.Net = cumulativeIncome - cumulativeExpenses;
    });
  }

  // Prepare pie chart data
  const pieChartData = Array.from(categoryTotals.entries())
    .map(([category, total]) => ({
      category,
      value: total,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 space-y-6">
      {/* Time Period Filter */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financial Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time Period:</span>
          <Select
            value={preferences.timePeriod}
            onValueChange={(value: TimePeriod) =>
              setPreferences({ ...preferences, timePeriod: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_PERIODS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {TIME_PERIODS[preferences.timePeriod as TimePeriod].label}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {TIME_PERIODS[preferences.timePeriod as TimePeriod].label}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(totalIncome - totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {TIME_PERIODS[preferences.timePeriod as TimePeriod].label}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Spending Overview</CardTitle>
              <CardDescription>
                Your income and expenses over time
              </CardDescription>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">View Type</span>
                <RadioGroup
                  value={preferences.chartView}
                  onValueChange={(value: "individual" | "cumulative") =>
                    setPreferences({ ...preferences, chartView: value })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cumulative" id="cumulative" />
                    <Label htmlFor="cumulative">Cumulative</Label>
                  </div>
                </RadioGroup>
              </div>
              {preferences.chartView === "cumulative" && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Line View</span>
                  <RadioGroup
                    value={preferences.lineView}
                    onValueChange={(value: "separate" | "combined") =>
                      setPreferences({ ...preferences, lineView: value })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="separate" id="separate" />
                      <Label htmlFor="separate">Separate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="combined" id="combined" />
                      <Label htmlFor="combined">Combined</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    formatCurrency(value).replace(".00", "")
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }
                />
                <Legend />
                {preferences.lineView === "combined" &&
                preferences.chartView === "cumulative" ? (
                  <Line
                    type="monotone"
                    dataKey="Net"
                    name="Net Balance"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="Income"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Distribution of your expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label={({ category, percent }) =>
                      `${category} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CATEGORY_COLORS[entry.category]?.chart ||
                          CATEGORY_COLORS.Other.chart
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biggest Expense</CardTitle>
            <CardDescription>Your largest transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(biggestExpense.amount)}
                </div>
                <div className="text-sm font-medium">
                  {biggestExpense.title}
                </div>
              </div>
              <Separator />
              <div className="pt-2">
                <span
                  className={`inline-flex items-center ${
                    CATEGORY_COLORS[biggestExpense.category]?.bg ||
                    "bg-gray-100"
                  } ${
                    CATEGORY_COLORS[biggestExpense.category]?.text ||
                    "text-gray-800"
                  } px-2 py-1 rounded-full text-sm`}
                >
                  {biggestExpense.category}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
