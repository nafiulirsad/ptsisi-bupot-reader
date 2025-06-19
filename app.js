const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('bupot.pdf');

// Clean existing files
const filesToClean = ['raw_result.txt', 'structured_result.txt'];
filesToClean.forEach(file => {
    if (fs.existsSync(file)) {
        fs.writeFileSync(file, ''); // Clear content
    }
});

pdf(dataBuffer).then(function(data) {
    // 1. Save raw text
    const cleanedRawText = data.text
        .split('\n')
        .map(line => {
            const trimmed = line.trim();

            // If line contains only digits and spaces, remove all spaces
            if (/^[\d\s]+$/.test(trimmed)) {
                return trimmed.replace(/\s+/g, '');
            }

            // Otherwise, normalize spaces
            return trimmed.replace(/\s+/g, ' ');
        })
        .filter(line => line.length > 0)
        .join('\n');

    fs.writeFileSync('raw_result.txt', cleanedRawText);

    // 2. Process structured fields
    const rawText = fs.readFileSync('raw_result.txt', 'utf-8');
    const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);

    const result = {
        H1: '',
        H2: '',
        H3: '',
        H4: '',
        A1: '',
        A2: '',
        A3: '',
        A4: '',
        B1: '',
        B2: '',
        B3: '',
        B4: '',
        B5: '',
        B6: '',
        B7: '',
        B8: '',
        B9: '',
        B10: '',
        B11: '',
        B12: '',
        C1: '',
        C2: '',
        C3: '',
        C4: '',
        C5: ''
    };

    // H1
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (/^\d{10,}$/.test(line)) {
            result.H1 = line;
            break;
        }
    }

    // H2
    const h2Index = lines.findIndex(line => line === 'H.2');
    if (h2Index !== -1) {
        const isChecked = lines[h2Index + 1] === 'X';
        const pembetulanText = (lines[h2Index + 2] || '').replace(/Pembetulan Ke-\s+(\d+)/g, 'Pembetulan Ke-$1');
        if (isChecked) {
            result.H2 = `X - ${pembetulanText}`;
        }
    }

    // H3
    const h3Index = lines.findIndex(line => line === 'H.3');
    if (h3Index !== -1) {
        const isChecked = lines[h3Index + 1] === 'X';
        const h3Desc = lines[h3Index + 2] || '';
        if (isChecked) {
            result.H3 = `X - ${h3Desc}`;
        }
    }

    // H4
    const h4Index = lines.findIndex(line => line === 'H.4');
    if (h4Index !== -1) {
        const isChecked = lines[h4Index + 1] === 'X';
        const h4Desc = lines[h4Index + 2] || '';
        if (isChecked) {
            result.H4 = `X - ${h4Desc}`;
        }
    }

    // H5
    const h5Index = lines.findIndex(line => line === 'H.5');
    if (h5Index !== -1) {
        const isChecked = lines[h5Index + 1] === 'X';
        const h5Desc = lines[h5Index + 2] || '';
        if (isChecked) {
            result.H5 = `X - ${h5Desc}`;
        }
    }

    // A1
    const a1Index = lines.findIndex(line => line.startsWith('A.1'));
    for (let i = a1Index + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.startsWith('A.') && line !== ':') {
            result.A1 = line.trim();
            break;
        }
    }

    // A2
    result.A2 = '';

    // A3
    const a3Index = lines.findIndex(line => line.startsWith('A.3'));
    for (let i = a3Index + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.startsWith('A.') && line !== ':') {
            result.A3 = line.trim();
            break;
        }
    }

    // A4
    const a4Index = lines.findIndex(line => line.startsWith('A.4'));
    for (let i = a4Index + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.startsWith('A.') && line !== ':' && line !== result.A3) {
            result.A4 = line.trim();
            break;
        }
    }

    const bStartIndex = lines.findIndex(line => line.includes('B.1') && line.includes('B.2'));
    let b1ToB6Values = [];
    for (let i = bStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (
            line.trim() !== '' &&
            !/^B\.\d/.test(line) &&
            !line.startsWith('Keterangan') &&
            !line.startsWith('Dokumen') &&
            !line.startsWith('PPh')
        ) {
            b1ToB6Values.push(line.trim());
            if (b1ToB6Values.length >= 6) break;
        }
    }
    result.B1 = b1ToB6Values[0] || '';
    result.B2 = b1ToB6Values[1] || '';
    result.B3 = b1ToB6Values[2] || '';
    result.B4 = '';
    result.B5 = b1ToB6Values[3] || '';
    result.B6 = b1ToB6Values[4] || '';

    const a4Value = result.A4;
    const a4LineIndex = lines.findIndex(line => line === a4Value);

    if (a4LineIndex !== -1 && lines[a4LineIndex + 1]) {
        const rawLine = lines[a4LineIndex + 1].trim();

        // Match the expected pattern with trailing "2 4"
        const match = rawLine.match(/^(\d{3}\.\d{3}-\d{2}\.\d{8})\s*(\d)\s*(\d)$/);
        if (match) {
            const fakturCode = match[1];     // e.g. 010.006-24.22222222
            const day = match[2] + match[3]; // '2' + '4' = '24'

            const b1Match = result.B1.match(/^(\d{1,2})-(\d{4})$/);
            if (b1Match) {
                const month = b1Match[1].padStart(2, '0');
                const year = b1Match[2];
                result.B8 = `${fakturCode} ${day}-${month}-${year}`;
            } else {
                result.B8 = fakturCode; // fallback
            }
        }
    }

    const c1toC3AnchorIndex = lines.findIndex(line => line === 'Nama Wajib Pajak');
    if (c1toC3AnchorIndex !== -1) {
        let found = 0;
        for (let i = c1toC3AnchorIndex + 1; i < lines.length && found < 3; i++) {
            const line = lines[i].trim();
            if (line && line !== ':' && !/^(Tanggal|Nama Penandatangan|Pernyataan Wajib Pajak)$/.test(line)) {
                if (found === 0) result.C1 = line;
                if (found === 1) result.C2 = line;
                if (found === 2) result.C3 = line;
                found++;
            }
        }
    }

    const c5Index = lines.findIndex(line => line.startsWith('Dengan ini'));
    if (c5Index > 0) {
        // Go backward to find the last non-empty line before "Dengan ini"
        for (let i = c5Index - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line && line !== ':' && !/^dd$/.test(line) && !/^mm yyyy$/i.test(line)) {
                result.C5 = line;
                break;
            }
        }
    }

    // 3. Save structured result
    const structuredText = Object.entries(result)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

    fs.writeFileSync('structured_result.txt', structuredText);

    console.log('✅ raw_result.txt and structured_result.txt saved successfully.');
});
