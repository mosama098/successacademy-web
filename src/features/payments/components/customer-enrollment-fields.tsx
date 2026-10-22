import type { Locale } from "../../../lib/i18n";
import { customerCopy } from "../../customers/copy";
import { enrollmentFields, type EnrollmentErrors, type EnrollmentField, type EnrollmentForm } from "../../customers/types";

type Props = {
  locale: Locale; value: EnrollmentForm;
  errors: EnrollmentErrors; disabled: boolean;
  onChange: (field: EnrollmentField, value: string) => void;
  onBlur: (field: EnrollmentField) => void;
};

export function CustomerEnrollmentFields({ locale, value, errors, disabled, onChange, onBlur }: Props) {
  const copy = customerCopy[locale];
  return <fieldset disabled={disabled} data-payment-section="customer">
      <legend className="mb-3 text-lg font-black text-[#321d43]">{copy.title}</legend>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {enrollmentFields.map((field) => {
          const optional = field === "notes";
          const shared = {
            id: `payment-${field}`, name: field, required: !optional, value: value[field],
            onBlur: () => onBlur(field),
            "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `payment-${field}-error` : undefined,
            className: `min-h-11 w-full min-w-0 rounded-xl border bg-[#fbfafc] px-3 text-base text-[#321d43] outline-none transition focus:border-[#563a64] focus:ring-4 focus:ring-[#ece5ee] disabled:opacity-60 ${errors[field] ? "border-red-600" : "border-[#321d43]/20"}`,
          };
          const phone = field === "phone" || field === "whatsapp";
          const message = errors[field] === "required" ? copy.required : phone ? copy.phoneError : field === "email" ? copy.emailError : field === "age" ? copy.ageError : copy.invalid;
          return <div key={field} className={field === "name" || field === "email" ? "col-span-2 min-w-0 sm:col-span-1" : "min-w-0"}>
            <label htmlFor={shared.id} className="mb-1 block text-sm font-bold text-[#321d43]">{copy.fields[field]}</label>
            {field === "notes" ? <textarea {...shared} rows={1} maxLength={1000} onChange={(event) => onChange(field, event.target.value)} className={shared.className + " py-2"} />
              : <input {...shared} type={field === "email" ? "email" : phone ? "tel" : "text"}
                maxLength={phone ? 32 : field === "email" ? 254 : field === "age" ? 3 : 120}
                inputMode={field === "age" ? "numeric" : undefined}
                pattern={field === "age" ? "[0-9٠-٩۰-۹]{1,3}" : undefined}
                dir={phone || field === "email" ? "ltr" : undefined}
                autoComplete={field === "name" ? "name" : field === "phone" ? "tel" : field === "email" ? "email" : "off"}
                onChange={(event) => onChange(field, event.target.value)} />}
            {errors[field] ? <p id={`payment-${field}-error`} role="alert" className="mt-1.5 text-sm font-semibold text-red-700">{message}</p> : null}
          </div>;
        })}
      </div>
    </fieldset>;
}
