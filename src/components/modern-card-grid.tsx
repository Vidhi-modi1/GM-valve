import React from 'react';
import { LucideIcon, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface CardAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive';
}

interface ModernCardGridItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: React.ReactNode;
  image?: string;
  icon?: LucideIcon;
  footer?: React.ReactNode;
  actions?: CardAction[];
  onClick?: () => void;
  metadata?: Array<{ label: string; value: string | React.ReactNode }>;
}

export function ModernCardGridItem({
  title,
  subtitle,
  description,
  badge,
  image,
  icon: Icon,
  footer,
  actions,
  onClick,
  metadata
}: ModernCardGridItemProps) {
  return (
    <div 
      className={`
        relative group
        bg-white/80 backdrop-blur-sm
        border border-gray-200/60
        rounded-xl
        shadow-sm hover:shadow-xl
        transition-all duration-300
        hover:-translate-y-1
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#174a9f]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Image or Icon Header */}
      {(image || Icon) && (
        <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : Icon && (
            <div className="flex items-center justify-center h-full">
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-full">
                <Icon className="h-12 w-12 text-[#174a9f]" />
              </div>
            </div>
          )}
          
          {/* Badge overlay */}
          {badge && (
            <div className="absolute top-3 left-3">
              {badge}
            </div>
          )}

          {/* Actions menu */}
          {actions && actions.length > 0 && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                        className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                      >
                        {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3 relative z-10">
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-[#174a9f] transition-colors duration-200 line-clamp-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-700 line-clamp-2">
            {description}
          </p>
        )}

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200/60">
            {metadata.map((item, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-medium text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200/60 bg-gray-50/50">
          {footer}
        </div>
      )}

      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
    </div>
  );
}

interface ModernCardGridProps {
  items: ModernCardGridItemProps[];
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export function ModernCardGrid({
  items,
  columns = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 6
}: ModernCardGridProps) {
  const gridClass = `
    grid gap-${gap}
    grid-cols-${columns.default}
    ${columns.sm ? `sm:grid-cols-${columns.sm}` : ''}
    ${columns.md ? `md:grid-cols-${columns.md}` : ''}
    ${columns.lg ? `lg:grid-cols-${columns.lg}` : ''}
    ${columns.xl ? `xl:grid-cols-${columns.xl}` : ''}
  `;

  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <ModernCardGridItem {...item} />
        </div>
      ))}
    </div>
  );
}
