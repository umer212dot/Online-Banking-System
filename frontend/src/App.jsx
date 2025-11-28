import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAccounts from './pages/AdminAccounts';
import Transfer from './pages/Transfer';
import BillPayment from './pages/BillPayment';
import BillerManagement from './pages/BillerManagement';
import TransactionHistory from './pages/TransactionHistory';
import AdminNotifications from './pages/AdminNotifications';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import CurrencyConverter from './pages/CurrencyConverter';
import EditProfile from './pages/EditProfile';
import AccountDetails from './pages/AccountDetails';
import Notifications from './pages/Notifications';
import CustomerSupportTicket from './pages/CustomerSupportTicket';
import AdminSupportTicket from './pages/AdminSupportTicket';

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
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/accounts" element={<AdminAccounts />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/bill-payment" element={<BillPayment />} />
            <Route path="/admin/billers" element={<BillerManagement />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/transactions" element={<TransactionHistory />} />
            <Route path="/currency-converter" element={<CurrencyConverter />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/account-details" element={<AccountDetails />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/support-tickets" element={<CustomerSupportTicket />} />
            <Route path="/admin/tickets" element={<AdminSupportTicket />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

