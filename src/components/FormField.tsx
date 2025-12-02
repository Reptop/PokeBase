import type { PropsWithChildren } from 'react';

export default function FormField({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <label className="field">
      <div className="field-label">{label}</div>
      {children}
    </label>
  );
}

