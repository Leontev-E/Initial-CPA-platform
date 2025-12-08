import geosOptions from '@/data/geos.json';
import { useMemo, useState } from 'react';

export default function GeoMultiSelect({ value = [], onChange, placeholder = 'GEO', className = '' }) {
    const [input, setInput] = useState('');
    const [open, setOpen] = useState(false);

    const matches = useMemo(() => {
        const term = input.trim().toLowerCase();
        if (!term) return geosOptions.slice(0, 12);
        return geosOptions
            .filter((g) => g.value.toLowerCase().includes(term) || g.text.toLowerCase().includes(term))
            .slice(0, 12);
    }, [input]);

    const add = (code) => {
        const normalized = code.trim().toUpperCase();
        if (!normalized) return;
        if (value.includes(normalized)) return;
        onChange([...(value || []), normalized]);
        setInput('');
    };

    return (
        <div className={`w-full ${className}`.trim()}>
            {placeholder && (
                <div className="mb-1 text-[10px] uppercase leading-none text-gray-400">
                    {placeholder}
                </div>
            )}
            <div className="relative">
                <input
                    className="h-10 w-full rounded border px-3 text-sm"
                    placeholder={(value && value.length > 0) ? value.join(', ') : 'Введите код GEO'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            add(input);
                        }
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 120)}
                />
                {open && matches.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                        {matches.map((geo) => (
                            <button
                                key={geo.value}
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                                onClick={() => {
                                    add(geo.value);
                                    setOpen(true);
                                }}
                            >
                                <span>{geo.value} — {geo.text}</span>
                                {value.includes(geo.value) && (
                                    <span className="text-[11px] text-indigo-600">Выбрано</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
