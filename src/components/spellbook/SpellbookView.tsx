import { SlotTracker } from './SlotTracker';
import { SpellList } from './SpellList';
import { SpellcastingHeader } from './SpellcastingHeader';

export function SpellbookView() {
  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col space-y-2">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <SpellcastingHeader />
        <SlotTracker />
      </div>
      <SpellList />
    </div>
  );
}
