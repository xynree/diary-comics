import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiaryImage } from '../DiaryImage';
import { ImageModal } from '../ImageModal';
import { DiaryImage as DiaryImageType } from '@/types/diary';

// Mock Next.js Image component
let mockImageBehavior: 'load' | 'error' = 'load';

jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, priority, ...props }: React.ComponentProps<'img'> & { onLoad?: () => void; onError?: () => void; priority?: boolean }) {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (mockImageBehavior === 'error') {
          onError?.();
        } else {
          onLoad?.();
        }
      }, 10);
      return () => clearTimeout(timer);
    }, [onLoad, onError]);

    return (
      <div
        data-src={src}
        data-alt={alt}
        data-testid="diary-image"
        data-priority={priority}
        {...props}
      />
    );
  };
});

const mockImage: DiaryImageType = {
  publicId: 'diary/2021/1.1.21_1',
  filename: '1.1.21_1.jpg',
  date: new Date(2021, 0, 1),
  sequence: 1,
  secureUrl: 'https://res.cloudinary.com/test/image/upload/diary/2021/1.1.21_1.jpg',
  width: 800,
  height: 600,
  format: 'jpg',
  bytes: 150000,
  createdAt: '2021-01-01T00:00:00Z',
};

describe('DiaryImage', () => {
  it('renders image with correct props', () => {
    render(<DiaryImage image={mockImage} />);
    
    const image = screen.getByTestId('diary-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('data-src', mockImage.secureUrl);
    expect(image).toHaveAttribute('data-alt', `Diary entry from ${mockImage.filename}`);
  });



  it('calls onClick when image is clicked', () => {
    const handleClick = jest.fn();
    render(<DiaryImage image={mockImage} onClick={handleClick} />);
    
    fireEvent.click(screen.getByTestId('diary-image').parentElement!);
    expect(handleClick).toHaveBeenCalledWith(mockImage);
  });

  it('shows error state when image fails to load', async () => {
    mockImageBehavior = 'error';
    render(<DiaryImage image={mockImage} />);

    await waitFor(() => {
      expect(screen.getByText('Image unavailable')).toBeInTheDocument();
    });

    // Reset for other tests
    mockImageBehavior = 'load';
  });

  it('shows loading state initially', () => {
    render(<DiaryImage image={mockImage} />);
    
    // Loading skeleton should be present initially
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('hides loading state when image loads', async () => {
    render(<DiaryImage image={mockImage} />);
    
    const image = screen.getByTestId('diary-image');
    fireEvent.load(image);
    
    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });
});

describe('ImageModal', () => {
  it('does not render when closed', () => {
    render(<ImageModal image={mockImage} isOpen={false} onClose={jest.fn()} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<ImageModal image={mockImage} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByTestId('diary-image')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<ImageModal image={mockImage} isOpen={true} onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = jest.fn();
    render(<ImageModal image={mockImage} isOpen={true} onClose={handleClose} />);
    
    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('shows navigation buttons when provided', () => {
    const handleNext = jest.fn();
    const handlePrevious = jest.fn();
    
    render(
      <ImageModal 
        image={mockImage} 
        isOpen={true} 
        onClose={jest.fn()} 
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    );
    
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
  });

  it('calls navigation handlers when buttons are clicked', () => {
    const handleNext = jest.fn();
    const handlePrevious = jest.fn();
    
    render(
      <ImageModal 
        image={mockImage} 
        isOpen={true} 
        onClose={jest.fn()} 
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Next image'));
    expect(handleNext).toHaveBeenCalled();
    
    fireEvent.click(screen.getByLabelText('Previous image'));
    expect(handlePrevious).toHaveBeenCalled();
  });

  it('does not show navigation buttons when not provided', () => {
    render(<ImageModal image={mockImage} isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
  });


});
