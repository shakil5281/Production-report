import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Home, ArrowLeft, UserCheck } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-12 h-12 text-orange-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Access Forbidden
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              You don&apos;t have permission to access this resource.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600">
              This page requires special permissions or a higher role level. 
              Please contact your administrator if you believe this is an error.
            </p>
            
            <div className="space-y-3">
              <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
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
                What you can do:
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span>Check your current role and permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  <span>Contact your system administrator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-orange-500" />
                  <span>Navigate to accessible areas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
