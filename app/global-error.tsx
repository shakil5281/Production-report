'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="shadow-2xl border-0">
              <CardHeader className="text-center">
                <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Something went wrong!
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  An unexpected error occurred.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <p className="text-center text-gray-600">
                  We&apos;re sorry, but something went wrong. Our team has been notified 
                  and is working to fix the issue.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Error Details</span>
                  </div>
                  <p className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded">
                    {error.message || 'Unknown error occurred'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={reset}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
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
                    If the problem persists:
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-red-500" />
                      <span>Refresh the page</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-red-500" />
                      <span>Clear your browser cache</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-red-500" />
                      <span>Contact support if needed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </body>
    </html>
  );
}
