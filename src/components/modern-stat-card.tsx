import React from "react";
import { LucideIcon } from "lucide-react";

interface ModernStatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: LucideIcon;
  gradient: "blue" | "green" | "purple" | "orange";
  trend?: Array<number>;
}

const gradientColors = {
  blue: {
    bg: "from-[#174a9f] to-indigo-600",
    light: "from-blue-50 to-indigo-50",
    text: "text-[#174a9f]",
    glow: "shadow-[#174a9f]/20",
  },
  green: {
    bg: "from-green-500 to-emerald-600",
    light: "from-green-50 to-emerald-50",
    text: "text-green-600",
    glow: "shadow-green-500/20",
  },
  purple: {
    bg: "from-purple-500 to-violet-600",
    light: "from-purple-50 to-violet-50",
    text: "text-purple-600",
    glow: "shadow-purple-500/20",
  },
  orange: {
    bg: "from-orange-500 to-amber-600",
    light: "from-orange-50 to-amber-50",
    text: "text-orange-600",
    glow: "shadow-orange-500/20",
  },
};

export function ModernStatCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  trend,
}: ModernStatCardProps) {
  const colors = gradientColors[gradient];

  return (
    <div className="relative group">
      {/* Glow effect */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${colors.bg} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`}
      ></div>

      {/* Card */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
        {/* Background gradient decoration */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.light} opacity-50 rounded-bl-full transition-all duration-500 group-hover:w-48 group-hover:h-48`}
        ></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm mb-2 group-hover:text-gray-700 transition-colors">
                {title}
              </p>
              <h3
                className={`text-4xl ${colors.text} transition-all duration-300 group-hover:scale-105 inline-block`}
              >
                {value}
              </h3>
            </div>

            {/* Icon */}
            <div
              className={`p-3 bg-gradient-to-br ${colors.bg} rounded-xl shadow-lg ${colors.glow} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Change indicator */}
          {change && (
            <div
              className={`flex items-center gap-1.5 text-sm ${
                change.positive ? "text-green-600" : "text-red-600"
              }`}
            >
              <span className="text-base">{change.positive ? "↗" : "↘"}</span>
              <span className="font-medium">{change.value}</span>
              <span className="text-gray-500">from last month</span>
            </div>
          )}

          {/* Mini trend line */}
          {trend && (
            <div className="mt-4 h-12 flex items-end gap-1">
              {trend.map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 bg-gradient-to-t ${colors.bg} rounded-t opacity-30 group-hover:opacity-60 transition-all duration-300`}
                  style={{
                    height: `${height}%`,
                    transitionDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    </div>
  );
}
