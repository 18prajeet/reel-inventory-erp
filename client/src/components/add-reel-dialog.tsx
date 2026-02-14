import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReelSchema } from "@shared/schema";
import { useCreateReel } from "@/hooks/use-reels";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertReelSchema.extend({
  size: z.coerce.number().min(1, "Size is required"),
  gsm: z.coerce.number().min(1, "GSM is required"),
  shade: z.string().min(1, "Shade is required"),
  weightKg: z.coerce.number().min(0.01, "Weight is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddReelDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateReel();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      size: undefined,
      gsm: undefined,
      shade: "",
      bf: undefined,
      supplier: "",
      reelId: "",
      weightKg: undefined,

    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({
          title: "Reel Created",
          description: "New reel specification has been added to inventory.",
        });
      },
     onError: (error: any) => {
  toast({
    title: "Cannot create reel",
    description: error?.message || "Failed to create reel",
    variant: "destructive",
      });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Reel Type
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Reel Specification</DialogTitle>
          <DialogDescription>
            Create a new reel type. This defines the Size, GSM, and Shade combination.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size (cm)</Label>
              <Input id="size" type="number" {...form.register("size")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gsm">GSM</Label>
              <Input id="gsm" type="number" {...form.register("gsm")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shade">Shade</Label>
            <Input id="shade" {...form.register("shade")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bf">BF</Label>
            <Input id="bf" type="number" {...form.register("bf", { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input id="supplier" {...form.register("supplier")} />
          </div>

          <div className="space-y-2">
          <Label htmlFor="weightKg">Weight (KG)</Label>
           <Input
               id="weightKg"
               type="number"
                step="0.01"
               {...form.register("weightKg")}
             />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reelId">Reel ID</Label>
            <Input id="reelId" {...form.register("reelId")} />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Reel Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
