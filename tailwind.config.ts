import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  // '.dark &' emits `.dark .dark\:x`; the default 'class' mode emits `:is(.dark *)`, which Safari 10 drops.
  darkMode: ['variant', '.dark &'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  // Safari 10.1 only knows the grid-gap names; emit both so grid gaps work. Flex gap has no fallback,
  // so flex containers in this fork use space-x-*/space-y-* instead.
  corePlugins: { gap: false },
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          gap: (v) => ({ 'grid-gap': v, gap: v }),
          'gap-x': (v) => ({ 'grid-column-gap': v, 'column-gap': v }),
          'gap-y': (v) => ({ 'grid-row-gap': v, 'row-gap': v }),
        },
        { values: theme('gap') },
      );
    }),
  ],
} satisfies Config;
