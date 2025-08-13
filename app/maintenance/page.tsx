import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Clock, AlertCircle, Home, RefreshCw, Mail } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <Wrench className="w-12 h-12 text-yellow-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Under Maintenance
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              We&apos;re currently performing system maintenance.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600">
              We&apos;re working hard to improve your experience. 
              The system will be back online shortly.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Estimated Time</span>
              </div>
              <p className="text-sm text-blue-700">
                Maintenance is expected to complete within 2-4 hours.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button asChild className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                <Link href="/" className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Check Status
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Back Home
                </Link>
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center mb-3">
                What we&apos;re doing:
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-yellow-500" />
                  <span>System updates and improvements</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>Performance optimizations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span>Security enhancements</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Need Help?</span>
              </div>
              <p className="text-sm text-gray-700">
                Contact our support team at{' '}
                <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                  support@example.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
