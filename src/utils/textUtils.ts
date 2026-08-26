/**
 * Turkish-aware text formatting and smart corrections
 */

export function capitalizeFirstLetterTr(str: string): string {
  if (!str || str.length === 0) return '';
  return str.charAt(0).toLocaleUpperCase('tr-TR') + str.slice(1);
}

/**
 * Converts text into Turkish Sentence Case:
 * - Capitalizes start of sentences
 * - Ensures correct Turkish characters (i -> İ, ı -> I, ş, ğ, ç, ö, ü)
 * - Automatically ensures a trailing period (.)
 */
export function formatToSentenceCaseTr(input: string): string {
  if (!input) return '';
  
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Split by sentence delimiters while preserving structure
  // Handle newlines and punctuation: . ! ?
  const lines = trimmed.split('\n');
  const formattedLines = lines.map(line => {
    const lineTrimmed = line.trim();
    if (!lineTrimmed) return '';

    // Regex to find sentence starts (beginning of text or after . ! ? followed by space)
    const formattedSentence = lineTrimmed.replace(
      /(^|[.!?]\s+)([a-zçğıöşü])/gi,
      (_match, separator, letter) => {
        return separator + letter.toLocaleUpperCase('tr-TR');
      }
    );

    // Capitalize very first character just in case
    let result = capitalizeFirstLetterTr(formattedSentence);

    // Add period if ending doesn't have standard punctuation
    const lastChar = result.slice(-1);
    if (!['.', '!', '?', ':', ';'].includes(lastChar)) {
      result += '.';
    }

    return result;
  });

  return formattedLines.join('\n');
}

/**
 * Format total elapsed seconds to readable Turkish duration
 * e.g., "34 Dakika 20 Saniye" or "1 Saat 15 Dakika 45 Saniye"
 */
export function formatDurationSeconds(seconds: number): string {
  if (seconds < 0) return '0 Saniye';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs} Saat`);
  if (mins > 0 || hrs > 0) parts.push(`${mins} Dakika`);
  parts.push(`${secs} Saniye`);

  return parts.join(' ');
}

/**
 * Formats duration as digital timer string: "01:25:40" or "05:30"
 */
export function formatTimerDisplay(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Get current system time formatted as HH:mm:ss
 */
export function getCurrentTimeFormatted(): string {
  const now = new Date();
  return now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get formatted current date in Turkish
 * e.g., "25 Ağustos 2026, Salı"
 */
export function getCurrentDateFormatted(): string {
  const now = new Date();
  return now.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}
