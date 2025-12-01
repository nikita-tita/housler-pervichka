'use client';

interface FloorFilterProps {
  floorMin?: number;
  floorMax?: number;
  notFirstFloor?: boolean;
  notLastFloor?: boolean;
  onChange: (values: {
    floor_min?: number;
    floor_max?: number;
    not_first_floor?: boolean;
    not_last_floor?: boolean;
  }) => void;
}

export function FloorFilter({
  floorMin,
  floorMax,
  notFirstFloor,
  notLastFloor,
  onChange,
}: FloorFilterProps) {
  return (
    <div>
      <div className="text-sm font-medium mb-3">Этаж</div>

      {/* Range inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          type="number"
          placeholder="от"
          min={1}
          value={floorMin || ''}
          onChange={e => onChange({
            floor_min: e.target.value ? Number(e.target.value) : undefined,
            floor_max: floorMax,
            not_first_floor: notFirstFloor,
            not_last_floor: notLastFloor,
          })}
          className="input"
        />
        <input
          type="number"
          placeholder="до"
          min={1}
          value={floorMax || ''}
          onChange={e => onChange({
            floor_min: floorMin,
            floor_max: e.target.value ? Number(e.target.value) : undefined,
            not_first_floor: notFirstFloor,
            not_last_floor: notLastFloor,
          })}
          className="input"
        />
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={notFirstFloor || false}
            onChange={e => onChange({
              floor_min: floorMin,
              floor_max: floorMax,
              not_first_floor: e.target.checked ? true : undefined,
              not_last_floor: notLastFloor,
            })}
            className="w-4 h-4 rounded border-[var(--color-border)]"
          />
          <span>Не первый</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={notLastFloor || false}
            onChange={e => onChange({
              floor_min: floorMin,
              floor_max: floorMax,
              not_first_floor: notFirstFloor,
              not_last_floor: e.target.checked ? true : undefined,
            })}
            className="w-4 h-4 rounded border-[var(--color-border)]"
          />
          <span>Не последний</span>
        </label>
      </div>
    </div>
  );
}
