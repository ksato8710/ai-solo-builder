'use client';

import { useEffect, useRef } from 'react';

interface ArticleContentProps {
  htmlContent: string;
}

/**
 * Detect if a table is a ranking table (first column is numeric rank)
 */
function isRankingTable(table: HTMLTableElement): boolean {
  const headers = table.querySelectorAll('thead th');
  // Ranking tables typically have 3+ columns
  if (headers.length < 3) return false;

  const rows = table.querySelectorAll('tbody tr');
  if (rows.length === 0) return false;

  let numericCount = 0;
  rows.forEach((row) => {
    const firstCell = row.querySelector('td:first-child');
    if (firstCell) {
      const text = firstCell.textContent?.trim() || '';
      // Strict: only pure numbers or numbers with rank suffix
      // Exclude years (2024年), durations (3週間), dates
      if (/^\d{1,3}(位|\.)?$/.test(text)) {
        numericCount++;
      }
    }
  });

  return numericCount > rows.length / 2;
}

/**
 * Detect if a table is a simple key-value table (exactly 2 columns)
 */
function isKeyValueTable(table: HTMLTableElement): boolean {
  const headers = table.querySelectorAll('thead th');
  if (headers.length !== 2) return false;

  const rows = table.querySelectorAll('tbody tr');
  let twoColCount = 0;
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 2) twoColCount++;
  });

  return twoColCount > rows.length * 0.8;
}

export default function ArticleContent({ htmlContent }: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const tables = contentRef.current.querySelectorAll('table');

    tables.forEach((table) => {
      // Get header labels
      const headers = table.querySelectorAll('thead th');
      const labels: string[] = [];
      headers.forEach((th) => {
        labels.push(th.textContent?.trim() || '');
      });

      // Detect table type and add appropriate class
      let tableType: 'ranking' | 'kv' | 'generic';
      if (isRankingTable(table)) {
        table.classList.add('table-ranking');
        tableType = 'ranking';
      } else if (isKeyValueTable(table)) {
        table.classList.add('table-kv');
        tableType = 'kv';
      } else {
        table.classList.add('table-generic');
        tableType = 'generic';
      }

      // Add data-label to each td
      // For generic cards, skip first cell (used as card title)
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((td, index) => {
          if (labels[index]) {
            if (tableType === 'generic' && index === 0) return;
            td.setAttribute('data-label', labels[index]);
          }
        });
      });
    });
  }, [htmlContent]);

  return (
    <div
      ref={contentRef}
      className="article-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
