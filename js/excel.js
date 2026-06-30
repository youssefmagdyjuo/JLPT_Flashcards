/* SheetJS Excel Import/Export & Template Systems Module */

import { loadCards, saveCards, getDuplicate } from './storage.js';

// Setup structures for expected headers
const SHEET_HEADERS = {
  hiragana: ['English', 'Japanese', 'Pronunciation', 'JLPT Level', 'Notes'],
  katakana: ['English', 'Japanese', 'Pronunciation', 'JLPT Level', 'Notes'],
  verbs: ['English', 'Japanese', 'Pronunciation', 'JLPT Level', 'Notes'],
  sentences: ['English', 'Japanese', 'Pronunciation', 'Translation', 'JLPT Level', 'Notes'],
  kanji: ['Kanji', 'Meaning', 'On Reading', 'Kun Reading', 'Pronunciation', 'JLPT Level', 'Example Sentence', 'Example Translation', 'Notes']
};

// Simple sample data for the template
const TEMPLATE_SAMPLES = {
  hiragana: [['A', 'あ', 'a', 'N5', 'First character in Hiragana syllabary.']],
  katakana: [['KA', 'カ', 'ka', 'N5', 'Katakana character for KA.']],
  verbs: [['To eat', '食べる', 'たべる (taberu)', 'N5', 'Ru-verb (Group 2 verb)']],
  sentences: [['I like Japanese language.', '日本語が好きです。', 'にほんごがسكي ديسو (nihongo ga suki desu)', 'I like Japanese.', 'N5', 'Uses particle ga']],
  kanji: [['水', 'Water', 'スイ (sui)', 'みず (mizu)', 'みず (mizu)', 'N5', '水道 (すいどう)', 'Tap water', 'Radical is water']]
};

// Auto-size columns helper
function fitToColumn(ws, aoaData) {
  if (!aoaData || aoaData.length === 0) return;
  const colWidths = [];
  
  // Initialize widths based on headers
  for (let c = 0; c < aoaData[0].length; c++) {
    colWidths[c] = 10; // min width
  }
  
  // Calculate max length in each column
  for (let r = 0; r < aoaData.length; r++) {
    for (let c = 0; c < aoaData[r].length; c++) {
      const val = aoaData[r][c];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        // Estimate width (Japanese characters take double width)
        let len = 0;
        for (let i = 0; i < strVal.length; i++) {
          len += strVal.charCodeAt(i) > 255 ? 2 : 1;
        }
        colWidths[c] = Math.max(colWidths[c], len + 2); // padding
      }
    }
  }
  
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
}

// Download Excel Template
export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();
  
  // Hiragana
  const hAOA = [SHEET_HEADERS.hiragana, ...TEMPLATE_SAMPLES.hiragana];
  const hWS = XLSX.utils.aoa_to_sheet(hAOA);
  fitToColumn(hWS, hAOA);
  XLSX.utils.book_append_sheet(wb, hWS, 'Hiragana');
  
  // Katakana
  const kAOA = [SHEET_HEADERS.katakana, ...TEMPLATE_SAMPLES.katakana];
  const kWS = XLSX.utils.aoa_to_sheet(kAOA);
  fitToColumn(kWS, kAOA);
  XLSX.utils.book_append_sheet(wb, kWS, 'Katakana');
  
  // Verbs
  const verbsAOA = [SHEET_HEADERS.verbs, ...TEMPLATE_SAMPLES.verbs];
  const verbsWS = XLSX.utils.aoa_to_sheet(verbsAOA);
  fitToColumn(verbsWS, verbsAOA);
  XLSX.utils.book_append_sheet(wb, verbsWS, 'Verbs');
  
  // Sentences
  const sentencesAOA = [SHEET_HEADERS.sentences, ...TEMPLATE_SAMPLES.sentences];
  const sentencesWS = XLSX.utils.aoa_to_sheet(sentencesAOA);
  fitToColumn(sentencesWS, sentencesAOA);
  XLSX.utils.book_append_sheet(wb, sentencesWS, 'Sentences');
  
  // Kanji
  const kanjiAOA = [SHEET_HEADERS.kanji, ...TEMPLATE_SAMPLES.kanji];
  const kanjiWS = XLSX.utils.aoa_to_sheet(kanjiAOA);
  fitToColumn(kanjiWS, kanjiAOA);
  XLSX.utils.book_append_sheet(wb, kanjiWS, 'Kanji');
  
  XLSX.writeFile(wb, 'JLPT_Flashcards_Template.xlsx');
}

