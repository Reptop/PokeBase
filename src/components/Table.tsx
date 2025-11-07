import React from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T extends object> = {
  columns: Column<T>[];
  rows: T[];
  keyField?: keyof T;

  // tighter row height
  compact?: boolean;
};

export default function Table<T extends Record<string, any>>({
  columns,
  rows,
  keyField,
  compact = false,
}: Props<T>) {
  const cellPad = compact ? "px-3 py-2" : "px-4 py-3";

  return (
    <div className="relative">
      <div className="overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-neutral-50">
            <tr className="border-b">
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`sticky top-0 z-10 ${cellPad} text-left font-semibold text-neutral-700 ${c.className ?? ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`${cellPad} text-center text-neutral-500`}
                >
                  No rows to display.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={keyField ? String(r[keyField]) : idx}
                  className="border-b last:border-0 odd:bg-white even:bg-neutral-50 hover:bg-neutral-100/70"
                >
                  {columns.map((c) => (
                    <td
                      key={String(c.key)}
                      className={`${cellPad} align-top text-neutral-800 ${c.className ?? ""}`}
                    >
                      {c.render ? c.render(r) : String(r[c.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

