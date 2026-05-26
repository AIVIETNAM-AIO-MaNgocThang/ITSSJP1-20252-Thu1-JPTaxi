import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerDriverApplication } from '../api/driverRegister.js';
import { ApiError } from '../api/client.js';
import { saveLoginAccountType } from '../utils/session.js';
import { resolveUploadUrl } from '../utils/uploadUrl.js';
import PageShell from '../components/PageShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import Topbar from '../components/Topbar.jsx';
import { emailPattern } from '../utils/loginValidation.js';
import '../styles/auth.css';
import '../styles/app-pages.css';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const documentLabels = {
  portrait: '顔写真',
  licenseFront: '免許証（表）',
  licenseBack: '免許証（裏）',
  vehiclePhoto: '車両写真',
  registrationPaper: '車検証',
};

const japaneseLevels = ['N5', 'N4', 'N3', 'N2', 'N1', 'Native'];
const licenseTypes = ['B', 'C1', 'C', 'D1', 'D2', 'D'];
const vehicleTypes = [
  { value: '4', label: '4人乗り' },
  { value: '7', label: '7人乗り' },
  { value: '9', label: '9人乗り' },
];

function FileUploadBox({ label, icon, hint, name, file, onChange }) {
  return (
    <label className="upload-box">
      {icon}
      <strong>{label}</strong>
      <span>{file ? file.name : hint}</span>
      <input
        type="file"
        name={name}
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

export default function DriverRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    gender: 'Male',
    birthDate: '',
    phone: '',
    email: '',
    password: '',
    nationality: 'Vietnam',
    idNumber: '',
    japaneseLevel: 'N3',
    licenseType: 'B',
    licenseIssueDate: '',
    licenseIssuePlace: '',
    licenseExpiryDate: '',
    vehicleType: '4',
    licensePlate: '',
    vehicleBrand: '',
    vehicleColor: '',
    manufactureYear: String(new Date().getFullYear()),
  });
  const [files, setFiles] = useState({
    portrait: null,
    licenseFront: null,
    licenseBack: null,
    vehiclePhoto: null,
    registrationPaper: null,
  });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setFile(key, file) {
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!form.lastName.trim() || !form.firstName.trim()) {
      setError('姓と名を入力してください。');
      return;
    }
    if (!emailPattern.test(form.email.trim())) {
      setError('正しいメールアドレスを入力してください。');
      return;
    }
    if (form.password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }
    if (!agree) {
      setError('利用規約への同意が必要です。');
      return;
    }

    const requiredFiles = [
      ['portrait', '顔写真'],
      ['licenseFront', '免許証（表）'],
      ['licenseBack', '免許証（裏）'],
      ['vehiclePhoto', '車両写真'],
      ['registrationPaper', '車検証'],
    ];
    for (const [key, label] of requiredFiles) {
      if (!files[key]) {
        setError(`${label}をアップロードしてください。`);
        return;
      }
      if (files[key].size > MAX_FILE_BYTES) {
        setError(`${label}は5MB以下にしてください。`);
        return;
      }
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '') body.append(key, value);
    });
    body.append('agreeToTerms', 'true');
    Object.entries(files).forEach(([key, file]) => {
      if (file) body.append(key, file);
    });

    setSubmitting(true);
    try {
      const data = await registerDriverApplication(body);
      setResult(data);
      saveLoginAccountType('driver');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '申請の送信に失敗しました。しばらくしてから再度お試しください。',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const applicationStatus = result?.application?.status ?? '未提出';
  const uploadedDocs = result?.documents
    ? Object.entries(result.documents).map(([key, path]) => ({
        key,
        label: documentLabels[key] ?? key,
        href: resolveUploadUrl(path),
      }))
    : [];

  return (
    <PageShell withFooter={false}>
      <main className="driver-register-screen">
        <Topbar
          brandTo="/home"
          actions={(
            <>
              <Link to="/home">ホーム</Link>
              <Link to="/login">ログイン</Link>
            </>
          )}
        />

        <section className="driver-register-layout">
          <div className="driver-register-intro">
            <span className="eyebrow">🚖 ドライバー登録</span>
            <h1>ドライバーとして登録し、JP TAXIで働きましょう</h1>
            <p>必要情報と書類を送信すると、すぐにログインしてご利用いただけます。</p>
          </div>

          <section className="driver-register-form-card">
            <div className="form-logo" aria-hidden="true">🚕</div>
            <div className="form-heading">
              <h2>運転者登録</h2>
              <p>書類をアップロードして申請を送信してください。</p>
            </div>

            <form className="auth-form driver-register-form" onSubmit={handleSubmit} noValidate>
              <div className="notice-box">
                現在の申請状況：<strong>{applicationStatus}</strong>
                {result?.application?.driverId != null && (
                  <>
                    <br />
                    申請ID: {result.application.driverId}
                  </>
                )}
                {result?.message && (
                  <>
                    <br />
                    {result.message}
                  </>
                )}
              </div>

              <h3 className="section-title">基本情報</h3>
              <div className="field-grid two">
                <label>
                  <span>姓</span>
                  <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} required />
                </label>
                <label>
                  <span>名</span>
                  <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} required />
                </label>
                <label>
                  <span>性別</span>
                  <select value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
                    <option value="Male">男性</option>
                    <option value="Female">女性</option>
                    <option value="Other">その他</option>
                  </select>
                </label>
                <label>
                  <span>生年月日</span>
                  <input type="date" value={form.birthDate} onChange={(e) => setField('birthDate', e.target.value)} required />
                </label>
                <label>
                  <span>電話番号</span>
                  <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
                </label>
                <label>
                  <span>メールアドレス</span>
                  <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
                </label>
                <label>
                  <span>国籍</span>
                  <input value={form.nationality} onChange={(e) => setField('nationality', e.target.value)} required />
                </label>
                <label>
                  <span>身分証番号（任意）</span>
                  <input value={form.idNumber} onChange={(e) => setField('idNumber', e.target.value)} />
                </label>
                <label>
                  <span>日本語レベル</span>
                  <select value={form.japaneseLevel} onChange={(e) => setField('japaneseLevel', e.target.value)}>
                    {japaneseLevels.map((lv) => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                </label>
              </div>

              <PasswordField
                label="パスワード"
                placeholder="6文字以上"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
              />

              <h3 className="section-title">運転免許情報</h3>
              <div className="field-grid two">
                <label>
                  <span>免許種別</span>
                  <select value={form.licenseType} onChange={(e) => setField('licenseType', e.target.value)}>
                    {licenseTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>交付日</span>
                  <input type="date" value={form.licenseIssueDate} onChange={(e) => setField('licenseIssueDate', e.target.value)} required />
                </label>
                <label>
                  <span>有効期限</span>
                  <input type="date" value={form.licenseExpiryDate} onChange={(e) => setField('licenseExpiryDate', e.target.value)} required />
                </label>
                <label>
                  <span>交付場所（任意）</span>
                  <input value={form.licenseIssuePlace} onChange={(e) => setField('licenseIssuePlace', e.target.value)} />
                </label>
              </div>

              <h3 className="section-title">車両情報</h3>
              <div className="field-grid two">
                <label>
                  <span>座席数</span>
                  <select value={form.vehicleType} onChange={(e) => setField('vehicleType', e.target.value)}>
                    {vehicleTypes.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>ナンバープレート</span>
                  <input value={form.licensePlate} onChange={(e) => setField('licensePlate', e.target.value)} required />
                </label>
                <label>
                  <span>メーカー</span>
                  <input value={form.vehicleBrand} onChange={(e) => setField('vehicleBrand', e.target.value)} required />
                </label>
                <label>
                  <span>車両カラー</span>
                  <input value={form.vehicleColor} onChange={(e) => setField('vehicleColor', e.target.value)} required />
                </label>
                <label>
                  <span>製造年</span>
                  <input type="number" min="1990" value={form.manufactureYear} onChange={(e) => setField('manufactureYear', e.target.value)} required />
                </label>
              </div>

              <h3 className="section-title">書類アップロード</h3>
              <div className="upload-grid">
                <FileUploadBox label="顔写真" icon="🧑" hint="クリックして選択" name="portrait" file={files.portrait} onChange={(f) => setFile('portrait', f)} />
                <FileUploadBox label="免許証（表）" icon="📄" hint="クリックして選択" name="licenseFront" file={files.licenseFront} onChange={(f) => setFile('licenseFront', f)} />
                <FileUploadBox label="免許証（裏）" icon="🪪" hint="クリックして選択" name="licenseBack" file={files.licenseBack} onChange={(f) => setFile('licenseBack', f)} />
                <FileUploadBox label="車両写真" icon="🚗" hint="クリックして選択" name="vehiclePhoto" file={files.vehiclePhoto} onChange={(f) => setFile('vehiclePhoto', f)} />
                <FileUploadBox label="車検証" icon="📘" hint="クリックして選択" name="registrationPaper" file={files.registrationPaper} onChange={(f) => setFile('registrationPaper', f)} />
              </div>

              <label className="terms">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>提出した情報が正確であり、ドライバー利用規約に同意します。</span>
              </label>

              <span className="field-error" aria-live="polite">{error}</span>

              {uploadedDocs.length > 0 && (
                <ul className="note-link">
                  {uploadedDocs.map((doc) => (
                    <li key={doc.key}>
                      <a href={doc.href} target="_blank" rel="noreferrer">{doc.label}</a>
                    </li>
                  ))}
                </ul>
              )}

              <div className="driver-register-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    saveLoginAccountType('driver');
                    navigate('/login?role=driver');
                  }}
                >
                  ログインへ
                </button>
                <button className="submit-button" type="submit" disabled={submitting}>
                  {submitting ? '送信中...' : '申請を送信'}
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
