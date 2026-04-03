"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { featureGates } from "@/lib/featureFlags";
import { trackEvent } from "@/lib/analytics";
import type { FeatureGateId } from "@/lib/types";

export function PremiumGate({
  feature,
  triggerLabel,
}: {
  feature: FeatureGateId;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const gate = featureGates[feature];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => trackEvent("premium_cta_clicked", { feature, source: "trigger" })}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{gate.title}</DialogTitle>
          <DialogDescription>{gate.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Premium is designed for heavier research workflows: longer history, richer exports,
            saved dashboards, and an ad-free workspace.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => trackEvent("premium_cta_clicked", { feature, source: "modal-upgrade" })}
            >
              See pricing
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
