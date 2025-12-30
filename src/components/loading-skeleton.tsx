import React from "react";

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg skeleton"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 animate-scale-in">
      <div className="space-y-4">
        <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded skeleton w-3/4" />
        <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded skeleton w-full" />
        <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded skeleton w-5/6" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 animate-scale-in">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded skeleton w-1/2" />
          <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded skeleton w-1/3" />
        </div>
        <div className="w-12 h-12 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl skeleton" />
      </div>
    </div>
  );
}

export function SpinnerLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-[#174a9f] border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-[#e8f0f9]/30 to-indigo-50/40 flex items-center justify-center z-50">
      <div className="text-center space-y-4 animate-scale-in">
        <div className="w-16 h-16 border-4 border-[#174a9f] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
