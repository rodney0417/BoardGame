import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { ArrowRight } from 'lucide-react';

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
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <Card className="custom-card p-5 border-0 shadow-lg rounded-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4 fw-bold text-dark">萬遊引力 🪐</h2>
        <Form.Group className="mb-4">
          <Form.Label className="text-muted fw-bold ms-2">請輸入您的暱稱</Form.Label>
          <Form.Control
            type="text"
            size="lg"
            placeholder="您的名字..."
            value={username}
            className={`rounded-pill px-4 bg-light border-0 shadow-sm ${error ? 'is-invalid' : ''}`}
            onChange={handleChange}
            onBlur={() => validate(username)}
            onKeyPress={(e: any) => e.key === 'Enter' && !error && !isValidating && handleLoginClick()}
          />
          {error && (
            <div className="text-danger small mt-2 ms-3 fw-bold">
              ❌ {error}
            </div>
          )}
          {isValidating && !error && (
             <div className="text-muted small mt-2 ms-3">
               ⏳ 檢查中...
             </div>
          )}
        </Form.Group>
        <Button
          className="w-100 py-3 fw-bold rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
          size="lg"
          variant={error ? 'secondary' : 'primary'}
          onClick={handleLoginClick}
          disabled={!username || !!error || isValidating}
        >
          進入大廳 <ArrowRight size={20} />
        </Button>
      </Card>
    </Container>
  );
};

export default LoginView;
