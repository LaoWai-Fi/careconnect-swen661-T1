import React, { useId } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export default function FormField({ label, required, hint, error, children }: FormFieldProps) {
  const id = useId();

  // Inject a matching `id` into the first child element (the input/select/textarea)
  // so the <label htmlFor> association is programmatic and screen-reader-accessible.
  const labelledChild = React.Children.map(children, (child, i) => {
    if (i === 0 && React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<{ id?: string }>, { id });
    }
    return child;
  });

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--foreground)]">
        {label}
        {required && <span className="text-[var(--destructive)] ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {labelledChild}
      {hint && !error && <p className="text-sm text-[var(--muted-foreground)]">{hint}</p>}
      {error && <p className="text-sm text-[var(--destructive)] font-medium" role="alert">{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      {...props}
      className={`
        w-full px-4 py-3 text-base rounded-xl border-2 bg-[var(--card)]
        text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]
        transition-colors min-h-[52px]
        focus:outline-none focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed
        ${error ? 'border-[var(--destructive)]' : 'border-[var(--border)] focus:border-[var(--primary)]'}
        ${className}
      `}
    />
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`
        w-full px-4 py-3 text-base rounded-xl border-2 bg-[var(--card)]
        text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]
        transition-colors resize-y min-h-[120px]
        focus:outline-none focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed
        ${error ? 'border-[var(--destructive)]' : 'border-[var(--border)] focus:border-[var(--primary)]'}
        ${className}
      `}
    />
  );
}
