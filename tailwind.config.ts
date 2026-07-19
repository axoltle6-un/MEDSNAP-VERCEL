import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'var(--background)',
                        foreground: 'var(--foreground)',
                        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
                        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
                        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
                        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
                        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
                        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
                        destructive: { DEFAULT: 'var(--destructive)' },
                        border: 'var(--border)',
                        input: 'var(--input)',
                        ring: 'var(--ring)',
                        safe: { DEFAULT: 'var(--safe)', foreground: 'var(--safe-foreground)', soft: 'var(--safe-soft)' },
                        warn: { DEFAULT: 'var(--warn)', foreground: 'var(--warn-foreground)', soft: 'var(--warn-soft)' },
                        danger: { DEFAULT: 'var(--danger)', foreground: 'var(--danger-foreground)', soft: 'var(--danger-soft)' },
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 4px)',
                        sm: 'calc(var(--radius) - 6px)',
                        '2xl': 'calc(var(--radius) + 8px)',
                        '3xl': 'calc(var(--radius) + 12px)'
                },
                fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
