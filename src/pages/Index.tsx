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
    <section>
      <h1 className="text-2xl font-bold mb-3">Project Index</h1>

      <p className="text-neutral-600 mb-4">
        Front-end pages for CS340 CRUD. We used minimal backend for routing only :)
      </p>

      <p className="text-neutral-600 mb-4">
        This page was created using Vite + React + TailWindCSS (wow!)
      </p>

      <ul className="grid md:grid-cols-2 gap-3">
        {pages.map(p => (
          <li key={p.href} className="border rounded p-3 bg-white">
            <a href={p.href} className="text-lg font-semibold hover:underline">{p.title}</a>
            <p className="text-sm text-neutral-600">{p.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

