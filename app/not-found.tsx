import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search, FileText } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-red-600">404</span>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Oops! The page you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600">
              The page you requested might have been moved, deleted, or you entered the wrong URL.
            </p>
            
            <div className="space-y-3">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Go Back Home
                </Link>
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center mb-3">
                Try these helpful links:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">

                <Button asChild variant="ghost" size="sm">
                  <Link href="/production-reports" className="flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Reports
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/profile" className="flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Profile
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
