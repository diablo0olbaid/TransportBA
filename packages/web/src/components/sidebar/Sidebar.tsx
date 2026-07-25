import { SearchBox } from './SearchBox.js';
import { LineSelector } from './LineSelector.js';
import { LayerSwitches } from './LayerSwitches.js';
import { ColectivoInput } from './ColectivoInput.js';

/** Sidebar completo (§9): buscador, líneas, capas y colectivos. */
export function Sidebar(): JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <SearchBox />
      <div className="border-t border-border" />
      <LineSelector />
      <div className="border-t border-border" />
      <LayerSwitches />
      <div className="border-t border-border" />
      <ColectivoInput />
    </div>
  );
}
