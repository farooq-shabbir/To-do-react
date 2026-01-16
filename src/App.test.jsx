import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App.jsx';

describe('App Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it('should render heading or main content', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeDefined();
  });
});