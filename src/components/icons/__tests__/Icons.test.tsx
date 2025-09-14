import { render } from '@testing-library/react';
import {
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  ArrowRightIcon,
  CarouselLeftIcon,
  CarouselRightIcon,
  InstagramIcon,
  GitHubIcon,
} from '../Icons';

describe('Icons', () => {
  describe('CloseIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<CloseIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-8', 'h-8');
    });

    it('renders with custom className', () => {
      const { container } = render(<CloseIcon className="w-4 h-4 text-red-500" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('w-4', 'h-4', 'text-red-500');
    });

    it('renders with custom size', () => {
      const { container } = render(<CloseIcon size={16} />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });
  });

  describe('ChevronLeftIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<ChevronLeftIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-8', 'h-8');
    });
  });

  describe('ChevronRightIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<ChevronRightIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-8', 'h-8');
    });
  });

  describe('ImageIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<ImageIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-4', 'h-4');
    });
  });

  describe('ExclamationTriangleIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<ExclamationTriangleIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-16', 'h-16');
    });
  });

  describe('PhotoIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<PhotoIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-16', 'h-16');
    });
  });

  describe('ArrowRightIcon', () => {
    it('renders with default props', () => {
      const { container } = render(<ArrowRightIcon />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

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

  describe('Icon consistency', () => {
    it('all icons have proper SVG structure', () => {
      const strokeIcons = [
        CloseIcon,
        ChevronLeftIcon,
        ChevronRightIcon,
        ImageIcon,
        ExclamationTriangleIcon,
        PhotoIcon,
        ArrowRightIcon,
        CarouselLeftIcon,
        CarouselRightIcon,
      ];

      const fillIcons = [
        InstagramIcon,
        GitHubIcon,
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
