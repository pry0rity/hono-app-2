import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/api";
import { type CreateExpense, createExpenseSchema } from "@server/sharedTypes";
import { useQuery } from "@tanstack/react-query";
import type { CategoryResponse, Category } from "@/lib/types";

type ExpenseType = "expense" | "income";
type ExpenseStatus = "cleared" | "pending" | "reconciled";

async function fetchCategories(): Promise<CategoryResponse> {
  const res = await api.v1.expenses.categories.$get();
  if (res.ok) {
    const data = await res.json();
    return {
      categories: data.categories.map(
        (category: {
          type: string;
          id: number;
          name: string;
          icon: string | null;
          color: string | null;
          description: string | null;
          createdAt: string | null;
          updatedAt: string | null;
        }) => ({
          ...category,
          type: category.type as ExpenseType,
        })
      ) as Category[],
    };
  }
  throw new Error("Failed to fetch categories");
}

export const Route = createFileRoute("/_authenticated/create-expense")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: categoriesData } = useQuery({
    queryKey: ["get-categories"],
    queryFn: fetchCategories,
  });

  const formatAmount = (amount: string) => {
    const num = Number(amount);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const form = useForm<CreateExpense>({
    validators: {
      onChange: createExpenseSchema,
    },
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      type: "expense",
      date: new Date().toISOString(),
      categoryId: 1,
      notes: "",
      status: "cleared",
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await api.v1.expenses.$post({
          json: {
            ...value,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to create expense");
        }

        navigate({ to: "/expenses" });
      } catch (error) {
        console.error("Failed to create expense:", error);
        throw error;
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Transaction</h1>
        <p className="text-gray-500">Add a new expense or income entry</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <form.Field
              name="title"
              validators={{
                onChange: (value) => (!value ? "Title is required" : undefined),
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Title</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    placeholder="Enter title"
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="amount"
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Amount</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={(e) =>
                      field.handleChange(formatAmount(e.target.value))
                    }
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="type"
              validators={{
                onChange: (value) => (!value ? "Type is required" : undefined),
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Type</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: ExpenseType) =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="categoryId"
              validators={{
                onChange: (value) =>
                  !value ? "Category is required" : undefined,
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Category</Label>
                  <Select
                    value={field.state.value?.toString()}
                    onValueChange={(value: string) =>
                      field.handleChange(Number(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData?.categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          <span className="flex items-center gap-1">
                            <span>{category.icon || "📝"}</span>
                            <span>{category.name || "Uncategorized"}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="date"
              validators={{
                onChange: (value) => (!value ? "Date is required" : undefined),
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Date</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={
                      field.state.value
                        ? new Date(field.state.value).toISOString().slice(0, 16)
                        : ""
                    }
                    type="datetime-local"
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      field.handleChange(date.toISOString());
                    }}
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <form.Field
              name="status"
              validators={{
                onChange: (value) =>
                  !value ? "Status is required" : undefined,
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: ExpenseStatus) =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reconciled">Reconciled</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <form.Field
            name="description"
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Description</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  placeholder="Enter a description (optional)"
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <form.Field
            name="notes"
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Notes</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  placeholder="Add any additional notes (optional)"
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
        </div>

        <form.Subscribe
          selector={(state) => [
            state.values.title,
            state.values.amount,
            state.values.type,
            state.values.categoryId,
            state.values.date,
          ]}
        >
          {([title, amount, type, categoryId, date]) => {
            const category = categoriesData?.categories.find(
              (c) => c.id === categoryId
            );
            const dateObj = new Date(date);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div className="rounded-lg border">
                <div className="p-4 bg-muted/50">
                  <h2 className="font-medium">Preview</h2>
                  <p className="text-sm text-muted-foreground">
                    Here's how your transaction will appear in the list
                  </p>
                </div>
                <Table>
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
                    <TableRow
                      className={type === "income" ? "text-green-600" : ""}
                    >
                      <TableCell>{String(title) || "(Title)"}</TableCell>
                      <TableCell>
                        {type === "income" ? (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-sm bg-green-100 text-green-800">
                            Income
                          </span>
                        ) : category ? (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-1 text-sm"
                            style={{
                              backgroundColor: `${category.color}15`,
                              color: category.color || "#71717A",
                            }}
                          >
                            <span className="flex items-center gap-1">
                              <span>{category.icon || "📝"}</span>
                              <span>{category.name || "Uncategorized"}</span>
                            </span>
                          </span>
                        ) : (
                          "(Category)"
                        )}
                      </TableCell>
                      <TableCell>{dateStr}</TableCell>
                      <TableCell>{timeStr}</TableCell>
                      <TableCell
                        className={`text-right ${
                          type === "income"
                            ? "text-green-600 font-medium"
                            : "text-red-600"
                        }`}
                      >
                        {type === "income" ? "+" : "-"}$
                        {typeof amount === "string"
                          ? formatAmount(amount)
                          : "0.00"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            );
          }}
        </form.Subscribe>
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: "/expenses" })}
          >
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button className="w-full" type="submit" disabled={!canSubmit}>
                {isSubmitting ? "Saving..." : "Save Transaction"}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  );
}
