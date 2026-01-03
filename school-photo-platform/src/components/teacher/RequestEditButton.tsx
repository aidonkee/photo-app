'use client';

import React, { useActionState, useState } from 'react';
import { createEditRequestAction } from '@/actions/teacher/edit-request-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileEdit, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RequestEditButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createEditRequestAction,
    null
  );

  React.useEffect(() => {
    if (state?. success) {
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    }
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileEdit className="w-4 h-4" />
          Request Photo Edits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request Photo Edits</DialogTitle>
          <DialogDescription>
            Describe the issue with the photos so the photographer can fix it
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="reason">What's the issue?  *</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Example: Photo #5 shows wrong student, should be John not Jane"
              required
              disabled={isPending}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              Be specific about which photos need correction (min.  10 characters)
            </p>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="bg-slate-50 border-slate-200">
              <CheckCircle2 className="h-4 w-4 text-slate-900" />
              <AlertDescription className="text-slate-700">
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}