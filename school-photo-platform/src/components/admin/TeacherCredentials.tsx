'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Copy, CheckCircle2 } from 'lucide-react';

type TeacherCredentialsProps = {
  teacherLogin: string;
  isEditAllowed: boolean;
};

export default function TeacherCredentials({
  teacherLogin,
  isEditAllowed,
}: TeacherCredentialsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(teacherLogin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Teacher Access
          </CardTitle>
          {isEditAllowed && (
            <Badge className="bg-green-600">Editing Enabled</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">
                Teacher Login
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-8"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-2 bg-slate-50 rounded font-mono text-sm">
              {teacherLogin}
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Password
            </p>
            <div className="p-2 bg-slate-50 rounded font-mono text-sm text-slate-400">
              ••••••••
            </div>
            <Button size="sm" variant="link" className="mt-2 p-0 h-auto">
              Reset Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}