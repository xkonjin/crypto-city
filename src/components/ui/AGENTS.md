# UI COMPONENTS

shadcn/ui-based React components with Radix primitives. 20 files.

## STRUCTURE

```
ui/
├── # PRIMITIVES (Radix-based)
├── button.tsx           # Button with variants (default, outline, ghost)
├── badge.tsx            # Status badges
├── card.tsx             # Card container
├── dialog.tsx           # Modal dialogs
├── dropdown-menu.tsx    # Context menus
├── input.tsx            # Text input
├── label.tsx            # Form labels
├── progress.tsx         # Progress bars
├── scroll-area.tsx      # Custom scrollbars
├── separator.tsx        # Horizontal/vertical dividers
├── slider.tsx           # Range sliders
├── switch.tsx           # Toggle switches
├── tabs.tsx             # Tab navigation
├── tooltip.tsx          # Hover tooltips
│
├── # CUSTOM COMPONENTS
├── CommandMenu.tsx      # Command palette (Cmd+K)
├── Icons.tsx            # Icon library (Lucide + custom)
├── LanguageSelector.tsx # i18n language picker
└── TipToast.tsx         # Tutorial tip notifications
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Add new button variant | `button.tsx` |
| Custom modal | `dialog.tsx` |
| Dropdown menus | `dropdown-menu.tsx` |
| Keyboard shortcuts | `CommandMenu.tsx` |
| Add new icon | `Icons.tsx` |

## CONVENTIONS

### Component Pattern
```typescript
// All components use forwardRef + class-variance-authority
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", outline: "..." },
      size: { default: "...", sm: "...", lg: "..." },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
```

### Styling
- Tailwind CSS for all styling
- `cn()` utility for class merging
- CSS variables for theming (defined in globals.css)
- Dark mode via `dark:` prefix

### Radix Integration
- Primitives from `@radix-ui/*` packages
- Forward refs preserved
- ARIA attributes automatic

## ANTI-PATTERNS

- **Don't use inline styles** - Use Tailwind classes
- **Don't create new primitives** - Extend existing shadcn components
- **Don't skip forwardRef** - Breaks composition
- **Don't hardcode colors** - Use CSS variables

## NOTES

- Components match shadcn/ui patterns for consistency
- All components are client-side only ('use client' directive)
- Icons from Lucide React + custom SVGs in Icons.tsx
