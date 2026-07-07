import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { login, getSession } from '../mockAuth';

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState('admin@store.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (getSession()) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = login(email, password);

    if (result.success) {
      if (setIsAuthenticated) {
        setIsAuthenticated(true);
      }
      navigate('/');
      return;
    }

    setError(result.error);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Package size={48} color="var(--brand-primary)" />
        </div>
        <h1 className="title-large" style={{ marginBottom: '0.5rem' }}>
          스마트 발주 도우미
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          목업 관리자 계정으로 로그인하세요.
        </p>

        {error && <div className="alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">이메일</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
            로그인
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          데모 계정: admin@store.com / admin123
        </p>
      </div>
    </div>
  );
}
