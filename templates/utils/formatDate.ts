/**
 * Format a date into a human-readable string
 * @param date - Date object, string, or timestamp to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  options: {
    format?: 'short' | 'medium' | 'long' | 'full';
    includeTime?: boolean;
    timezone?: string;
    locale?: string;
  } = {}
): string => {
  const {
    format = 'medium',
    includeTime = false,
    timezone = 'UTC',
    locale = 'en-US'
  } = options;

  // Convert input to Date object
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  // Base formatting options
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  // Set date format
  switch (format) {
    case 'short':
      formatOptions.dateStyle = 'short';
      break;
    case 'medium':
      formatOptions.dateStyle = 'medium';
      break;
    case 'long':
      formatOptions.dateStyle = 'long';
      break;
    case 'full':
      formatOptions.dateStyle = 'full';
      break;
  }

  // Add time if requested
  if (includeTime) {
    formatOptions.timeStyle = 'short';
  }

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    // Fallback to simple format if Intl.DateTimeFormat fails
    return dateObj.toLocaleDateString(locale);
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to compare against current time
 * @param locale - Locale for formatting
 * @returns Relative time string
 */
export const formatRelativeTime = (
  date: Date | string | number,
  locale: string = 'en-US'
): string => {
  const dateObj = new Date(date);
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  const absDiff = Math.abs(diffInSeconds);

  // Define time units in seconds
  const units: Array<[string, number]> = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  // Find the appropriate unit
  for (const [unit, secondsInUnit] of units) {
    if (absDiff >= secondsInUnit) {
      const value = Math.floor(absDiff / secondsInUnit);
      
      try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        return rtf.format(diffInSeconds < 0 ? -value : value, unit as Intl.RelativeTimeFormatUnit);
      } catch (error) {
        // Fallback for unsupported browsers
        const suffix = diffInSeconds < 0 ? 'ago' : 'from now';
        return `${value} ${unit}${value !== 1 ? 's' : ''} ${suffix}`;
      }
    }
  }

  return 'just now';
};