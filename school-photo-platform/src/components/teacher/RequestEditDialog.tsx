'use client';

import React, { useActionState, useEffect, useState } from 'react';
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
import { AlertCircle, CheckCircle2, FileEdit } from 'lucide-react';

type RequestEditDialogProps = {
  trigger?:  React.ReactNode;
  parentName?:  string;
  photoId?: string;
};

export default function RequestEditDialog({
  trigger,
  parentName,
  photoId,
}:  RequestEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createEditRequestAction,
    null
  );

  useEffect(() => {
    if (state?. success) {
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 2000);
    }
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
            <FileEdit className="w-4 h-4" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-amber-600" />
            Report Photo Issue
          </DialogTitle>
          <DialogDescription>
            Describe the problem with the photos so the photographer can fix it
            {parentName && (
              <span className="block mt-2 text-sm font-medium text-slate-700">
                Order from:  {parentName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="reason">What's the issue?  *</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Examples: 
• Photo #5 shows the wrong student (should be Emma, not Olivia)
• Student's name is misspelled on Photo #12
• Background is cropped incorrectly in Photo #8
• Missing photo for student John Smith"
              required
              disabled={isPending}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              Be specific about which photo(s) and what needs to be corrected (min.  10 characters)
            </p>
          </div>

          {photoId && (
            <input type="hidden" name="photoId" value={photoId} />
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              The photographer will review your request and make the necessary corrections.
              You'll be notified once it's resolved.
            </AlertDescription>
          </Alert>

          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
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
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}