import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  cancelDemoSearch,
  getFallbackRide,
  getCurrentRideForCustomer,
  startDemoSearch,
} from '../api/rides.js';
import '../styles/search-car.css';

export default function SearchCarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchStatus, setSearchStatus] = useState('Đang gửi yêu cầu đặt xe...');
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelledMessage =
    location.state?.cancelledMessage ||
    (searchParams.get('tripCancelled') === '1' ? 'Chuyến xe đã bị tài xế hủy.' : '');

  useEffect(() => {
    let isMounted = true;

    async function prepareSearch() {
      try {
        await startDemoSearch();
        if (isMounted) {
          setSearchStatus(
            cancelledMessage
              ? 'Chuyến trước đã hủy. Đang tiếp tục tìm tài xế mới...'
              : 'Đang chờ tài xế nhận chuyến...',
          );
        }
      } catch {
        if (isMounted) {
          setSearchStatus('Đang thử kết nối lại database để gửi yêu cầu đặt xe...');
        }
      }
    }

    async function pollAcceptedRide() {
      const fallbackRide = getFallbackRide();
      if (fallbackRide?.status === 'ongoing') {
        navigate('/ride-status', { replace: true });
        return;
      }

      try {
        const ride = await getCurrentRideForCustomer();
        if (!isMounted) return;

        if (ride?.status === 'ongoing') {
          navigate('/ride-status', { replace: true });
          return;
        }

        setSearchStatus(
          cancelledMessage
            ? 'Chuyến trước đã hủy. Đang tiếp tục tìm tài xế mới...'
            : 'Đang chờ tài xế nhận chuyến...',
        );
      } catch {
        if (isMounted) {
          setSearchStatus('Đang thử kết nối lại database để kiểm tra tài xế...');
        }
      }
    }

    prepareSearch().then(pollAcceptedRide);
    const timer = window.setInterval(pollAcceptedRide, 2500);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [cancelledMessage, navigate]);

  async function cancelSearch() {
    setIsCancelling(true);
    try {
      await cancelDemoSearch();
    } finally {
      navigate('/home');
    }
  }

  return (
    <PageShell>
      <main className="search-screen">
        <Topbar>
          <div className="location-chip" aria-label="Vị trí hiện tại">
            <span className="location-dot"></span>
            <span>Hà Nội - khu vực Hoàn Kiếm</span>
          </div>
        </Topbar>

        <section className="map-stage" aria-label="Bản đồ đặt xe">
          <div className="taxi-live taxi-one" aria-hidden="true">🚖</div>
          <div className="taxi-live taxi-two" aria-hidden="true">🚖</div>
          <div className="taxi-live taxi-three" aria-hidden="true">🚖</div>

          <div className="radar-center" aria-hidden="true">
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="user-pin"><span>📍</span></div>
          </div>

          <section className="status-card" aria-labelledby="search-title">
            <div className="status-info">
              <div className="spinner" aria-hidden="true"></div>
              <div className="text-group">
                <h1 id="search-title">Đang tìm tài xế</h1>
                <p>{searchStatus}</p>
                {cancelledMessage && (
                  <div className="cancelled-alert" role="status">
                    {cancelledMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="card-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={cancelSearch}
                disabled={isCancelling}
              >
                {isCancelling ? 'Đang hủy...' : 'Hủy tìm xe'}
              </button>
              <button className="submit-button" type="button" disabled>
                Chờ tài xế nhận
              </button>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
