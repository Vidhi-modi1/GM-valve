// Batch Color Replacement Script
// This script documents all the blue color replacements needed

const replacements = {
  // Background colors
  'bg-blue-50': 'bg-[#e8f0f9]',
  'bg-blue-100': 'bg-[#d1e2f3]',
  'bg-blue-200': 'bg-[#a3c4e7]',
  'bg-blue-500': 'bg-[#2461c7]',
  'bg-blue-600': 'bg-[#174a9f]',
  'bg-blue-700': 'bg-[#123a7f]',
  'bg-blue-800': 'bg-[#0d2a5f]',
  
  // Text colors
  'text-blue-600': 'text-[#174a9f]',
  'text-blue-700': 'text-[#123a7f]',
  'text-blue-800': 'text-[#0d2a5f]',
  
  // Border colors
  'border-blue-200': 'border-[#a3c4e7]',
  'border-blue-500': 'border-[#2461c7]',
  
  // Hover states
  'hover:bg-blue-50': 'hover:bg-[#e8f0f9]',
  'hover:bg-blue-100': 'hover:bg-[#d1e2f3]',
  'hover:bg-blue-600': 'hover:bg-[#174a9f]',
  'hover:bg-blue-700': 'hover:bg-[#123a7f]',
  'hover:border-blue-200': 'hover:border-[#a3c4e7]',
  
  // Ring colors (focus states)
  'ring-blue-200': 'ring-[#a3c4e7]',
  'ring-blue-500': 'ring-[#174a9f]',
  
  // Gradients
  'from-blue-50': 'from-[#e8f0f9]',
  'from-blue-500': 'from-[#2461c7]',
  'from-blue-600': 'from-[#174a9f]',
  'from-blue-700': 'from-[#123a7f]',
  'to-blue-50': 'to-[#e8f0f9]',
  'to-blue-100': 'to-[#d1e2f3]',
  'to-blue-600': 'to-[#174a9f]',
  'to-blue-700': 'to-[#123a7f]',
  'to-blue-800': 'to-[#0d2a5f]',
};

// Files to update
const filesToUpdate = [
  '/components/orders-page.tsx',
  '/components/orders-page-2.tsx',
  '/components/assigned-orders-page.tsx',
  '/components/semi-qc-page.tsx',
  '/components/after-phosphating-qc-page.tsx',
  '/components/after-phosphating-qc-page-new.tsx',
  '/components/assembly-page.tsx',
  '/components/testing-page.tsx',
  '/components/marking-page.tsx',
  '/components/svs-page.tsx',
];

console.log('Blue Color Replacement Patterns:');
console.log(JSON.stringify(replacements, null, 2));
