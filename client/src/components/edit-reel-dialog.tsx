import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { useUpdateReel } from "@/hooks/use-reels";
import { useToast } from "@/hooks/use-toast";
import { Reel } from "@shared/schema";
import { useEffect } from "react";

/* ---------------- SCHEMA ---------------- */

const formSchema = api.reels.update.input.extend({
  size: z.coerce.number().int().positive("Size must be a positive number"),
  gsm: z.coerce.number().int().positive("GSM must be a positive number"),
  // weightKg: z.coerce.number().min(0.01, "Weight must be greater than zero"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditReelDialogProps {
  reel: Reel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ---------------- COMPONENT ---------------- */

export function EditReelDialog({
  reel,
  open,
  onOpenChange,
}: EditReelDialogProps) {
  const { mutate, isPending } = useUpdateReel();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      size: 0,
      gsm: 0,
      shade: "",
      bf: undefined,
      supplier: "",
      weightKg: reel.weightKg,
    },
  });

  /* 🔑 THIS IS THE MOST IMPORTANT PART */
  useEffect(() => {
    if (!reel) return;

    form.reset({
      size: reel.size,
      gsm: reel.gsm,
      shade: reel.shade,
      bf: reel.bf ?? undefined,
      supplier: reel.supplier ?? "",
      weightKg: reel.weightKg ?? 0,
    });
  }, [reel, form]);

  const onSubmit = (data: FormValues) => {
    mutate(
      { id: reel.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast({
            title: "Reel Updated",
            description: "Reel specifications updated successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update reel",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Reel Specifications</DialogTitle>
          <DialogDescription>
            Update the specifications for reel <b>{reel.reelId}</b>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Size */}
          <div className="space-y-2">
            <Label>Size (cm)</Label>
            <Input type="number" {...form.register("size")} />
          </div>

          {/* GSM */}
          <div className="space-y-2">
            <Label>GSM</Label>
            <Input type="number" {...form.register("gsm")} />
          </div>

          {/* Shade */}
          <div className="space-y-2">
            <Label>Shade</Label>
            <Input {...form.register("shade")} />
          </div>

          {/* BF */}
          <div className="space-y-2">
            <Label>BF</Label>
            <Input type="number" {...form.register("bf", { valueAsNumber: true })} />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label>Weight (KG)</Label>
            <Input
              type="number"
              step="0.01"
              {...form.register("weightKg", { valueAsNumber: true })}
            />
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input {...form.register("supplier")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Reel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
