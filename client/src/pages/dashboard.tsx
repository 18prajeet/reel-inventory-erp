import { useReels, useDeleteReel } from "@/hooks/use-reels";
import { LayoutShell } from "@/components/layout-shell";
import { AddReelDialog } from "@/components/add-reel-dialog";
import { EditReelDialog } from "@/components/edit-reel-dialog";
import {useEffect} from "react";
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
  Edit2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Reel } from "@shared/schema";

export default function Dashboard() {
  const { data: reels, isLoading } = useReels();
  const [search, setSearch] = useState("");
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { mutate: deleteReel, isPending: isDeleting } = useDeleteReel();
  const { toast } = useToast();

  const handleEditReel = (reel: Reel) => {
    setEditingReel(reel);
    setEditDialogOpen(true);
  };

  useEffect(() => {
  if (!editingReel || !reels) return;

  const updated = reels.find(r => r.id === editingReel.id);
  if (updated) {
    setEditingReel(updated);
  }
}, [reels]);


  /* 🔒 ERP-GRADE DELETE CONFIRMATION (UI PATCH ONLY) */
  const handleDeleteReel = (reel: Reel) => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      `Confirm Reel Deletion\n\n` +
        `Reel ID   : ${reel.reelId}\n` +
        `Reel Code : ${reel.code}\n` +
        `GSM       : ${reel.gsm}\n\n` +
        `⚠️ This action cannot be undone.\n` +
        `Deletion is BLOCKED if transactions exist.`
    );

    if (!confirmed) return;

    deleteReel(reel.id, {
      onSuccess: () =>
        toast({
          title: "Reel Deleted",
          description: `Successfully deleted reel ${reel.reelId}`,
        }),
      onError: (error) =>
        toast({
          title: "Cannot delete reel",
          description:
            error.message ||
            "This reel has transactions. Delete transactions first.",
          variant: "destructive",
        }),
    });
  };

  /* ---------------- FILTER ---------------- */
  const filteredReels =
    reels?.filter((reel) => {
      const q = search.toLowerCase();
      return (
        reel.code.toLowerCase().includes(q) ||
        reel.reelId?.toLowerCase().includes(q) ||
        reel.shade.toLowerCase().includes(q) ||
        reel.supplier?.toLowerCase().includes(q)
      );
    }) ?? [];

  /* ---------------- GROUP BY GSM ---------------- */
  const gsmMap = filteredReels.reduce<Record<number, Reel[]>>((acc, reel) => {
    acc[reel.gsm] = acc[reel.gsm] || [];
    acc[reel.gsm].push(reel);
    return acc;
  }, {});

  const groupedGsm = Object.entries(gsmMap)
    .filter(([, list]) => list.length > 1)
    .sort(([a], [b]) => Number(a) - Number(b));

  const ungroupedReels = Object.values(gsmMap)
    .filter((list) => list.length === 1)
    .flat();

  const lowStockCount =
    reels?.filter((r) => r.currentStock < 50).length || 0;
  const totalStock =
    reels?.reduce((acc, curr) => acc + curr.currentStock, 0) || 0;

  return (
    <LayoutShell>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your inventory status.
          </p>
        </div>
        <AddReelDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardDescription>Total Stock (KG)</CardDescription>
            <CardTitle className="font-mono">
              {totalStock.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <Package className="inline w-4 h-4 mr-1" />
            Across {reels?.length || 0} reel types
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="text-red-600 font-mono">
              {lowStockCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <AlertTriangle className="inline w-4 h-4 mr-1 text-red-500" />
            Items below threshold
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Active Items</CardDescription>
            <CardTitle className="font-mono">
              {reels?.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <TrendingUp className="inline w-4 h-4 mr-1" />
            Inventory Types
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="mt-6">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reel Inventory</CardTitle>
              <CardDescription>
                Manage reel specifications and stock.
              </CardDescription>
            </div>
            <Input
              placeholder="Search by Reel ID"
              className="w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="table-header-dense pl-6">Reel ID</th>
                <th className="table-header-dense">Reel Code</th>
                <th className="table-header-dense">Size (cm)</th>
                <th className="table-header-dense">GSM</th>
                <th className="table-header-dense">Shade</th>
                <th className="table-header-dense">Supplier</th>
                <th className="table-header-dense">BF</th>
                <th className="table-header-dense">Weight (KG)</th>
                <th className="table-header-dense text-right">
                  Current Stock (KG)
                </th>
                <th className="table-header-dense text-right">
                   Bit Reel (KG)
                </th>
                <th className="table-header-dense text-center pr-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Loading inventory data...
                  </td>
                </tr>
              ) : (
                <>
                  {groupedGsm.map(([gsm]) => (
                    <tr key={gsm} className="bg-slate-50">
                      <td colSpan={11} className="px-6 py-3 text-center font-semibold text-slate-600">
                        <Link
                          href={`/reels/gsm/${gsm}`}
                          className="hover:underline text-slate-700"
                        >
                          GSM ({gsm})
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {ungroupedReels.map((reel) => (
                    <tr key={reel.id} className="hover:bg-slate-50">
                      <td className="table-cell-dense pl-6 font-mono font-semibold">
                        {reel.reelId}
                      </td>
                      <td className="table-cell-dense font-medium">
                        {reel.code}
                      </td>
                      <td className="table-cell-dense">{reel.size}</td>
                      <td className="table-cell-dense">{reel.gsm}</td>
                      <td className="table-cell-dense">
                        <Badge variant="secondary">{reel.shade}</Badge>
                      </td>
                      <td className="table-cell-dense">
                        {reel.supplier ?? "-"}
                      </td>
                      <td className="table-cell-dense">{reel.bf ?? "-"}</td>
                      <td className="px-6 py-3 text-right font-mono">
                       {reel.weightKg.toFixed(2)}
                      </td>

                      <td className="table-cell-dense text-right font-mono">
                        {reel.currentStock.toFixed(2)}
                      </td>
                      <td className="table-cell-dense text-right font-mono text-amber-700">
                          {reel.bitReelKg?.toFixed(2) ?? "0.00"}
                      </td>

                      <td className="table-cell-dense text-center pr-6">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/reels/${reel.id}`}>
                            <Button size="sm" variant="ghost">
                              <ArrowRight size={16} />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditReel(reel)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isDeleting}
                            onClick={() => handleDeleteReel(reel)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editingReel && (
        <EditReelDialog
          reel={editingReel}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </LayoutShell>
  );
}
