import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';

interface LoginViewProps {
  onLogin: (username: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <Card className="custom-card p-5" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4 fw-bold text-primary">萬遊引力 🪐</h2>
        <Form.Group className="mb-4">
          <Form.Label className="text-muted fw-bold">請輸入您的暱稱</Form.Label>
          <Form.Control
            type="text"
            size="lg"
            placeholder="您的名字..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e: any) => e.key === 'Enter' && username && onLogin(username)}
          />
        </Form.Group>
        <Button
          className="w-100 py-3 fw-bold rounded-pill"
          size="lg"
          onClick={() => onLogin(username)}
          disabled={!username}
        >
          進入大廳
        </Button>
      </Card>
    </Container>
  );
};

export default LoginView;
