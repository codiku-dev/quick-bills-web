// Tailwind CSS class name types
export type TailwindClass =
    // Spacing
    | `p-${number}` | `px-${number}` | `py-${number}` | `pt-${number}` | `pr-${number}` | `pb-${number}` | `pl-${number}`
    | `m-${number}` | `mx-${number}` | `my-${number}` | `mt-${number}` | `mr-${number}` | `mb-${number}` | `ml-${number}`
    // Colors
    | `bg-${string}` | `text-${string}` | `border-${string}`
    // Layout
    | `w-${string}` | `h-${string}` | `max-w-${string}` | `min-h-${string}`
    // Flexbox
    | `flex` | `flex-${string}` | `items-${string}` | `justify-${string}`
    // Grid
    | `grid` | `grid-cols-${number}` | `gap-${number}`
    // Typography
    | `text-${string}` | `font-${string}` | `leading-${string}`
    // Borders
    | `border` | `border-${number}` | `rounded-${string}`
    // Effects
    | `shadow-${string}` | `opacity-${number}`
    // Transitions
    | `transition-${string}` | `duration-${number}` | `ease-${string}`
    // States
    | `hover:${string}` | `focus:${string}` | `active:${string}`
    // Responsive
    | `sm:${string}` | `md:${string}` | `lg:${string}` | `xl:${string}`


// Utility type for combining multiple classes
export type TailwindClasses = TailwindClass | TailwindClass[];

// Type for className props
export type ClassNameProp = TailwindClasses | undefined; 