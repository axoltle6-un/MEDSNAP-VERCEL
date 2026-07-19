"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

const FIELD_LABELS: Record<string, string> = {
  brandName: "Brand name",
  genericName: "Generic name",
  strengthValue: "Strength",
  form: "Form",
  usedFor: "Used for",
  commonSideEffects: "Common side effects",
  seriousSideEffects: "Serious side effects",
  interactions: "Interactions",
  whoShouldAvoid: "Who should avoid",
  storageInstructions: "Storage instructions",
};

export function ReportDialog({
  open,
  onOpenChange,
  scanId,
  fields,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scanId: string;
  fields: string[];
}) {
  const submitReport = useAppStore((s) => s.submitReport);
  const [field, setField] = React.useState<string>(fields[0] ?? "other");
  const [issue, setIssue] = React.useState("");

  function submit() {
    submitReport({
      scanId,
      field,
      issue: issue.trim(),
      createdAt: Date.now(),
    });
    setIssue("");
    onOpenChange(false);
    toast.success("Thanks — your report was recorded and will be reviewed.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Report incorrect info</DialogTitle>
          <DialogDescription>
            Spotted something wrong? Tell us which field and what's incorrect. Our team
            reviews every report to keep MedSnap accurate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-field">Which field is wrong?</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger id="report-field" className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FIELD_LABELS[f] ?? f}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-issue">What's incorrect?</Label>
            <Textarea
              id="report-issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g. The strength should be 250 mg, not 500 mg."
              rows={4}
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!issue.trim()} className="rounded-xl">
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
