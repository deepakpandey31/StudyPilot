const fs = require('fs');

if (fs.existsSync('docs/PROJECT_REPORT.html')) {
  let html = fs.readFileSync('docs/PROJECT_REPORT.html', 'utf8');
  html = html.replace(/<p>\\newpage<\/p>/g, '<div class="page-break"></div>');

  const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mini Project Report - StudyPilot AI</title>
    <style>
        @page {
            size: A4;
            margin: 25mm 20mm 25mm 20mm;
        }
        body {
            font-family: 'Times New Roman', Times, Georgia, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #111;
            background-color: #f1f5f9;
            margin: 0;
            padding: 30px 15px;
        }
        .report-container {
            max-width: 860px;
            margin: 0 auto;
            background: #ffffff;
            padding: 55px 50px;
            box-shadow: 0 4px 25px rgba(0,0,0,0.08);
            border-radius: 6px;
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Times New Roman', Times, Georgia, serif;
            color: #0f172a;
            font-weight: bold;
        }
        h1 {
            font-size: 20pt;
            text-align: center;
            text-transform: uppercase;
            margin-top: 1.6em;
            margin-bottom: 0.6em;
            letter-spacing: 0.5px;
        }
        h2 {
            font-size: 15pt;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 4px;
            margin-top: 2em;
            margin-bottom: 0.8em;
        }
        h3 {
            font-size: 13pt;
            margin-top: 1.4em;
            margin-bottom: 0.5em;
        }
        p {
            margin: 0.7em 0;
            text-align: justify;
        }
        ul, ol {
            margin: 0.6em 0 0.6em 25px;
        }
        li {
            margin-bottom: 0.35em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.8em 0;
            font-size: 11pt;
        }
        th, td {
            border: 1px solid #475569;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #0f172a;
        }
        tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        pre {
            background-color: #0f172a;
            color: #f8fafc;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 10pt;
            line-height: 1.45;
            margin: 1.2em 0;
        }
        code {
            font-family: 'Consolas', 'Courier New', monospace;
            background-color: #e2e8f0;
            color: #0f172a;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 10.5pt;
        }
        pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
            font-size: 9.5pt;
        }
        blockquote {
            border-left: 4px solid #3b82f6;
            margin: 1.2em 0;
            padding: 8px 18px;
            background: #eff6ff;
            color: #1e3a8a;
            font-style: italic;
        }
        hr {
            border: 0;
            border-top: 1px solid #cbd5e1;
            margin: 2em 0;
        }
        .page-break {
            page-break-after: always;
            break-after: page;
            margin-top: 2em;
            margin-bottom: 2em;
            border-top: 2px dashed #94a3b8;
            position: relative;
        }
        .page-break::after {
            content: "[ PAGE BREAK ]";
            position: absolute;
            top: -10px;
            right: 0;
            background: #ffffff;
            padding: 0 10px;
            font-size: 8pt;
            color: #64748b;
            font-family: sans-serif;
        }
        .no-print {
            text-align: center;
            margin-bottom: 25px;
            padding: 14px 20px;
            background: #e0f2fe;
            border: 1px solid #7dd3fc;
            border-radius: 6px;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .print-btn {
            background: #0284c7;
            color: white;
            border: none;
            padding: 8px 20px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 4px;
            cursor: pointer;
        }
        .print-btn:hover {
            background: #0369a1;
        }
        @media print {
            body {
                background: white;
                padding: 0;
                margin: 0;
            }
            .report-container {
                box-shadow: none;
                padding: 0;
                margin: 0;
                max-width: 100%;
            }
            .no-print {
                display: none !important;
            }
            .page-break {
                border: none !important;
                page-break-after: always !important;
                break-after: page !important;
            }
            .page-break::after {
                display: none !important;
            }
            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
                background-color: #f8fafc;
                color: #0f172a;
                border: 1px solid #cbd5e1;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="no-print">
            <span>📄 <strong>StudyPilot AI - Mini-Project Report (Ready for Submission)</strong></span>
            <button class="print-btn" onclick="window.print()">Print / Save as PDF (Ctrl + P)</button>
        </div>
        ${html}
    </div>
</body>
</html>`;

  fs.writeFileSync('docs/PROJECT_REPORT.html', styledHtml, 'utf8');
  console.log('Formatted HTML Report successfully generated at docs/PROJECT_REPORT.html');
}