// Export Flashcards to Excel Workbook
export function exportExcel(scope = 'all') {
  const cards = loadCards();
  let filtered = cards;
  
  if (scope === 'favorites') {
    filtered = cards.filter(c => c.favorite);
  } else if (scope !== 'all') {
    filtered = cards.filter(c => c.type === scope);
  }
  
  const wb = XLSX.utils.book_new();
  
  // Split into categories
  const hiragana = filtered.filter(c => c.type === 'hiragana');
  const katakana = filtered.filter(c => c.type === 'katakana');
  const verbs = filtered.filter(c => c.type === 'verb');
  const sentences = filtered.filter(c => c.type === 'sentence');
  const kanji = filtered.filter(c => c.type === 'kanji');
  
  // Helper to map card objects to array row structure
  const buildSheet = (items, category, headers) => {
    // If exporting a single specific category and this isn't it, skip it.
    if (scope !== 'all' && scope !== 'favorites' && scope !== category) return;
    
    const rows = items.map(c => {
      if (category === 'verb' || category === 'hiragana' || category === 'katakana') {
        return [c.english || '', c.japanese || '', c.pronunciation || '', c.jlpt || '', c.notes || ''];
      } else if (category === 'sentence') {
        return [c.english || '', c.japanese || '', c.pronunciation || '', c.translation || '', c.jlpt || '', c.notes || ''];
      } else if (category === 'kanji') {
        return [
          c.kanji || '', c.meaning || '', c.onyomi || '', c.kunyomi || '',
          c.pronunciation || '', c.jlpt || '', c.example || '', c.translation || '', c.notes || ''
        ];
      }
    });
    
    const sheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    fitToColumn(ws, sheetData);
    
    let sheetName = category.charAt(0).toUpperCase() + category.slice(1);
    if (category === 'verb' || category === 'sentence') {
      sheetName += 's';
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };
  
  buildSheet(hiragana, 'hiragana', SHEET_HEADERS.hiragana);
  buildSheet(katakana, 'katakana', SHEET_HEADERS.katakana);
  buildSheet(verbs, 'verb', SHEET_HEADERS.verbs);
  buildSheet(sentences, 'sentence', SHEET_HEADERS.sentences);
  buildSheet(kanji, 'kanji', SHEET_HEADERS.kanji);
  
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `JLPT_Flashcards_${today}.xlsx`);
}

// Read and Parse Uploaded Excel File
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const parsedData = {
          totalCount: 0,
          records: [], // items of structure { category, rowNumber, isValid, errors: [], data: {} }
        };
        
        const processSheet = (sheetName, type, headers) => {
          const ws = workbook.Sheets[sheetName];
          if (!ws) return;
          
          // Read rows as array of arrays, including headers
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (rows.length <= 1) return; // just headers or empty
          
          const fileHeaders = rows[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, ''));
          
          for (let i = 1; i < rows.length; i++) {
            const rawRow = rows[i];
            
            // Check if completely empty row
            if (rawRow.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
              continue;
            }
            
            const recordData = {};
            const errors = [];
            
            // Map columns by matching header strings
            headers.forEach((h) => {
              const targetNorm = h.toLowerCase().replace(/\s+/g, '');
              const colIdx = fileHeaders.indexOf(targetNorm);
              const val = colIdx !== -1 && rawRow[colIdx] !== undefined ? String(rawRow[colIdx]).trim() : '';
              
              // Assign property names matching data structures
              let key = targetNorm;
              if (key === 'meaning') key = 'meaning';
              if (key === 'onreading') key = 'onyomi';
              if (key === 'kunreading') key = 'kunyomi';
              if (key === 'examplesentence') key = 'example';
              if (key === 'exampletranslation') key = 'translation';
              if (key === 'jlptlevel') key = 'jlpt';
              if (key === 'translationnotes') key = 'translation';
              
              recordData[key] = val;
              
              // Validation: required fields depending on category
              if (type === 'verb' || type === 'hiragana' || type === 'katakana') {
                if ((key === 'english' || key === 'japanese' || key === 'pronunciation' || key === 'jlpt') && !val) {
                  errors.push(`Missing field: ${h}`);
                }
              } else if (type === 'sentence') {
                if ((key === 'english' || key === 'japanese' || key === 'pronunciation' || key === 'jlpt') && !val) {
                  errors.push(`Missing field: ${h}`);
                }
              } else if (type === 'kanji') {
                if ((key === 'kanji' || key === 'meaning' || key === 'jlpt') && !val) {
                  errors.push(`Missing field: ${h}`);
                }
              }
            });
            
            parsedData.records.push({
              category: type,
              rowNumber: i + 1,
              sheetName: sheetName,
              isValid: errors.length === 0,
              errors: errors,
              data: {
                type: type,
                ...recordData
              }
            });
          }
        };
        
        processSheet('Hiragana', 'hiragana', SHEET_HEADERS.hiragana);
        processSheet('Katakana', 'katakana', SHEET_HEADERS.katakana);
        processSheet('Verbs', 'verb', SHEET_HEADERS.verbs);
        processSheet('Sentences', 'sentence', SHEET_HEADERS.sentences);
        processSheet('Kanji', 'kanji', SHEET_HEADERS.kanji);
        
        parsedData.totalCount = parsedData.records.length;
        resolve(parsedData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Perform final Excel import and apply duplication strategy
export function executeImport(records, strategy = 'skip') {
  const currentCards = loadCards();
  const summary = {
    total: records.length,
    imported: 0,
    skipped: 0,
    replaced: 0,
    failed: 0
  };
  
  const updatedCards = [...currentCards];
  
  records.forEach(rec => {
    if (!rec.isValid) {
      summary.failed++;
      return;
    }
    
    const incoming = rec.data;
    const existing = getDuplicate(incoming, updatedCards);
    
    if (existing) {
      if (strategy === 'skip') {
        summary.skipped++;
      } else if (strategy === 'replace') {
        // Overwrite fields in place
        Object.assign(existing, incoming);
        existing.createdAt = Date.now(); // update timestamp
        summary.replaced++;
      } else if (strategy === 'keep') {
        // Generate new ID and append
        const newCard = {
          ...incoming,
          id: 'card-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          favorite: false,
          createdAt: Date.now()
        };
        updatedCards.push(newCard);
        summary.imported++;
      }
    } else {
      // Normal insert
      const newCard = {
        ...incoming,
        id: 'card-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        favorite: false,
        createdAt: Date.now()
      };
      updatedCards.push(newCard);
      summary.imported++;
    }
  });
  
  saveCards(updatedCards);
  return summary;
}
