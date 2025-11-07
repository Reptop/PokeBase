import { NavLink } from "react-router-dom";

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
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-row">
          <div className="font-semibold text-lg tracking-tight text-neutral-100">
            PokéBase <span className="text-neutral-500"> - </span>{" "}
            <span className="text-neutral-300">A Pokémon Card DBMS</span>
          </div>

          <nav className="hidden md:flex nav-pills">
            {items.map((x) => (
              <NavLink
                key={x.to}
                to={x.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link-active" : ""}`
                }
              >
                {x.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* mobile pill bar */}
        <div className="md:hidden -mx-4 border-t border-neutral-800 bg-neutral-900">
          <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
            {items.map((x) => (
              <NavLink
                key={x.to}
                to={x.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link-active" : ""}`
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
