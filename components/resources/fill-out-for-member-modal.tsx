// components/resources/fill-out-for-member-modal.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Users } from "lucide-react";
import { MemberMultiCombobox } from "@/components/shared/member-multi-combobox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface FillOutForMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceTitle: string;
  userRole: string;
}

export function FillOutForMemberModal({
  open,
  onOpenChange,
  resourceId,
  resourceTitle,
  userRole,
}: FillOutForMemberModalProps) {
  const router = useRouter();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const handleContinue = () => {
    if (selectedMemberIds.length === 0) return;
    const memberId = selectedMemberIds[0];
    router.push(
      `/${userRole.toLowerCase()}/resources/${resourceId}/complete?memberId=${memberId}`
    );
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedMemberIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
            Fill Out for Member
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Select a member to fill out &quot;{resourceTitle}&quot; on their
            behalf.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2.5">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Select Member
            </Label>
            <MemberMultiCombobox
              resourceId={resourceId}
              value={selectedMemberIds}
              onValueChange={setSelectedMemberIds}
              placeholder="Search and select a member..."
              maxSelections={1}
              showSelectedCount={false}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="min-h-[44px] flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedMemberIds.length === 0}
            className="min-h-[44px] flex-1 sm:flex-initial"
          >
            <FileText className="mr-2 h-4 w-4" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
