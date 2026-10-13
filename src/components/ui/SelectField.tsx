import type { SelectHTMLAttributes } from 'react'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & { id: string; label: string; error?: string }
export function SelectField({ id, label, error, children, ...props }: SelectFieldProps) {
  return <div className="login-field"><label htmlFor={id}>{label}</label><select {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>{children}</select>{error && <p id={`${id}-error`} className="field-error">{error}</p>}</div>
}
