'use client';

interface KitchenAreaFilterProps {
  min?: number;
  max?: number;
  onChange: (values: { kitchen_area_min?: number; kitchen_area_max?: number }) => void;
}

export function KitchenAreaFilter({ min, max, onChange }: KitchenAreaFilterProps) {
  return (
    <div>
      <div className="text-sm font-medium mb-3">Площадь кухни, м²</div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="от"
          min={0}
          step={0.1}
          value={min || ''}
          onChange={e => onChange({
            kitchen_area_min: e.target.value ? Number(e.target.value) : undefined,
            kitchen_area_max: max,
          })}
          className="input"
        />
        <input
          type="number"
          placeholder="до"
          min={0}
          step={0.1}
          value={max || ''}
          onChange={e => onChange({
            kitchen_area_min: min,
            kitchen_area_max: e.target.value ? Number(e.target.value) : undefined,
          })}
          className="input"
        />
      </div>
    </div>
  );
}
