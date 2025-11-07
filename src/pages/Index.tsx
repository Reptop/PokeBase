export default function Index() {
  const pages = [
    { href: '/customers', title: 'Browse & Manage Customers', desc: 'SELECT, INSERT, UPDATE, DELETE for Customers' },
    { href: '/cards', title: 'Browse & Manage Cards', desc: 'SELECT, INSERT, UPDATE, DELETE for Cards' },
    { href: '/listings', title: 'Browse & Manage Listings', desc: 'SELECT, INSERT, UPDATE, DELETE for Listings (raw & graded)' },
    { href: '/grading-companies', title: 'Manage Grading Companies', desc: 'SELECT, INSERT, UPDATE, DELETE' },
    { href: '/grade-slab', title: 'Manage Grade Slab for a Listing', desc: '1:1 slab for graded listings' },
    { href: '/orders', title: 'Browse Orders', desc: 'Order headers; items managed separately' },
    { href: '/order-items', title: 'Manage Order Items', desc: 'Composite PK (orderID, listingID)' },
  ];

  return (
    <section className="space-y-6">
      <h1 className="section-title">Project Index</h1>

      <p className="section-subtitle">
        Front-end pages for CS340 CRUD. We used minimal backend for routing only :)
      </p>

      <p className="section-subtitle">
        Built with Vite + React + Tailwind CSS.
      </p>

      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((p) => (
          <li key={p.href} className="card">
            <a href={p.href} className="block">
              <h3 className="text-lg font-semibold text-neutral-100 hover:underline">{p.title}</h3>
              <p className="mt-1 text-sm text-neutral-400">{p.desc}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

