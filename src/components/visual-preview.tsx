import React from 'react';
import industrialImage from 'figma:asset/8d0931fbd565c8647b87305fabaa79cd19ae515f.png';

export function VisualPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0d2a5f] via-[#174a9f] to-[#2461c7]">
      {/* Industrial Equipment Background with parallax effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-700"
        style={{
          backgroundImage: `url('${industrialImage}')`
        }}
      />
      
      {/* Dynamic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#174a9f]/30 via-[#0d2a5f]/40 to-[#174a9f]/50" />
      
      {/* Animated geometric shapes */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse-soft"></div>
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-float"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* GM Branding Content with modern styling */}
      <div className="absolute bottom-12 left-12 text-white space-y-6 max-w-lg">
        <div className="space-y-3 animate-fade-in-up">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm">
            🏭 Manufacturing Excellence
          </div>
          <h2 className="text-5xl mb-3 leading-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Industrial Excellence
          </h2>
          <p className="text-white/90 text-xl">Precision Engineering Solutions</p>
        </div>
        
        {/* Feature badges */}
        <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-sm hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
            ⚡ Real-time Tracking
          </div>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-sm hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
            🎯 Quality Control
          </div>
        </div>
      </div>
      
      {/* Decorative corner elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/10 to-transparent"></div>
    </div>
  );
}