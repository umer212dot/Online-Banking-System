import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Transfer from './pages/Transfer';
import BillPayment from './pages/BillPayment';
import BillerManagement from './pages/BillerManagement';
import { AuthProvider } from './context/AuthContext';
import CurrencyConverter from './pages/CurrencyConverter';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/bill-payment" element={<BillPayment />} />
          <Route path="/admin/billers" element={<BillerManagement />} />
          <Route path="/currency-converter" element={<CurrencyConverter />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

