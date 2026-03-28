import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import React from 'react';

// Mock axios or other dependencies if needed
vi.mock('axios');

describe('App component', () => {
  it('renders login screen by default (when no user)', () => {
    render(<App />);
    expect(screen.getByText(/CARD BATTLE/i)).toBeInTheDocument();
  });
});
