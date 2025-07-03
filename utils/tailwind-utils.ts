import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Enhanced cn function with better typing
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}

// Type-safe Tailwind class builder
export const tw = {
    // Spacing
    p: (size: number) => `p-${size}` as const,
    px: (size: number) => `px-${size}` as const,
    py: (size: number) => `py-${size}` as const,
    m: (size: number) => `m-${size}` as const,
    mx: (size: number) => `mx-${size}` as const,
    my: (size: number) => `my-${size}` as const,

    // Colors
    bg: (color: string) => `bg-${color}` as const,
    text: (color: string) => `text-${color}` as const,
    border: (color: string) => `border-${color}` as const,

    // Layout
    w: (size: string) => `w-${size}` as const,
    h: (size: string) => `h-${size}` as const,

    // Flexbox
    flex: () => 'flex' as const,
    items: (alignment: 'start' | 'center' | 'end' | 'stretch') => `items-${alignment}` as const,
    justify: (justification: 'start' | 'center' | 'end' | 'between' | 'around') => `justify-${justification}` as const,

    // Grid
    grid: () => 'grid' as const,
    gridCols: (cols: number) => `grid-cols-${cols}` as const,
    gap: (size: number) => `gap-${size}` as const,

    // Borders
    rounded: (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => `rounded-${size}` as const,
    borderWidth: (width: number) => `border-${width}` as const,

    // Effects
    shadow: (size: 'sm' | 'md' | 'lg' | 'xl') => `shadow-${size}` as const,
    opacity: (value: number) => `opacity-${value}` as const,

    // Transitions
    transition: () => 'transition-all' as const,
    duration: (time: number) => `duration-${time}` as const,

    // States
    hover: (classes: string) => `hover:${classes}` as const,
    focus: (classes: string) => `focus:${classes}` as const,

    // Responsive
    sm: (classes: string) => `sm:${classes}` as const,
    md: (classes: string) => `md:${classes}` as const,
    lg: (classes: string) => `lg:${classes}` as const,
    xl: (classes: string) => `xl:${classes}` as const,
} 