import { NavLink } from 'react-router-dom';

const base =
  "inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap";
const idle = "text-neutral-700 hover:bg-neutral-100";
const active = "bg-neutral-900 text-white hover:bg-neutral-900";

// Navigation bar to each Table (wow!)
export default function Nav() {
  const items = [
    { to: "/", label: "Index" },
    { to: "/customers", label: "Customers" },
    { to: "/cards", label: "Cards" },
    { to: "/listings", label: "Listings" },
    { to: "/grading-companies", label: "Grading Companies" },
    { to: "/grade-slab", label: "Grade Slab" },
    { to: "/orders", label: "Orders" },
    { to: "/order-items", label: "Order Items" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="font-semibold text-lg tracking-tight">
            PokéBase <span className="text-neutral-400">•</span>{" "}
            <span className="text-neutral-600"> A Pokémon Card DBMS</span>
          </div>

          {/* scrollable pill nav for small screens */}
          <nav className="hidden md:flex gap-1">
            {items.map((x) => (
              <NavLink
                key={x.to}
                to={x.to}
                className={({ isActive }) =>
                  `${base} ${isActive ? active : idle}`
                }
              >
                {x.label}
              </NavLink>
            ))}
          </nav>

          {/* mobile overflow */}
        </div>
        <div className="md:hidden -mx-4 border-t bg-white">
          <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
            {items.map((x) => (
              <NavLink
                key={x.to}
                to={x.to}
                className={({ isActive }) =>
                  `${base} ${isActive ? active : idle}`
                }
              >
                {x.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

