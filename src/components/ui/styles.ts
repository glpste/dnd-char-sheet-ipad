/** Shared Tailwind class strings so panels, inputs and buttons look alike everywhere. */
export const panel =
  'rounded-md border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900';

export const panelTitle =
  'text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400';

export const input =
  'rounded border border-transparent bg-transparent px-1 py-0.5 text-zinc-900 outline-none ' +
  'hover:border-zinc-300 focus:border-amber-500 focus:bg-white dark:text-zinc-100 ' +
  'dark:hover:border-zinc-700 dark:focus:border-amber-400 dark:focus:bg-zinc-950';

export const btn =
  'inline-flex items-center justify-center space-x-1 rounded border border-zinc-300 bg-white px-2 py-1 ' +
  'text-sm text-zinc-800 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-amber-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 ' +
  'dark:text-zinc-100 dark:hover:bg-zinc-800';

export const btnGhost =
  'inline-flex items-center justify-center space-x-1 rounded px-2 py-1 text-sm text-zinc-700 ' +
  'hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ' +
  'dark:text-zinc-200 dark:hover:bg-zinc-800';

export const btnDanger =
  'inline-flex items-center justify-center space-x-1 rounded border border-red-600 bg-red-600 px-2 py-1 ' +
  'text-sm text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500';

export const btnPrimary =
  'inline-flex items-center justify-center space-x-1 rounded border border-amber-600 bg-amber-500 px-2 py-1 ' +
  'text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-amber-500';

export const menu =
  'absolute z-20 mt-1 min-w-[12rem] rounded-md border border-zinc-300 bg-white p-1 shadow-lg ' +
  'dark:border-zinc-700 dark:bg-zinc-900';

export const menuItem =
  'block w-full rounded px-2 py-1 text-left text-sm text-zinc-800 hover:bg-zinc-100 ' +
  'focus-visible:bg-zinc-100 focus-visible:outline-none dark:text-zinc-100 dark:hover:bg-zinc-800 ' +
  'dark:focus-visible:bg-zinc-800';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
