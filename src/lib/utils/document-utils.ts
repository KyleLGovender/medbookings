/**
 * Extracts the original filename from a URL that follows our naming convention
 * @param url The URL of the file
 * @returns The extracted original filename
 */
export function extractFilenameFromUrl(url: string): string {
  try {
    // Get the last part of the URL path (after the last slash)
    const urlPath = new URL(url).pathname;
    const lastSegment = decodeURIComponent(urlPath.split('/').pop() || '');

    // Check if using our new naming convention with -|- separators
    if (lastSegment.includes('-|-')) {
      // Split by the -|- separator
      const parts = lastSegment.split('-|-');

      // The last part after the last -|- separator is the original filename
      if (parts.length >= 4) {
        // Decode the filename to replace %20 with spaces and other URL-encoded characters
        const encodedFilename = parts[3];
        return decodeURIComponent(encodedFilename).replace(/%20/g, ' ');
      }
    }

    // Check for older naming convention with %7C- (encoded pipe) separators
    if (lastSegment.includes('-%7C-')) {
      // Split by the %7C- separator
      const parts = lastSegment.split('-%7C-');

      // The last part after the last %7C- separator is the original filename
      if (parts.length >= 4) {
        // Decode the filename to replace %20 with spaces and other URL-encoded characters
        const encodedFilename = parts[3];
        return decodeURIComponent(encodedFilename).replace(/%20/g, ' ');
      }
    }

    // Fallback to the full last segment if we can't parse it
    return decodeURIComponent(lastSegment);
  } catch (e) {
    // If URL parsing fails, return a generic name
    return 'Existing document';
  }
}
