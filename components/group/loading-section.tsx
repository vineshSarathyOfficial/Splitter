'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function GroupHeaderSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="w-full">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full" />
      </div>
      <Skeleton className="h-12 w-32" />
    </div>
  );
}

export function MembersSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 sm:p-8">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl border border-gray-100/50">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BalancesSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 sm:p-8">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 flex items-center justify-between transition-all duration-300 hover:shadow-lg border border-gray-100/50 hover:border-gray-200/70">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}


export function ExpensesSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 sm:p-8">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100/50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-2xl" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}