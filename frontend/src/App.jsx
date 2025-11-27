import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Transfer from './pages/Transfer';
import BillPayment from './pages/BillPayment';
import BillerManagement from './pages/BillerManagement';
import TransactionHistory from './pages/TransactionHistory';
import AdminNotifications from './pages/AdminNotifications';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import CurrencyConverter from './pages/CurrencyConverter';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
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
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/currency-converter" element={<CurrencyConverter />} />
        </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

