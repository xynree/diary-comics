import { 
  parseFilename, 
  formatDateKey, 
  formatDisplayDate, 
  getYearFromDate,
  getCloudinaryFolderPath,
  getExpectedPublicId 
} from '../dateParser';

describe('dateParser', () => {
  describe('parseFilename', () => {
    it('should parse valid filename with single digit month and day', () => {
      const result = parseFilename('1.1.21_1');
      
      expect(result.isValid).toBe(true);
      expect(result.date.getFullYear()).toBe(2021);
      expect(result.date.getMonth()).toBe(0); // January (0-indexed)
      expect(result.date.getDate()).toBe(1);
      expect(result.sequence).toBe(1);
    });

    it('should parse valid filename with double digit month and day', () => {
      const result = parseFilename('12.25.21_2');
      
      expect(result.isValid).toBe(true);
      expect(result.date.getFullYear()).toBe(2021);
      expect(result.date.getMonth()).toBe(11); // December (0-indexed)
      expect(result.date.getDate()).toBe(25);
      expect(result.sequence).toBe(2);
    });

    it('should handle year conversion correctly for years <= 30', () => {
      const result = parseFilename('1.1.25_1');
      
      expect(result.isValid).toBe(true);
      expect(result.date.getFullYear()).toBe(2025);
    });

    it('should handle year conversion correctly for years > 30', () => {
      const result = parseFilename('1.1.95_1');
      
      expect(result.isValid).toBe(true);
      expect(result.date.getFullYear()).toBe(1995);
    });

    it('should reject invalid filename format', () => {
      const result = parseFilename('invalid_filename');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid filename format');
    });

    it('should reject invalid month', () => {
      const result = parseFilename('13.1.21_1');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid month');
    });

    it('should reject invalid day', () => {
      const result = parseFilename('1.32.21_1');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid day');
    });

    it('should reject invalid sequence', () => {
      const result = parseFilename('1.1.21_0');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid sequence');
    });

    it('should handle filename with extension', () => {
      const result = parseFilename('1.1.21_1.jpg');
      
      expect(result.isValid).toBe(true);
      expect(result.date.getFullYear()).toBe(2021);
      expect(result.sequence).toBe(1);
    });
  });

  describe('formatDateKey', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2021, 0, 1); // January 1, 2021
      const result = formatDateKey(date);
      
      expect(result).toBe('2021-01-01');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2021, 8, 5); // September 5, 2021
      const result = formatDateKey(date);
      
      expect(result).toBe('2021-09-05');
    });
  });

  describe('formatDisplayDate', () => {
    it('should format date for display', () => {
      const date = new Date(2021, 0, 1); // January 1, 2021
      const result = formatDisplayDate(date);
      
      expect(result).toBe('January 1, 2021');
    });
  });

  describe('getYearFromDate', () => {
    it('should extract year from date', () => {
      const date = new Date(2021, 0, 1);
      const result = getYearFromDate(date);
      
      expect(result).toBe(2021);
    });
  });

  describe('getCloudinaryFolderPath', () => {
    it('should generate correct folder path', () => {
      const date = new Date(2021, 0, 1);
      const result = getCloudinaryFolderPath(date);
      
      expect(result).toBe('diary/2021');
    });
  });

  describe('getExpectedPublicId', () => {
    it('should generate correct public ID', () => {
      const date = new Date(2021, 0, 1);
      const result = getExpectedPublicId('1.1.21_1.jpg', date);
      
      expect(result).toBe('diary/2021/1.1.21_1');
    });

    it('should handle filename without extension', () => {
      const date = new Date(2021, 0, 1);
      const result = getExpectedPublicId('1.1.21_1', date);
      
      expect(result).toBe('diary/2021/1.1.21_1');
    });
  });
});
