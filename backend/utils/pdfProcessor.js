const pdfModule = require('pdf-parse');

/**
 * Robust cross-version parser for pdf-parse (handles function, class, or object exports)
 */
async function parsePdfBuffer(buffer) {
  if (typeof pdfModule === 'function') {
    return await pdfModule(buffer);
  }

  if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: buffer });
    if (typeof parser.load === 'function') {
      await parser.load();
    }
    const res = await parser.getText();
    return {
      text: typeof res === 'string' ? res : (res?.text || ''),
      numpages: res?.total || res?.pages?.length || 1
    };
  }

  if (typeof pdfModule.default === 'function') {
    return await pdfModule.default(buffer);
  }

  throw new Error('Unsupported pdf-parse module format');
}

/**
 * Fetches PDF buffer from a Cloudinary URL or local file path/buffer
 */
async function getPdfBuffer(fileSource) {
  if (Buffer.isBuffer(fileSource)) {
    return fileSource;
  }

  if (typeof fileSource === 'string' && fileSource.startsWith('http')) {
    let targetUrl = fileSource;
    // Swap image/upload to raw/upload if Cloudinary PDF URL
    if (fileSource.includes('/image/upload/') && fileSource.toLowerCase().includes('.pdf')) {
      targetUrl = fileSource.replace('/image/upload/', '/raw/upload/');
    }

    let res = await fetch(targetUrl);
    if (!res.ok && targetUrl !== fileSource) {
      res = await fetch(fileSource);
    }

    if (!res.ok) {
      throw new Error(`Failed to download file from URL (${res.status})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error('Invalid file source for PDF processing');
}

/**
 * Splits text into overlapping semantic chunks
 */
function splitTextIntoChunks(text, chunkSize = 1200, overlap = 150) {
  if (!text || typeof text !== 'string') return [];
  
  // Clean control characters and excessive newlines
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleanedText) return [];

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < cleanedText.length) {
      // Try to break at a paragraph or period
      const lastBreak = Math.max(
        cleanedText.lastIndexOf('\n\n', endIndex),
        cleanedText.lastIndexOf('. ', endIndex),
        cleanedText.lastIndexOf('\n', endIndex)
      );

      if (lastBreak > startIndex + chunkSize / 2) {
        endIndex = lastBreak + 1;
      }
    }

    const chunkContent = cleanedText.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 30) {
      chunks.push({
        chunkIndex,
        text: chunkContent,
        charOffset: startIndex
      });
      chunkIndex++;
    }

    startIndex = endIndex - overlap;
    if (startIndex >= cleanedText.length - 50) break;
  }

  return chunks;
}

/**
 * Extracts text and splits a PDF file into searchable chunks
 */
async function processPdfFile(fileSource) {
  try {
    const buffer = await getPdfBuffer(fileSource);
    const pdfData = await parsePdfBuffer(buffer);
    const rawText = pdfData.text || '';
    const numPages = pdfData.numpages || pdfData.total || 1;

    let chunks = [];

    if (pdfData.pages && Array.isArray(pdfData.pages) && pdfData.pages.length > 0) {
      let globalChunkIdx = 0;
      pdfData.pages.forEach((pageObj, pIdx) => {
        const pageNum = pageObj.num || (pIdx + 1);
        const pText = pageObj.text || '';
        const cList = splitTextIntoChunks(pText);
        cList.forEach(c => {
          chunks.push({
            chunkIndex: globalChunkIdx++,
            text: c.text,
            charOffset: c.charOffset,
            pageNumber: pageNum
          });
        });
      });
    } else {
      const cList = splitTextIntoChunks(rawText);
      const avgCharsPerPage = Math.max(400, Math.round(rawText.length / Math.max(1, numPages)));
      chunks = cList.map((c, i) => {
        const pageEst = Math.min(numPages, Math.max(1, Math.floor((c.charOffset || 0) / avgCharsPerPage) + 1));
        return {
          chunkIndex: i,
          text: c.text,
          charOffset: c.charOffset,
          pageNumber: pageEst
        };
      });
    }

    return {
      numPages,
      totalChunks: chunks.length,
      chunks,
      extractedTextLength: rawText.length
    };
  } catch (error) {
    console.error('PDF Processing Error:', error.message);
    return {
      numPages: 0,
      totalChunks: 0,
      chunks: [],
      error: error.message
    };
  }
}

/**
 * Relevance scoring between query terms and text chunk (Cosine / TF-IDF hybrid)
 */
function scoreChunkRelevance(query, chunkText) {
  if (!query || !chunkText) return 0;

  const normalize = (str) =>
    str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  const queryTerms = Array.from(new Set(normalize(query)));
  if (queryTerms.length === 0) return 0;

  const chunkWords = normalize(chunkText);
  if (chunkWords.length === 0) return 0;

  const chunkWordMap = new Map();
  chunkWords.forEach(w => chunkWordMap.set(w, (chunkWordMap.get(w) || 0) + 1));

  let termMatches = 0;
  let totalScore = 0;

  queryTerms.forEach(term => {
    const freq = chunkWordMap.get(term) || 0;
    if (freq > 0) {
      termMatches++;
      // Score based on term frequency and length
      totalScore += Math.min(freq, 3) * (term.length >= 4 ? 1.5 : 1.0);
    }
  });

  if (termMatches === 0) return 0;

  // Exact phrase match bonus
  const lowerQuery = query.toLowerCase().trim();
  const lowerChunk = chunkText.toLowerCase();
  if (lowerChunk.includes(lowerQuery)) {
    totalScore += 5;
  }

  const coverageRatio = termMatches / queryTerms.length;
  const finalScore = (totalScore * coverageRatio) / Math.sqrt(chunkWords.length);

  return Math.round(finalScore * 100) / 100;
}

module.exports = {
  processPdfFile,
  splitTextIntoChunks,
  scoreChunkRelevance
};
