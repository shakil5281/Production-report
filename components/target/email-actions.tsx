'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconMail, IconSend, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ComprehensiveTargetData, SummaryData } from './types';

interface EmailActionsProps {
  date: Date;
  reportData: ComprehensiveTargetData[];
  summary: SummaryData | null;
  timeSlotHeaders: string[];
  timeSlotTotals: Record<string, number>;
}

interface EmailFormData {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  message: string;
}

export function EmailActions({ 
  date, 
  reportData, 
  summary, 
  timeSlotHeaders, 
  timeSlotTotals 
}: EmailActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string>('');
  
  const [formData, setFormData] = useState<EmailFormData>({
    to: process.env.NEXT_PUBLIC_DEFAULT_EMAIL_TO || 'recipient@example.com',
    cc: '',
    bcc: '',
    subject: `Comprehensive Target Report - ${date.toLocaleDateString()}`,
    message: `Please find attached the comprehensive target report for ${date.toLocaleDateString()}.

This report includes:
• Target details by line and style
• Hourly production tracking
• Summary statistics
• Performance metrics

Best regards,
Production Management System`
  });

  const handleInputChange = (field: keyof EmailFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendEmail = async () => {
    if (!summary) {
      toast.error('No report data available to send');
      return;
    }

    if (!formData.to.trim()) {
      toast.error('Please enter a recipient email address');
      return;
    }

    setIsSending(true);
    setEmailStatus('idle');
    setEmailError('');

    try {
      const response = await fetch('/api/target/comprehensive-report/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString(),
          reportData,
          summary,
          timeSlotHeaders,
          timeSlotTotals,
          emailOptions: {
            to: formData.to,
            cc: formData.cc || undefined,
            bcc: formData.bcc || undefined,
            subject: formData.subject,
            message: formData.message
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEmailStatus('success');
        toast.success('Target report email sent successfully!');
        setIsOpen(false);
        // Reset form
        setFormData({
          to: process.env.NEXT_PUBLIC_DEFAULT_EMAIL_TO || 'recipient@example.com',
          cc: '',
          bcc: '',
          subject: `Comprehensive Target Report - ${date.toLocaleDateString()}`,
          message: `Please find attached the comprehensive target report for ${date.toLocaleDateString()}.

This report includes:
• Target details by line and style
• Hourly production tracking
• Summary statistics
• Performance metrics

Best regards,
Production Management System`
        });
      } else {
        setEmailStatus('error');
        setEmailError(result.error || 'Failed to send email');
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      setEmailStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setEmailError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const canSendEmail = reportData.length > 0 && summary && !isSending;

  return (
    <div className="space-y-4">
      {/* Email Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="h-5 w-5 text-blue-600" />
            Email Actions
          </CardTitle>
          <CardDescription>
            Send comprehensive target reports via email to stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Send Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Quick send with default settings
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recipients: {process.env.NEXT_PUBLIC_DEFAULT_EMAIL_TO || 'Default email'}
              </p>
            </div>
            <Button
              onClick={handleSendEmail}
              disabled={!canSendEmail}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <IconSend className="h-4 w-4 mr-2" />
              Quick Send
            </Button>
          </div>

          {/* Custom Email Form Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Customize email settings and recipients
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              disabled={!canSendEmail}
            >
              {isOpen ? 'Hide Options' : 'Customize Email'}
            </Button>
          </div>

          {/* Email Status */}
          {emailStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <IconCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email sent successfully! Recipients will receive the comprehensive target report.
              </AlertDescription>
            </Alert>
          )}

          {emailStatus === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <IconAlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to send email: {emailError}
              </AlertDescription>
            </Alert>
          )}

          {/* Report Summary for Email */}
          {summary && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Report Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Lines:</span>
                  <Badge variant="secondary" className="ml-2">{summary.totalLines}</Badge>
                </div>
                <div>
                  <span className="text-gray-500">Target:</span>
                  <Badge variant="secondary" className="ml-2">{summary.totalTarget.toLocaleString()}</Badge>
                </div>
                <div>
                  <span className="text-gray-500">Production:</span>
                  <Badge variant="secondary" className="ml-2">{(summary?.totalProduction || 0).toLocaleString()}</Badge>
                </div>
                <div>
                  <span className="text-gray-500">Avg/HR:</span>
                  <Badge variant="secondary" className="ml-2">{summary.averageProductionPerHour.toFixed(1)}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Email Form */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Email Settings</CardTitle>
            <CardDescription>
              Configure email recipients, subject, and message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-to">To *</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={formData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-cc">CC</Label>
                <Input
                  id="email-cc"
                  type="email"
                  placeholder="cc@example.com"
                  value={formData.cc}
                  onChange={(e) => handleInputChange('cc', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-bcc">BCC</Label>
              <Input
                id="email-bcc"
                type="email"
                placeholder="bcc@example.com"
                value={formData.bcc}
                onChange={(e) => handleInputChange('bcc', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject *</Label>
              <Input
                id="email-subject"
                placeholder="Email subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Email message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSendEmail}
                disabled={!canSendEmail || isSending}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <IconSend className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSending}
              >
                <IconX className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
