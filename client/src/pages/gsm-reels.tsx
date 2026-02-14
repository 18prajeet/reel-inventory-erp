import { useReels, useDeleteReel } from "@/hooks/use-reels";
import { LayoutShell } from "@/components/layout-shell";
import { useRoute, Link } from "wouter";
import { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { EditReelDialog } from "@/components/edit-reel-dialog";
import { Reel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function GsmReelsPage() {
  const [, params] = useRoute("/reels/gsm/:gsm");
  const gsm = Number(params?.gsm);

  const { data: reels, isLoading } = useReels();
  const { mutate: deleteReel, isPending: isDeleting } = useDeleteReel();
  const { toast } = useToast();

  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [search, setSearch] = useState("");

  const gsmReels = reels?.filter((r) => r.gsm === gsm) ?? [];

  const filteredReels = gsmReels.filter((reel) => {
    const q = search.toLowerCase();
    return (
      reel.reelId?.toLowerCase().includes(q) ||
      reel.code.toLowerCase().includes(q) ||
      reel.shade.toLowerCase().includes(q) ||
      reel.supplier?.toLowerCase().includes(q)
    );
  });

  /* 🔒 ERP-GRADE DELETE CONFIRMATION (UI PATCH ONLY) */
  const handleDelete = (reel: Reel) => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      `Confirm Reel Deletion\n\n` +
        `Reel ID: ${reel.reelId}\n` +
        `Reel Code: ${reel.code}\n` +
        `GSM: ${reel.gsm}\n\n` +
        `⚠️ This action cannot be undone.\n` +
        `Deletion is BLOCKED if transactions exist.`
    );

    if (!confirmed) return;

    deleteReel(reel.id, {
      onSuccess: () =>
        toast({
          title: "Reel Deleted",
          description: `${reel.reelId} removed successfully`,
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

   useEffect(() => {
       if (!editingReel || !reels) return;
        const updated = reels.find(r => r.id === editingReel.id);
           if (updated) {
              setEditingReel(updated);
          }
      }, [reels]);

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {gsm} GSM Reels
              </h1>
              <p className="text-muted-foreground">
                All reels grouped under {gsm} GSM
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by Reel ID"
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle>
              {filteredReels.length} reel
              {filteredReels.length !== 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              Detailed list of reels with GSM {gsm}
            </CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-header-dense pl-6">Reel ID</th>
                  <th className="table-header-dense">Reel Code</th>
                  <th className="table-header-dense">Size (cm)</th>
                  <th className="table-header-dense">Shade</th>
                  <th className="table-header-dense">Supplier</th>
                  <th className="table-header-dense">BF</th>
                  <th className="table-header-dense"> WEIGHT(KG)</th>

                  <th className="table-header-dense text-right">CURRENT STOCK(KG)</th>
                  <th className="table-header-dense text-right"> Bit Reel (KG)</th>

                  <th className="table-header-dense text-center pr-6">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="h-32 text-center text-muted-foreground">
                      Loading reels...
                    </td>
                  </tr>
                ) : filteredReels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="h-32 text-center text-muted-foreground">
                      No reels for this GSM
                    </td>
                  </tr>
                ) : (
                  filteredReels.map((reel) => (
                    <tr key={reel.id} className="hover:bg-slate-50">
                      <td className="table-cell-dense pl-6 font-mono font-semibold">
                        {reel.reelId}
                      </td>
                      <td className="table-cell-dense">{reel.code}</td>
                      <td className="table-cell-dense">{reel.size}</td>
                      <td className="table-cell-dense">{reel.shade}</td>
                      <td className="table-cell-dense">
                        {reel.supplier ?? "-"}
                      </td>
                      <td className="table-cell-dense">{reel.bf ?? "-"}</td>
                       <td className="px-6 py-3 text-right font-mono">
                          {reel.weightKg?.toFixed(2) ?? "0.00"}
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
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingReel(reel);
                              setEditOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(reel)}
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

        {editingReel && (
          <EditReelDialog
            reel={editingReel}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
        )}
      </div>
    </LayoutShell>
  );
}
