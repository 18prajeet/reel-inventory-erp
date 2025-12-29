import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertReel, type InsertTransaction } from "@shared/routes";
import { z } from "zod";

export function useReels() {
  return useQuery({
    queryKey: [api.reels.list.path],
    queryFn: async () => {
      const res = await fetch(api.reels.list.path);
      if (!res.ok) throw new Error("Failed to fetch reels");
      return api.reels.list.responses[200].parse(await res.json());
    },
  });
}

export function useReel(id: number) {
  return useQuery({
    queryKey: [api.reels.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.reels.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch reel details");
      return api.reels.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertReel) => {
      const validated = api.reels.create.input.parse(data);
      const res = await fetch(api.reels.create.path, {
        method: api.reels.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 409) throw new Error("A reel with this size, GSM, and shade already exists.");
        if (res.status === 400) throw new Error("Invalid input data.");
        throw new Error("Failed to create reel");
      }
      return api.reels.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reels.list.path] });
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const validated = api.transactions.create.input.parse(data);
      const res = await fetch(api.transactions.create.path, {
        method: api.transactions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) throw new Error("Invalid transaction data.");
        throw new Error("Failed to record transaction");
      }
      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reels.get.path, variables.reelId] });
      queryClient.invalidateQueries({ queryKey: [api.reels.list.path] });
    },
  });
}
