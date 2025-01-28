import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { HomeIcon, WalletCards, PlusCircle, UserCircle } from "lucide-react";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});

function NavBar() {
  return (
    <div className="border-b">
      <div className="max-w-7xl mx-auto">
        <NavigationMenu className="px-4">
          <NavigationMenuList className="flex items-center justify-between w-full h-16">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-xl font-bold text-foreground hover:text-foreground/80"
              >
                ExpenseTracker
              </Link>
              <div className="flex items-center gap-2">
                <NavLink to="/" icon={<HomeIcon className="w-4 h-4" />}>
                  Dashboard
                </NavLink>
                <NavLink
                  to="/expenses"
                  icon={<WalletCards className="w-4 h-4" />}
                >
                  Expenses
                </NavLink>
                <NavLink
                  to="/create-expense"
                  icon={<PlusCircle className="w-4 h-4" />}
                >
                  New Entry
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <NavLink to="/profile" icon={<UserCircle className="w-4 h-4" />}>
                Profile
              </NavLink>
            </div>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function NavLink({ to, children, icon }: NavLinkProps) {
  return (
    <NavigationMenuItem>
      <Link
        to={to}
        activeProps={{ className: "bg-accent text-accent-foreground" }}
        inactiveProps={{ className: "text-muted-foreground" }}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground focus:outline-none"
        )}
      >
        {icon}
        {children}
      </Link>
    </NavigationMenuItem>
  );
}

function Root() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="max-w-7xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
