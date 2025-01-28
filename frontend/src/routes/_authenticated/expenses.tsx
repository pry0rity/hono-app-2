import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableFooter,
  TableRow,
} from "@/components/ui/table";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Food & Dining": { bg: "bg-orange-100", text: "text-orange-800" },
  Transportation: { bg: "bg-blue-100", text: "text-blue-800" },
  Shopping: { bg: "bg-pink-100", text: "text-pink-800" },
  "Bills & Utilities": { bg: "bg-yellow-100", text: "text-yellow-800" },
  Entertainment: { bg: "bg-purple-100", text: "text-purple-800" },
  "Health & Fitness": { bg: "bg-green-100", text: "text-green-800" },
  Travel: { bg: "bg-indigo-100", text: "text-indigo-800" },
  Home: { bg: "bg-red-100", text: "text-red-800" },
  Education: { bg: "bg-cyan-100", text: "text-cyan-800" },
  Other: { bg: "bg-gray-100", text: "text-gray-800" },
};

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const Route = createFileRoute("/_authenticated/expenses")({
  component: GetAllExpenses,
});

async function fetchExpenses(
  page: number,
  limit: number,
  year: string,
  month: string,
  category: string
) {
  const query: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-31`,
  };

  if (category !== "all") {
    query.category = category;
  }

  const res = await api.v1.expenses.$get({ query });
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  throw new Error("Failed to fetch expenses");
}

async function fetchCategories() {
  const res = await api.v1.expenses.categories.$get();
  if (res.ok) {
    const data = await res.json();
    return data.categories;
  }
  throw new Error("Failed to fetch categories");
}

function GetAllExpenses() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(
    (new Date().getMonth() + 1).toString().padStart(2, "0")
  );
  const [category, setCategory] = useState("all");

  const { isPending, error, data } = useQuery({
    queryKey: ["get-all-expenses", page, limit, year, month, category],
    queryFn: () => fetchExpenses(page, limit, year, month, category),
  });

  const { data: categories } = useQuery({
    queryKey: ["get-categories"],
    queryFn: fetchCategories,
  });

  if (error) return `Error: ${error.message}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Year</span>
          <Select
            value={year}
            onValueChange={(value) => {
              setYear(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">Month</span>
          <Select
            value={month}
            onValueChange={(value) => {
              setMonth(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={(i + 1).toString().padStart(2, "0")}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">Category</span>
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.category} value={cat.category}>
                  {cat.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">Show</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">per page</span>
        </div>
      </div>

      <Table>
        <TableCaption>
          {data?.pagination && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, data.pagination.total)} of{" "}
                {data.pagination.total} entries
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  disabled={
                    !data.pagination.pages || page >= data.pagination.pages
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending
            ? Array(limit)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                  </TableRow>
                ))
            : data.expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className={expense.type === "income" ? "text-green-600" : ""}
                >
                  <TableCell>{expense.title}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        CATEGORY_COLORS[expense.category]?.bg || "bg-gray-100"
                      } ${
                        expense.type === "income"
                          ? "text-green-800 bg-green-100"
                          : CATEGORY_COLORS[expense.category]?.text ||
                            "text-gray-800"
                      }`}
                    >
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    {expense.date
                      ? new Date(expense.date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {expense.date
                      ? new Date(expense.date).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right ${expense.type === "income" ? "text-green-600 font-medium" : "text-red-600"}`}
                  >
                    {expense.type === "income" ? "+" : "-"}$
                    {formatAmount(Number(expense.amount))}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Income</TableCell>
            <TableCell className="text-right font-medium text-green-600">
              +$
              {formatAmount(
                data?.expenses
                  .filter((e) => e.type === "income")
                  .reduce((acc, expense) => acc + Number(expense.amount), 0) ??
                  0
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={4}>Expenses</TableCell>
            <TableCell className="text-right font-medium text-red-600">
              -$
              {formatAmount(
                data?.expenses
                  .filter((e) => e.type === "expense")
                  .reduce((acc, expense) => acc + Number(expense.amount), 0) ??
                  0
              )}
            </TableCell>
          </TableRow>
          <TableRow className="border-t-2">
            <TableCell colSpan={4} className="font-medium">
              Net Total
            </TableCell>
            <TableCell className="text-right font-medium">
              {(() => {
                const total =
                  data?.expenses.reduce((acc, expense) => {
                    const amount = Number(expense.amount);
                    return expense.type === "income"
                      ? acc + amount
                      : acc - amount;
                  }, 0) ?? 0;
                const formattedTotal = formatAmount(Math.abs(total));
                return total >= 0 ? (
                  <span className="text-green-600">+${formattedTotal}</span>
                ) : (
                  <span className="text-red-600">-${formattedTotal}</span>
                );
              })()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
