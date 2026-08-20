import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the title and main button', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /방치형 코딩 게임/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /코드 생성/i })).toBeInTheDocument();
  });

  it('shows the internal leaderboard and admin dashboard controls', () => {
    render(<App />);
    expect(screen.getByText(/사내 리더보드/i)).toBeInTheDocument();
    expect(screen.getByText(/관리자 대시보드/i)).toBeInTheDocument();
    expect(screen.getByText(/월간 리셋/i)).toBeInTheDocument();
  });
});
