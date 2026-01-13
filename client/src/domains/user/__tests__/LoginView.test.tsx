import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginView from '../LoginView';

describe('LoginView', () => {
  it('renders correctly', () => {
    // onLogin is required
    render(<LoginView onLogin={vi.fn()} />);
    
    expect(screen.getByText(/萬遊引力/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/您的名字/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /進入大廳/i })).toBeDisabled();
  });

  it('enables button when username is entered', () => {
    const handleLogin = vi.fn();
    render(<LoginView onLogin={handleLogin} />);
    
    const input = screen.getByPlaceholderText(/您的名字/i);
    const button = screen.getByRole('button', { name: /進入大廳/i });

    fireEvent.change(input, { target: { value: 'TestUser' } });
    expect(button).toBeEnabled();
    
    fireEvent.click(button);
    expect(handleLogin).toHaveBeenCalledWith('TestUser');
  });
});
