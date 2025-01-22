import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";

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

export const Route = createFileRoute("/expenses")({
  component: GetAllExpenses,
});

async function fetchExpenses() {
  const res = await api.v1.expenses.$get();
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  throw new Error("Failed to fetch expenses");
}

async function fetchTotalSpent() {
  const res = await api.v1.expenses["total-spent"].$get();
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  throw new Error("Failed to fetch total spent");
}

function GetAllExpenses() {
  const { isPending, error, data } = useQuery({
    queryKey: ["get-all-expenses"],
    queryFn: () => fetchExpenses(),
  });

  const { data: totalData } = useQuery({
    queryKey: ["get-total-spent"],
    queryFn: () => fetchTotalSpent(),
  });

  if (error) return `Error: ${error.message}`;
  return (
    <div>
      <Table>
        <TableCaption>A list of your recent expenses.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending
            ? Array(3)
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
                  </TableRow>
                ))
            : data.expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.id}</TableCell>
                  <TableCell>{expense.title}</TableCell>
                  <TableCell className="text-right">
                    ${expense.amount}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">
              ${totalData?.total ?? 0}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
