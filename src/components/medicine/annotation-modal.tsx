"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Check, Eraser, PenTool, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { ScanRecord } from "@/lib/types";

interface AnnotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scan?: ScanRecord;
}

/**
 * Interactive Annotation & Clinical Notes Modal.
 * Enables adding personal dosage instructions, doctor notes, and visual canvas highlights over report photos.
 */
export function AnnotationModal({
  open,
  onOpenChange,
  scan,
}: AnnotationModalProps) {
  const [noteText, setNoteText] = React.useState(scan?.notes || "");
  const [tagInput, setTagInput] = React.useState("");

  React.useEffect(() => {
    if (scan) {
      setNoteText(scan.notes || "");
    }
  }, [scan]);

  if (!scan) return null;

  function handleSave() {
    const scans = useAppStore.getState().scans.map((s) =>
      s.id === scan?.id ? { ...s, notes: noteText } : s
    );
    useAppStore.setState({ scans });
    toast.success("Notes & Annotations Saved!");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Edit3 className="h-5 w-5 text-primary" />
            Personal Notes & Annotations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Medication details summary */}
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-foreground">{scan.medicine.brandName}</p>
              <p className="text-xs text-muted-foreground">{scan.medicine.genericName} · {scan.medicine.strengthDisplay}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase">
              {scan.source}
            </span>
          </div>

          {/* Personal Note Field */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Personal Dosage / Doctor Instructions Notes:
            </label>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g., Take 1 capsule after breakfast with water. Prescribed by Dr. Adams."
              className="min-h-[120px] rounded-2xl border-border text-xs leading-relaxed focus:border-primary"
            />
          </div>

          {/* Quick Annotation Helper Chips */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Quick Note Inserts:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Take after food",
                "Take before sleep",
                "1 pill twice daily",
                "Keep refrigerated",
                "Doctor followup scheduled",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setNoteText((prev) => (prev ? `${prev} · ${chip}` : chip))
                  }
                  className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-primary hover:text-primary transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl h-10 text-xs font-bold shadow-soft">
              <Check className="mr-1.5 h-3.5 w-3.5" /> Save Annotations
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
