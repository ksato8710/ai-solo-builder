'use client';

import { useEffect, useRef } from 'react';

interface ArticleContentProps {
  htmlContent: string;
}

export default function ArticleContent({ htmlContent }: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Find all tables and add data-label attributes for mobile card layout
    const tables = contentRef.current.querySelectorAll('table');
    
    tables.forEach((table) => {
      // Get header labels
      const headers = table.querySelectorAll('thead th');
      const labels: string[] = [];
      headers.forEach((th) => {
        labels.push(th.textContent?.trim() || '');
      });

      // Add data-label to each td
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((td, index) => {
          if (labels[index]) {
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
