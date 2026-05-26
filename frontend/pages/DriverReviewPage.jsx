import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { getReviewContext, submitTripRating } from '../api/ratings.js';
import { ApiError } from '../api/client.js';
import { getLastInvoiceTripId } from '../utils/invoiceSession.js';
import { getAuthToken } from '../utils/session.js';
import { resolveUploadUrl } from '../utils/uploadUrl.js';
import '../styles/app-pages.css';

const TAGS = ['丁寧な対応', '安全運転', '車内が清潔', 'ルートが最適', '日本語が堪能'];
const DEMO_TRIP_ID = 1;

const SCORE_LABELS = {
  1: '不満',
  2: '改善が必要',
  3: '普通',
  4: 'とても良い',
  5: '素晴らしい!',
};

function resolveTripId(searchParams) {
  const fromQuery = searchParams.get('tripId');
  if (fromQuery) {
    const n = Number(fromQuery);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return getLastInvoiceTripId() ?? DEMO_TRIP_ID;
}

function driverInitial(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1]?.charAt(0) || '—';
}

export default function DriverReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = resolveTripId(searchParams);

  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [score, setScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const loadContext = useCallback(async () => {
    if (!getAuthToken()) {
      setError('ログインしてから評価してください。');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getReviewContext(tripId);
      setContext(data);
      if (data.existingRating) {
        setHasExisting(true);
        setScore(data.existingRating.score);
        setSelectedTags(data.existingRating.tags ?? []);
        setComment(data.existingRating.comment ?? '');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const scoreLabel = useMemo(
    () => SCORE_LABELS[score] ?? SCORE_LABELS[5],
    [score],
  );

  function toggleTag(tag) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!context?.canRate) {
      setError('この乗車はまだ評価できません。');
      return;
    }
    setSubmitting(true);
    setError('');
    const payload = {
      score,
      tags: selectedTags,
      comment: comment.trim() || undefined,
    };
    try {
      await submitTripRating(tripId, payload, { update: hasExisting });
      navigate('/home');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          await submitTripRating(tripId, payload, { update: true });
          navigate('/home');
          return;
        } catch (retryErr) {
          setError(retryErr instanceof ApiError ? retryErr.message : '送信に失敗しました。');
        }
      } else {
        setError(err instanceof ApiError ? err.message : '送信に失敗しました。');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const driver = context?.driver;
  const vehicleLine = driver?.vehicle
    ? `${driver.vehicle.brand} • ${driver.vehicle.licensePlate}`
    : '—';
  const avatarSrc = resolveUploadUrl(driver?.avatarUrl);

  return (
    <PageShell withFooter={false}>
      <main className="review-screen">
        <section className="rating-window">
          <header className="review-topbar">
            <Link to="/home">×</Link>
            <strong>フィードバック</strong>
            <button type="submit" form="driver-review-form" disabled={submitting || loading}>
              {submitting ? '…' : '送信'}
            </button>
          </header>

          {loading && <p className="invoice-status">読み込み中…</p>}
          {error && (
            <p className="form-error invoice-status" role="alert">
              {error}
            </p>
          )}

          {!loading && context && (
            <form id="driver-review-form" className="review-content" onSubmit={handleSubmit}>
              <DriverAvatar driver={driver} avatarSrc={avatarSrc} />

              <h1>{driver?.name ?? '—'}</h1>
              <p>{vehicleLine}</p>

              <section className="review-rating">
                <strong>今回の乗車はいかがでしたか？</strong>
                <div className="review-stars" aria-label={`${score} stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={star <= score ? 'active' : ''}
                      aria-pressed={star <= score}
                      onClick={() => setScore(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span>{scoreLabel}</span>
              </section>

              <section className="review-tags">
                <strong>良かった点（複数選択可）</strong>
                <TagRow tags={TAGS} selected={selectedTags} onToggle={toggleTag} />
              </section>

              <textarea
                className="review-comment"
                placeholder="ドライバーへのメッセージ（任意）"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />

              <button className="review-submit" type="submit" disabled={submitting}>
                {submitting ? '送信中…' : hasExisting ? '評価を更新する' : '評価を送信する'}
              </button>
            </form>
          )}
        </section>
      </main>
    </PageShell>
  );
}

function DriverAvatar({ driver, avatarSrc }) {
  return (
    <div className="driver-avatar-ring">
      {avatarSrc ? (
        <img className="review-driver-avatar-img" src={avatarSrc} alt="" />
      ) : (
        <div className="review-driver-avatar">{driverInitial(driver?.name)}</div>
      )}
    </div>
  );
}

function TagRow({ tags, selected, onToggle }) {
  return (
    <div>
      {tags.map((tag) => (
        <button
          className={selected.includes(tag) ? 'selected' : ''}
          type="button"
          key={tag}
          onClick={() => onToggle(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
