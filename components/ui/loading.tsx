import React from 'react';
import { Loader2, Factory, BarChart3, TrendingUp, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  variant?: 'default' | 'compact' | 'fullscreen' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loading({ 
  variant = 'default', 
  size = 'md', 
  text = 'Loading...',
  className 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
        <span className={cn("text-gray-600", textSizes[size])}>{text}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-col items-center justify-center p-6", className)}>
        <Loader2 className={cn("animate-spin text-blue-600 mb-3", sizeClasses[size])} />
        <p className={cn("text-gray-600", textSizes[size])}>{text}</p>
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center">
            {/* Logo and Title */}
            <div className="mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Production System
              </h1>
              <p className="text-gray-600">
                {text}
              </p>
            </div>

            {/* Main Spinner */}
            <div className="mb-8">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
              </div>
            </div>

            {/* Loading Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" 
                     style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Initializing system...</p>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">Reports</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs text-gray-600">Analytics</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs text-gray-600">Data</span>
              </div>
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Please wait while we prepare your workspace
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="relative mb-4">
        <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
        <div className="absolute inset-0 rounded-full border-2 border-blue-100 animate-pulse"></div>
      </div>
      <p className={cn("text-gray-600", textSizes[size])}>{text}</p>
    </div>
  );
}

// Convenience components for common use cases
export function LoadingSpinner({ size = 'md', className }: Omit<LoadingProps, 'variant' | 'text'>) {
  return <Loading variant="inline" size={size} text="" className={className} />;
}

export function LoadingPage({ text = 'Loading...', className }: Omit<LoadingProps, 'variant' | 'size'>) {
  return <Loading variant="fullscreen" text={text} className={className} />;
}

export function LoadingSection({ text = 'Loading...', className }: Omit<LoadingProps, 'variant' | 'size'>) {
  return <Loading variant="compact" text={text} className={className} />;
}
