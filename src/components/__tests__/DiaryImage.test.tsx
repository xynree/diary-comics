import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiaryImage, ImageModal } from '../DiaryImage';
import { DiaryImage as DiaryImageType } from '@/types/diary';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        data-testid="diary-image"
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
    expect(image).toHaveAttribute('src', mockImage.secureUrl);
    expect(image).toHaveAttribute('alt', `Diary entry from ${mockImage.filename}`);
  });

  it('shows sequence indicator for images with sequence > 1', () => {
    const imageWithSequence = { ...mockImage, sequence: 3 };
    render(<DiaryImage image={imageWithSequence} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show sequence indicator for first image', () => {
    render(<DiaryImage image={mockImage} />);
    
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('calls onClick when image is clicked', () => {
    const handleClick = jest.fn();
    render(<DiaryImage image={mockImage} onClick={handleClick} />);
    
    fireEvent.click(screen.getByTestId('diary-image').parentElement!);
    expect(handleClick).toHaveBeenCalledWith(mockImage);
  });

  it('shows error state when image fails to load', async () => {
    render(<DiaryImage image={mockImage} />);
    
    const image = screen.getByTestId('diary-image');
    fireEvent.error(image);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      expect(screen.getByText(mockImage.filename)).toBeInTheDocument();
    });
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
    expect(screen.getByText(mockImage.filename)).toBeInTheDocument();
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

  it('displays image metadata', () => {
    render(<ImageModal image={mockImage} isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText(mockImage.filename)).toBeInTheDocument();
    expect(screen.getByText(`${mockImage.width} × ${mockImage.height} • ${Math.round(mockImage.bytes / 1024)}KB`)).toBeInTheDocument();
  });
});
