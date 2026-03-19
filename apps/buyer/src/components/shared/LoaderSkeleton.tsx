'use client';

export default function LoaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-lg ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/40 shadow-xl p-6 animate-pulse">
      <div className="aspect-square bg-gray-100 rounded-2xl mb-6" />
      <div className="h-5 bg-gray-100 rounded-full w-3/4 mb-3" />
      <div className="h-4 bg-gray-100 rounded-full w-1/2 mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-100 rounded-full w-20" />
        <div className="h-9 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}

export function SkeletonOrderCard() {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl animate-pulse flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <div className="h-5 bg-gray-100 rounded-full w-40" />
          <div className="h-4 bg-gray-100 rounded-full w-28" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end gap-2">
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-4 bg-gray-100 rounded-full w-16" />
        </div>
        <div className="w-5 h-5 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function SkeletonPaymentCard() {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[32px] p-8 shadow-xl animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-100 rounded-full w-32" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
          </div>
          <div className="h-4 bg-gray-100 rounded-full w-24" />
          <div className="h-4 bg-gray-100 rounded-full w-36" />
        </div>
        <div className="flex items-center gap-12">
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded-full w-16" />
            <div className="h-7 bg-gray-100 rounded-full w-24" />
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonNotificationCard() {
  return (
    <div className="flex items-center gap-6 p-6 rounded-[32px] border border-gray-100 bg-white/40 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-100 rounded-full w-48" />
        <div className="h-4 bg-gray-100 rounded-full w-full" />
      </div>
    </div>
  );
}

export function SkeletonProfileHeader() {
  return (
    <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl animate-pulse">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl" />
        <div className="flex flex-col gap-2">
          <div className="h-7 bg-gray-100 rounded-full w-48" />
          <div className="h-4 bg-gray-100 rounded-full w-64" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTicketCard() {
  return (
    <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl animate-pulse flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gray-100 rounded-full w-20" />
          <div className="h-4 bg-gray-100 rounded-full w-16" />
        </div>
        <div className="h-5 bg-gray-100 rounded-full w-56" />
        <div className="h-4 bg-gray-100 rounded-full w-36" />
      </div>
      <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
    </div>
  );
}

export function SkeletonList({ count = 3, variant = 'order' }: { count?: number; variant?: 'order' | 'payment' | 'notification' | 'ticket' }) {
  const Component = {
    order: SkeletonOrderCard,
    payment: SkeletonPaymentCard,
    notification: SkeletonNotificationCard,
    ticket: SkeletonTicketCard,
  }[variant];

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
