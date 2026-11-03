
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'sans-serif'],
				display: ['"Bricolage Grotesque"', 'Figtree', 'system-ui', 'sans-serif'],
				mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
					muted: 'hsl(var(--sidebar-muted))'
				},
				harvest: {
					DEFAULT: 'hsl(var(--harvest))',
					foreground: 'hsl(var(--harvest-foreground))'
				},
				leaf: {
					DEFAULT: 'hsl(var(--leaf))',
					tint: 'hsl(var(--leaf-tint))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					tint: 'hsl(var(--warning-tint))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					tint: 'hsl(var(--info-tint))'
				},
				rust: {
					DEFAULT: 'hsl(var(--rust))',
					tint: 'hsl(var(--rust-tint))'
				},
				/* Chart series: income/growing and expense/harvest. Validated for colour-blind separation. */
				chart: {
					income: '#2E7D4F',
					expense: '#E39B34',
					planned: '#D5DED3'
				},
				farm: {
					/* Legacy names, remapped onto the Field Ledger palette */
					green: '#1F6B3A',
					brown: '#8A5300',
					yellow: '#E9A23B',
					lightGreen: '#2E7D4F',
					darkGreen: '#11261A',
					soil: '#5A4520',
					wheat: '#E39B34',
					sky: '#1F4F8A'
				}
			},
			backgroundImage: {
				'farm-background': 'url(/farm-pattern.png)',
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [animate],
} satisfies Config;
