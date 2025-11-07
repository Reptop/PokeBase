import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Index from './pages/Index';
import Customers from './pages/Customers';
import Cards from './pages/Cards';
import Listings from './pages/Listings';
import GradingCompanies from './pages/GradingCompanies';
import GradeSlab from './pages/GradeSlab';
import Orders from './pages/Orders';
import OrderItems from './pages/OrderItems';

// forgot to do this; make sure this is always here
import './App.css';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <Nav />
      <main className="max-w-5xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/grading-companies" element={<GradingCompanies />} />
          <Route path="/grade-slab" element={<GradeSlab />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-items" element={<OrderItems />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </main>
    </div>
  );
}

