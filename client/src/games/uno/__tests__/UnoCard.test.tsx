import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnoCard from '../components/UnoCard';
import { UnoCard as UnoCardType } from '../types';
import React from 'react';

describe('UnoCard', () => {
  it('should render card value', () => {
    const card: UnoCardType = { color: 'red', value: '5' };

    render(<UnoCard card={card} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render special card symbols', () => {
    const skipCard: UnoCardType = { color: 'blue', value: 'skip' };

    render(<UnoCard card={skipCard} />);

    expect(screen.getByText('⊘')).toBeInTheDocument();
  });

  it('should render +2 for draw_two', () => {
    const drawTwoCard: UnoCardType = { color: 'green', value: 'draw_two' };

    render(<UnoCard card={drawTwoCard} />);

    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should render +4 for wild_draw_four', () => {
    const wildDrawFour: UnoCardType = { color: 'wild', value: 'wild_draw_four' };

    render(<UnoCard card={wildDrawFour} />);

    expect(screen.getByText('+4')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const card: UnoCardType = { color: 'yellow', value: '7' };
    const handleClick = vi.fn();

    render(<UnoCard card={card} onClick={handleClick} />);

    await userEvent.click(screen.getByText('7'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should not call onClick when disabled', async () => {
    const card: UnoCardType = { color: 'red', value: '3' };
    const handleClick = vi.fn();

    render(<UnoCard card={card} onClick={handleClick} disabled />);

    await userEvent.click(screen.getByText('3'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
