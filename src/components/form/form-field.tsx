export function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[15px] font-black text-slate-800">
        {label} {required ? <span className="text-[#E32F54]">*</span> : null}
      </span>
      {children}
      {error ? <span className="form-error">{error}</span> : null}
    </label>
  );
}
