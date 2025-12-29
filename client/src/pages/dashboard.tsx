import { useReels, useDeleteReel } from "@/hooks/use-reels";
import { useUser } from "@/hooks/use-auth";
import { LayoutShell } from "@/components/layout-shell";
import { AddReelDialog } from "@/components/add-reel-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowRight,
  Package,
  AlertTriangle,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: reels, isLoading } = useReels();
  const [search, setSearch] = useState("");
  const { mutate: deleteReel, isPending: isDeleting } = useDeleteReel();
  const { toast } = useToast();

  const handleDeleteReel = (reelId: number, reelCode: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete reel ${reelCode}?\n\nThis action cannot be undone. The reel must have no transactions to be deleted.`
    );
    if (!confirmed) return;

    deleteReel(reelId, {
      onSuccess: () => {
        toast({
          title: "Reel Deleted",
          description: `Successfully deleted reel ${reelCode}`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete reel",
          variant: "destructive",
        });
      },
    });
  };

  const filteredReels = reels?.filter(
    (reel) =>
      reel.code.toLowerCase().includes(search.toLowerCase()) ||
      reel.shade.toLowerCase().includes(search.toLowerCase()),
  );

  const lowStockCount = reels?.filter((r) => r.currentStock < 50).length || 0;
  const totalStock =
    reels?.reduce((acc, curr) => acc + curr.currentStock, 0) || 0;

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Overview of your inventory status.
          </p>
        </div>
        <AddReelDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Total Stock (KG)</CardDescription>
            <CardTitle className="text-2xl font-mono text-slate-900">
              {totalStock.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <Package className="w-4 h-4 mr-1 text-slate-600" /> Across{" "}
              {reels?.length || 0} reel types
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="text-2xl font-mono text-red-600">
              {lowStockCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertTriangle className="w-4 h-4 mr-1 text-red-500" /> Items
              below threshold
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Active Items</CardDescription>
            <CardTitle className="text-2xl font-mono text-slate-900">
              {reels?.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-4 h-4 mr-1 text-slate-600" /> Inventory
              Types
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-md border-slate-200">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Reel Inventory</CardTitle>
              <CardDescription>
                Manage your reel specifications and stock levels.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by code or shade..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-header-dense pl-6">Reel Code</th>
                <th className="table-header-dense">Size (inch)</th>
                <th className="table-header-dense">GSM</th>
                <th className="table-header-dense">Shade</th>
                <th className="table-header-dense text-right">
                  Current Stock (KG)
                </th>
                <th className="table-header-dense text-center pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Loading inventory data...
                  </td>
                </tr>
              ) : filteredReels?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No reels found matching your search.
                  </td>
                </tr>
              ) : (
                filteredReels?.map((reel) => (
                  <tr
                    key={reel.id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="table-cell-dense pl-6 font-medium text-slate-900">
                      {reel.code}
                    </td>
                    <td className="table-cell-dense">{reel.size}</td>
                    <td className="table-cell-dense">{reel.gsm}</td>
                    <td className="table-cell-dense">
                      <Badge
                        variant="secondary"
                        className="font-normal bg-slate-100 text-slate-700"
                      >
                        {reel.shade}
                      </Badge>
                    </td>
                    <td
                      className={`table-cell-dense text-right font-mono font-medium ${reel.currentStock < 50 ? "text-red-600" : "text-slate-700"}`}
                    >
                      {reel.currentStock.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="table-cell-dense text-center pr-6">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/reels/${reel.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteReel(reel.id, reel.code)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </LayoutShell>
  );
}
