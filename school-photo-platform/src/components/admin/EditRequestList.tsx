'use client';

import React, { useState, useTransition } from 'react';
import { resolveRequestAction } from '@/actions/admin/request-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

type EditRequest = {
  id: string;
  reason: string;
  status: string;
  createdAt: Date;
  classroom: {
    id: string;
    name: string;
    school: {
      id: string;
      name: string;
    };
  };
};

type EditRequestListProps = {
  requests: EditRequest[];
};

export default function EditRequestList({ requests }: EditRequestListProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResolve = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setMessage(null);
    
    startTransition(async () => {
      try {
        await resolveRequestAction(requestId, status, adminNote || undefined);
        setMessage({
          type: 'success',
          text: `Request ${status. toLowerCase()} successfully! `,
        });
        setSelectedRequest(null);
        setAdminNote('');
        
        // Reload page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error:  any) {
        setMessage({
          type: 'error',
          text: error.message || 'Failed to process request',
        });
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (requests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No pending requests
          </h3>
          <p className="text-slate-600">
            All edit requests have been processed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert
          variant={message.type === 'error' ? 'destructive' :  'default'}
          className={
            message.type === 'success'
              ? 'bg-slate-50 text-slate-900 border-slate-200'
              : ''
          }
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-slate-900" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {requests.map((request) => (
        <Card key={request. id} className="border-2 hover:border-slate-200 transition-all">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                <CardTitle className="text-lg">Edit Request</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {request.classroom.school.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {request.classroom. name}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Teacher's Reason: 
                  </p>
                  <p className="text-sm text-slate-600">{request.reason}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Dialog
                open={selectedRequest === request.id + '-approve'}
                onOpenChange={(open) =>
                  setSelectedRequest(open ? request.id + '-approve' : null)
                }
              >
                <DialogTrigger asChild>
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800"
                    disabled={isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Edit Request</DialogTitle>
                    <DialogDescription>
                      This will enable editing for {request.classroom.name} in{' '}
                      {request.classroom.school.name}. 
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="approve-note">
                        Admin Note (Optional)
                      </Label>
                      <Textarea
                        id="approve-note"
                        placeholder="Add a note for your records..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e. target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(null);
                          setAdminNote('');
                        }}
                        className="flex-1"
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleResolve(request.id, 'APPROVED')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                        disabled={isPending}
                      >
                        {isPending ? 'Processing...' : 'Confirm Approval'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={selectedRequest === request.id + '-reject'}
                onOpenChange={(open) =>
                  setSelectedRequest(open ?  request.id + '-reject' :  null)
                }
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Edit Request</DialogTitle>
                    <DialogDescription>
                      This request from {request.classroom.name} will be
                      rejected. 
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reject-note">
                        Rejection Reason (Optional)
                      </Label>
                      <Textarea
                        id="reject-note"
                        placeholder="Explain why this request is being rejected..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(null);
                          setAdminNote('');
                        }}
                        className="flex-1"
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleResolve(request.id, 'REJECTED')}
                        variant="destructive"
                        className="flex-1"
                        disabled={isPending}
                      >
                        {isPending ?  'Processing...' : 'Confirm Rejection'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}