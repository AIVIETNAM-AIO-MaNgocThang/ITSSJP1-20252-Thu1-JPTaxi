import { Navigate, Route, Routes } from 'react-router-dom';
import GuestRoute from '../components/GuestRoute.jsx';
import RequireAuth from '../components/RequireAuth.jsx';
import { isDriverRole } from '../utils/session.js';

function CustomerOnly({ children }) {
  return <RequireAuth role="customer">{children}</RequireAuth>;
}

function DriverOnly({ children }) {
  return <RequireAuth role="driver">{children}</RequireAuth>;
}

function MessagesAuth() {
  if (isDriverRole()) {
    return (
      <DriverOnly>
        <MessagesPage />
      </DriverOnly>
    );
  }
  return (
    <CustomerOnly>
      <MessagesPage />
    </CustomerOnly>
  );
}
import BillConfirmPage from '../pages/BillConfirmPage.jsx';
import DriverAvailablePage from '../pages/DriverAvailablePage.jsx';
import DriverDispatchPage from '../pages/DriverDispatchPage.jsx';
import DriverHomePage from '../pages/DriverHomePage.jsx';
import DriverInfoPage from '../pages/DriverInfoPage.jsx';
import DriverRegisterPage from '../pages/DriverRegisterPage.jsx';
import DriverReviewPage from '../pages/DriverReviewPage.jsx';
import DriverRideStatusPage from '../pages/DriverRideStatusPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import InvoicePage from '../pages/InvoicePage.jsx';
import LocationSearchPage from '../pages/LocationSearchPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import MessagesPage from '../pages/MessagesPage.jsx';
import PaymentPage from '../pages/PaymentPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ReservationSummaryPage from '../pages/ReservationSummaryPage.jsx';
import RideConfirmPage from '../pages/RideConfirmPage.jsx';
import RideStatusPage from '../pages/RideStatusPage.jsx';
import SearchCarPage from '../pages/SearchCarPage.jsx';
import UserInfoPage from '../pages/UserInfoPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/home"
        element={
          <RequireAuth role="customer">
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/driver-home"
        element={
          <RequireAuth role="driver">
            <DriverHomePage />
          </RequireAuth>
        }
      />
      <Route path="/driver_home.html" element={<Navigate to="/driver-home" replace />} />
      <Route
        path="/xacnhancuocxe"
        element={
          <DriverOnly>
            <DriverDispatchPage />
          </DriverOnly>
        }
      />
      <Route
        path="/driver-ride-status"
        element={
          <DriverOnly>
            <DriverRideStatusPage />
          </DriverOnly>
        }
      />
      <Route
        path="/driver-invoice"
        element={
          <DriverOnly>
            <InvoicePage />
          </DriverOnly>
        }
      />
      <Route path="/messages" element={<MessagesAuth />} />
      <Route path="/messages/:audience" element={<MessagesAuth />} />
      <Route
        path="/login"
        element={(
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        )}
      />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route
        path="/register"
        element={(
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        )}
      />
      <Route path="/register.html" element={<Navigate to="/register" replace />} />
      <Route
        path="/driver-register"
        element={(
          <GuestRoute>
            <DriverRegisterPage />
          </GuestRoute>
        )}
      />
      <Route path="/driver_register.html" element={<Navigate to="/driver-register" replace />} />
      <Route
        path="/driver-available"
        element={
          <DriverOnly>
            <DriverAvailablePage />
          </DriverOnly>
        }
      />
      <Route path="/driver_available.html" element={<Navigate to="/driver-available" replace />} />
      <Route path="/user-info" element={<Navigate to="/user-info/profile" replace />} />
      <Route
        path="/user-info/:section"
        element={
          <CustomerOnly>
            <UserInfoPage />
          </CustomerOnly>
        }
      />
      <Route path="/user_info.html" element={<Navigate to="/user-info" replace />} />
      <Route path="/driver-info" element={<Navigate to="/driver-info/basic" replace />} />
      <Route
        path="/driver-info/:section"
        element={
          <DriverOnly>
            <DriverInfoPage />
          </DriverOnly>
        }
      />
      <Route path="/driver_info.html" element={<Navigate to="/driver-info" replace />} />
      <Route
        path="/bill-confirm"
        element={
          <CustomerOnly>
            <BillConfirmPage />
          </CustomerOnly>
        }
      />
      <Route path="/bill_confirm.html" element={<Navigate to="/bill-confirm" replace />} />
      <Route path="/xacnhandatxe.html" element={<Navigate to="/bill-confirm" replace />} />
      <Route
        path="/search-car"
        element={
          <CustomerOnly>
            <SearchCarPage />
          </CustomerOnly>
        }
      />
      <Route path="/search_car.html" element={<Navigate to="/search-car" replace />} />
      <Route path="/timxe.html" element={<Navigate to="/search-car" replace />} />
      <Route
        path="/location-search"
        element={
          <CustomerOnly>
            <LocationSearchPage />
          </CustomerOnly>
        }
      />
      <Route path="/timkiemvachondiadiem.html" element={<Navigate to="/location-search" replace />} />
      <Route
        path="/reservation-summary"
        element={
          <CustomerOnly>
            <ReservationSummaryPage />
          </CustomerOnly>
        }
      />
      <Route path="/test1.html" element={<Navigate to="/reservation-summary" replace />} />
      <Route
        path="/ride-confirm"
        element={
          <CustomerOnly>
            <RideConfirmPage />
          </CustomerOnly>
        }
      />
      <Route path="/Xacnhancuocxe.html" element={<Navigate to="/xacnhancuocxe" replace />} />
      <Route
        path="/ride-status"
        element={
          <CustomerOnly>
            <RideStatusPage />
          </CustomerOnly>
        }
      />
      <Route path="/trangthaicho.html" element={<Navigate to="/ride-status" replace />} />
      <Route
        path="/payment"
        element={
          <CustomerOnly>
            <PaymentPage />
          </CustomerOnly>
        }
      />
      <Route path="/thanhtoan.html" element={<Navigate to="/payment" replace />} />
      <Route
        path="/invoice"
        element={
          <CustomerOnly>
            <InvoicePage />
          </CustomerOnly>
        }
      />
      <Route path="/xuathoadon.html" element={<Navigate to="/invoice" replace />} />
      <Route
        path="/driver-review"
        element={
          <CustomerOnly>
            <DriverReviewPage />
          </CustomerOnly>
        }
      />
      <Route path="/danhgiataixe.html" element={<Navigate to="/driver-review" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
