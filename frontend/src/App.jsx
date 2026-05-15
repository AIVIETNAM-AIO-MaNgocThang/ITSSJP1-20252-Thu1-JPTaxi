import { Navigate, Route, Routes } from 'react-router-dom';
import AdvanceBookingPage from '../pages/AdvanceBookingPage.jsx';
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
      <Route path="/home" element={<HomePage />} />
      <Route path="/driver-home" element={<DriverHomePage />} />
      <Route path="/driver_home.html" element={<Navigate to="/driver-home" replace />} />
      <Route path="/xacnhancuocxe" element={<DriverDispatchPage />} />
      <Route path="/driver-ride-status" element={<DriverRideStatusPage />} />
      <Route path="/driver-invoice" element={<InvoicePage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:audience" element={<MessagesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register.html" element={<Navigate to="/register" replace />} />
      <Route path="/driver-register" element={<DriverRegisterPage />} />
      <Route path="/driver_register.html" element={<Navigate to="/driver-register" replace />} />
      <Route path="/driver-available" element={<DriverAvailablePage />} />
      <Route path="/driver_available.html" element={<Navigate to="/driver-available" replace />} />
      <Route path="/user-info" element={<Navigate to="/user-info/profile" replace />} />
      <Route path="/user-info/:section" element={<UserInfoPage />} />
      <Route path="/user_info.html" element={<Navigate to="/user-info" replace />} />
      <Route path="/driver-info" element={<Navigate to="/driver-info/basic" replace />} />
      <Route path="/driver-info/:section" element={<DriverInfoPage />} />
      <Route path="/driver_info.html" element={<Navigate to="/driver-info" replace />} />
      <Route path="/bill-confirm" element={<BillConfirmPage />} />
      <Route path="/bill_confirm.html" element={<Navigate to="/bill-confirm" replace />} />
      <Route path="/xacnhandatxe.html" element={<Navigate to="/bill-confirm" replace />} />
      <Route path="/search-car" element={<SearchCarPage />} />
      <Route path="/search_car.html" element={<Navigate to="/search-car" replace />} />
      <Route path="/timxe.html" element={<Navigate to="/search-car" replace />} />
      <Route path="/location-search" element={<LocationSearchPage />} />
      <Route path="/timkiemvachondiadiem.html" element={<Navigate to="/location-search" replace />} />
      <Route path="/advance-booking" element={<AdvanceBookingPage />} />
      <Route path="/dattruoc.html" element={<Navigate to="/advance-booking" replace />} />
      <Route path="/reservation-summary" element={<ReservationSummaryPage />} />
      <Route path="/test1.html" element={<Navigate to="/reservation-summary" replace />} />
      <Route path="/ride-confirm" element={<RideConfirmPage />} />
      <Route path="/Xacnhancuocxe.html" element={<Navigate to="/xacnhancuocxe" replace />} />
      <Route path="/ride-status" element={<RideStatusPage />} />
      <Route path="/trangthaicho.html" element={<Navigate to="/ride-status" replace />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/thanhtoan.html" element={<Navigate to="/payment" replace />} />
      <Route path="/invoice" element={<InvoicePage />} />
      <Route path="/xuathoadon.html" element={<Navigate to="/invoice" replace />} />
      <Route path="/driver-review" element={<DriverReviewPage />} />
      <Route path="/danhgiataixe.html" element={<Navigate to="/driver-review" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
