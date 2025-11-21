import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { db } from '../infra/db';

// Mock db services
vi.mock('../infra/db', () => ({
  db: {
    init: vi.fn(),
    auth: {
      getSession: vi.fn().mockReturnValue(null) // Default no user
    },
    getUsers: vi.fn().mockReturnValue([])
  }
}));

// Mock child components to avoid deep rendering issues
vi.mock('./pages/Login', () => ({
  Login: () => <div data-testid="login-page">Login Page</div>
}));

// Layout wraps children, so we need to render children
vi.mock('./components/Layout', () => ({
  Layout: ({ children }: { children: any }) => <div data-testid="layout">{children}</div>
}));

vi.mock('./pages/Dashboard', () => ({
  Dashboard: () => <div>Dashboard</div>
}));

describe('App Component', () => {
  it('redirects to login when no user is authenticated', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders dashboard for authenticated admin', async () => {
    // Setup mock for admin user
    (db.auth.getSession as any).mockReturnValue({
      id: '1',
      name: 'Admin',
      role: 'ADMIN'
    });

    render(<App />);

    await waitFor(() => {
       expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
