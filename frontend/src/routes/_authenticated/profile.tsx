import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { userQueryOptions, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/solid";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Expense {
  id: number;
  type: "expense" | "income";
  categoryId: number;
  category: Category | null;
  date: string;
  title: string;
  amount: string;
}

interface ExpenseResponse {
  expenses: Array<{
    id: number;
    type: "expense" | "income";
    categoryId: number;
    category: {
      id: number;
      name: string;
      color: string | null;
      icon: string | null;
    } | null;
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

interface CategorySpending {
  [category: string]: number;
}

interface MonthlySpending {
  [month: number]: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

async function fetchProfileStats(): Promise<ExpenseResponse> {
  const res = await api.v1.expenses.$get({ query: { limit: "500" } });
  if (!res.ok) throw new Error("Failed to fetch expenses");
  const data = await res.json();
  return {
    expenses: data.expenses.map((expense: any) => ({
      ...expense,
      type: expense.type as "expense" | "income"
    })),
    pagination: data.pagination
  };
}

function Profile() {
  const {
    isPending: userLoading,
    error: userError,
    data: userData,
  } = useQuery(userQueryOptions);
  const {
    isPending: statsLoading,
    error: statsError,
    data: statsData,
  } = useQuery<ExpenseResponse>({
    queryKey: ["profile-stats"],
    queryFn: fetchProfileStats,
  });

  if (userLoading || statsLoading) return "Loading...";
  if (userError) return `Error: ${userError.message}`;
  if (statsError) return `Error: ${statsError.message}`;

  // Process stats data
  const expenses = statsData?.expenses || [];
  const totalSpent = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Get favorite categories
  const categorySpending = expenses
    .filter((e) => e.type === "expense")
    .reduce<CategorySpending>((acc, e) => {
      const categoryName = e.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(e.amount);
      return acc;
    }, {});

  const favoriteCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3) as [string, number][];

  // Calculate month over month trend
  const currentMonth = new Date().getMonth();
  const currentYearSpending = expenses
    .filter(
      (e) =>
        e.type === "expense" &&
        new Date(e.date).getFullYear() === new Date().getFullYear()
    )
    .reduce<MonthlySpending>((acc, e) => {
      const month = new Date(e.date).getMonth();
      acc[month] = (acc[month] || 0) + Number(e.amount);
      return acc;
    }, {});

  const thisMonth = currentYearSpending[currentMonth] || 0;
  const lastMonth = currentYearSpending[currentMonth - 1] || 0;
  const trend = thisMonth - lastMonth;
  const trendPercentage = lastMonth
    ? ((trend / lastMonth) * 100).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {userData.user.given_name}!
          </h1>
          <p className="text-muted-foreground">Here's your spending overview</p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/v1/logout">Logout</a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {trend > 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
              )}
              <p className="text-sm text-muted-foreground">
                {trendPercentage}% vs last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[100px]">
              <div className="space-y-2">
                {favoriteCategories.map(([category, amount], i) => (
                  <div
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <Badge variant={i === 0 ? "default" : "secondary"}>
                      {category}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Lifetime recorded expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{expense.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`font-medium ${expense.type === "expense" ? "text-red-500" : "text-green-500"}`}
                  >
                    {expense.type === "expense" ? "-" : "+"}
                    {formatCurrency(Number(expense.amount))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
