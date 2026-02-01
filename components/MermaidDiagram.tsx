import React, { useEffect, useRef } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({ 
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
      });
      if (containerRef.current) {
        containerRef.current.innerHTML = chart;
        window.mermaid.init(undefined, containerRef.current);
      }
    }
  }, [chart]);

  return (
    <div className="mermaid overflow-x-auto p-4 bg-slate-900 rounded-lg border border-slate-800" ref={containerRef}>
      {chart}
    </div>
  );
};