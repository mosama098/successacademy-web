export function FormOptions({
  label,
  options,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-3">
      <span className="text-[15px] font-black text-slate-800">
        {label} {required ? <span className="text-[#E32F54]">*</span> : null}
      </span>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-[52px] rounded-xl border px-4 py-3 text-start text-[15px] font-black leading-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#EC911F] hover:shadow-lg ${
              value === option.value
                ? "border-[#391B68] bg-[#391B68] text-white shadow-lg shadow-[#391B68]/20"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? <span className="form-error">{error}</span> : null}
    </div>
  );
}
