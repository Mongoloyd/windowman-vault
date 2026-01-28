/**
 * File Hashing Utilities
 * 
 * SHA-256 hashing for file deduplication and integrity verification.
 * Uses streaming approach for large files to avoid memory issues.
 */

/**
 * Calculate SHA-256 hash of a file
 * Uses chunked reading for large files
 */
export async function hashFile(file: File): Promise<string> {
  // For small files (< 10MB), read all at once
  if (file.size < 10 * 1024 * 1024) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return bufferToHex(hashBuffer);
  }

  // For large files, use chunked reading
  return hashFileChunked(file);
}

/**
 * Hash large files in chunks to avoid memory issues
 */
async function hashFileChunked(file: File): Promise<string> {
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
  const chunks: ArrayBuffer[] = [];
  
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();
    chunks.push(buffer);
    offset += CHUNK_SIZE;
  }

  // Concatenate all chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let position = 0;
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), position);
    position += chunk.byteLength;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return bufferToHex(hashBuffer);
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Quick hash for deduplication check (first 1MB only)
 * Faster than full hash, good enough for detecting duplicates
 */
export async function quickHash(file: File): Promise<string> {
  const SAMPLE_SIZE = 1024 * 1024; // 1MB
  const sample = file.slice(0, Math.min(file.size, SAMPLE_SIZE));
  const buffer = await sample.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}
