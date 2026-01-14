/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
        },
        // Crypto semantic colors (#142)
        crypto: {
          yield: "hsl(var(--crypto-yield))",
          synergy: "hsl(var(--crypto-synergy))",
          chain: "hsl(var(--crypto-chain))",
          risk: {
            low: "hsl(var(--crypto-risk-low))",
            medium: "hsl(var(--crypto-risk-medium))",
            high: "hsl(var(--crypto-risk-high))",
            extreme: "hsl(var(--crypto-risk-extreme))",
          },
        },
        // Status colors
        status: {
          success: "hsl(var(--status-success))",
          warning: "hsl(var(--status-warning))",
          error: "hsl(var(--status-error))",
          info: "hsl(var(--status-info))",
        },
        // Panel colors
        panel: {
          DEFAULT: "hsl(var(--panel-bg))",
          hover: "hsl(var(--panel-bg-hover))",
          border: "hsl(var(--panel-border))",
        },
      },
      spacing: {
        // Expose spacing scale as Tailwind utilities
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // Cobie head animations (#177)
        "cobie-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "cobie-blink": {
          "0%, 90%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        "cobie-talk": {
          "0%, 100%": { transform: "scaleY(1)" },
          "25%": { transform: "scaleY(0.7)" },
          "50%": { transform: "scaleY(1.1)" },
          "75%": { transform: "scaleY(0.8)" },
        },
        "cobie-sleep": {
          "0%": { opacity: "0", transform: "translateY(0)" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-10px)" },
        },
        // Cobie menu animations (#200, #201)
        "menu-item-appear": {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) translate(var(--tw-translate-x), var(--tw-translate-y)) scale(1)" },
        },
        "menu-open": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "menu-close": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Cobie head animations (#177)
        "cobie-bob": "cobie-bob 3s ease-in-out infinite",
        "cobie-blink": "cobie-blink 4s ease-in-out infinite",
        "cobie-talk": "cobie-talk 0.3s ease-in-out infinite",
        "cobie-sleep": "cobie-sleep 2s ease-in-out infinite",
        // Cobie menu animations (#200, #201)
        "menu-item-appear": "menu-item-appear 0.2s ease-out forwards",
        "menu-open": "menu-open 0.2s ease-out",
        "menu-close": "menu-close 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}


















