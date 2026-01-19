'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Copy, ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SchoolLinkSection({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  // Получаем домен сайта только на клиенте
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullUrl = `${origin}/s/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full space-y-2">
            <Label className="text-slate-600 font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Публичная ссылка для родителей
            </Label>
            <div className="flex gap-2">
              <Input 
                value={fullUrl} 
                readOnly 
                className="bg-white font-mono text-slate-600"
              />
              <Button 
                onClick={handleCopy} 
                className={copied ? "bg-slate-900 hover:bg-slate-800" : ""}
                variant="default"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <a href={fullUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Открыть
              </Button>
            </a>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Отправьте эту ссылку родителям в чат класса. По ней они смогут выбрать фото и сделать заказ.
        </p>
      </CardContent>
    </Card>
  );
}