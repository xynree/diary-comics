import { render } from '@testing-library/react';
import {
  CarouselLeftIcon,
  CarouselRightIcon,
  InstagramIcon,
  GitHubIcon,
  EmailIcon,
} from '../Icons';

describe('Icons', () => {

  describe('CarouselLeftIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<CarouselLeftIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-6', 'h-6');
    });
  });

  describe('CarouselRightIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<CarouselRightIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-6', 'h-6');
    });
  });

  describe('InstagramIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<InstagramIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('GitHubIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<GitHubIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('EmailIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<EmailIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Icon consistency', () => {
    it('all icons have proper SVG structure', () => {
      const strokeIcons = [
        CarouselLeftIcon,
        CarouselRightIcon,
      ];

      const fillIcons = [
        InstagramIcon,
        GitHubIcon,
        EmailIcon,
      ];

      // Test stroke-based icons
      strokeIcons.forEach((IconComponent) => {
        const { container, unmount } = render(<IconComponent />);
        const icon = container.querySelector('svg');

        expect(icon?.tagName).toBe('svg');
        expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
        expect(icon).toHaveAttribute('fill', 'none');
        expect(icon).toHaveAttribute('stroke', 'currentColor');

        unmount();
      });

      // Test fill-based icons
      fillIcons.forEach((IconComponent) => {
        const { container, unmount } = render(<IconComponent />);
        const icon = container.querySelector('svg');

        expect(icon?.tagName).toBe('svg');
        expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
        expect(icon).toHaveAttribute('fill', 'currentColor');

        unmount();
      });
    });
  });
});
