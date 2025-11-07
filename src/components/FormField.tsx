import { PropsWithChildren } from 'react';

export default function FormField({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <label className="block mb-3">
      <div className="text-xs font-medium mb-1 text-neutral-700">{label}</div>
      {children}
    </label>
  );
}

