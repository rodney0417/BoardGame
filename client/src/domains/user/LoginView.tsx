import React, { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { ArrowRight, Sparkles, Gamepad2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string) => void;
  onValidate: (username: string) => Promise<string | null>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onValidate }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Simple debounce ref
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const validate = async (name: string) => {
    if (!name.trim()) return;
    setIsValidating(true);
    const err = await onValidate(name);
    setError(err);
    setIsValidating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    setError(null); // Clear error on typing

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (val.trim()) {
      timeoutRef.current = setTimeout(() => {
        validate(val);
      }, 500);
    }
  };

  const handleLoginClick = async () => {
      if (!username) return;
      // Final check before submit
      const err = await onValidate(username);
      if (err) {
          setError(err);
      } else {
          onLogin(username);
      }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center w-100 vh-100"
      style={{ background: '#f0f2f5' }}
    >
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ maxWidth: '420px', width: '100%' }}>
        <Card.Body className="p-5 text-center">
            <div className="mb-4 d-inline-block p-3 rounded-circle bg-dark text-white shadow-sm">
                <Gamepad2 size={40} />
            </div>
            
            <h2 className="fw-bolder text-dark mb-2">萬遊引力</h2>
            <p className="text-secondary mb-4 small">多人連線桌遊平台</p>

            <Form.Group className="mb-4 text-start">
            <Form.Label className="text-muted fw-bold ms-2 small">您的暱稱</Form.Label>
            <Form.Control
                type="text"
                size="lg"
                placeholder="例如: 遊戲王..."
                value={username}
                className={`rounded-pill px-4 py-3 bg-light border-0 shadow-inner ${error ? 'is-invalid' : ''}`}
                style={{ fontSize: '1.1rem' }}
                onChange={handleChange}
                onBlur={() => validate(username)}
                onKeyPress={(e: any) => e.key === 'Enter' && !error && !isValidating && handleLoginClick()}
            />
            {error && (
                <div className="text-danger small mt-2 ms-3 fw-bold d-flex align-items-center gap-1">
                 <span style={{ fontSize: '1.2em' }}>⚠</span> {error}
                </div>
            )}
            {isValidating && !error && (
                <div className="text-muted small mt-2 ms-3 d-flex align-items-center gap-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status" /> 檢查中...
                </div>
            )}
            </Form.Group>

            <Button
            className="w-100 py-3 fw-bold rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2 transition-all"
            size="lg"
            variant="dark"
            onClick={handleLoginClick}
            disabled={!username || !!error || isValidating}
            style={{ transition: 'all 0.2s', transform: (!username || !!error) ? 'none' : 'scale(1)' }}
            >
            進入大廳 <ArrowRight size={20} />
            </Button>
            
            <div className="mt-4 pt-3 border-top">
                <small className="text-muted d-flex align-items-center justify-content-center gap-1">
                    <Sparkles size={14} className="text-warning" /> 
                    準備好開始了嗎？
                </small>
            </div>
        </Card.Body>
      </Card>

      <style>
        {`
            .shadow-inner {
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
            }
        `}
      </style>
    </div>
  );
};

export default LoginView;
