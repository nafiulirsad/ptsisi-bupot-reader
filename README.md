# PDF Parser for Bupot (Bukti Pemotongan/Pemungutan Unifikasi)

This Node.js script parses a structured Indonesian tax document (Bupot PDF) and extracts both raw and structured data fields into `.txt` files.

## 📄 Features

- Parses a PDF (`bupot.pdf`) using `pdf-parse`
- Cleans raw text lines and writes to `raw_result.txt`
- Extracts structured fields (e.g., H1–H5, A1–A4, B1–B12, C1–C5)
- Writes the structured result to `structured_result.txt`

## 📦 Requirements

- Node.js (v12+)
- npm

## 🔧 Installation

```bash
git clone https://github.com/your-username/pdf-bupot-parser.git
cd pdf-bupot-parser
npm install
