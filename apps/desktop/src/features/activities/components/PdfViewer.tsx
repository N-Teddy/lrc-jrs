import {
  CaretLeft,
  CaretRight,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  WarningCircle,
} from '@phosphor-icons/react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Configure PDF.js worker via Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfViewerProps {
  url: string;
  onLoaded?: () => void;
  onError?: (err: any) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  onLoaded,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isRendering, setIsRendering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load document
  useEffect(() => {
    let isCancelled = false;
    setLoadError(null);
    setCurrentPage(1);

    const loadingTask = pdfjsLib.getDocument({
      url,
      withCredentials: false,
    });

    loadingTask.promise
      .then((doc) => {
        if (isCancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        onLoaded?.();
      })
      .catch((err) => {
        if (isCancelled) return;
        setLoadError(err.message || 'Failed to load PDF document');
        onError?.(err);
      });

    return () => {
      isCancelled = true;
      loadingTask.destroy();
    };
  }, [url, onLoaded, onError]);

  // Render current page onto canvas
  const renderPage = useCallback(
    async (pageNumber: number, currentScale: number) => {
      if (!pdfDoc || !canvasRef.current) return;
      setIsRendering(true);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: currentScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined;

        const renderContext = {
          canvasContext: context,
          transform,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PDF page render error:', err);
        }
      } finally {
        setIsRendering(false);
      }
    },
    [pdfDoc],
  );

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage, scale);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-3 bg-white rounded-2xl border border-[#e8e1dd] max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
          <WarningCircle size={24} weight="fill" />
        </div>
        <h4 className="text-sm font-bold text-[#1e1b19]">
          Unable to render PDF document
        </h4>
        <p className="text-xs text-[#8a726a]">{loadError}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-[#2a2624] overflow-hidden"
    >
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-20 px-4 py-2 bg-[#1e1b19]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-3 text-white">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1 || isRendering}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Previous Page"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <span className="text-xs font-semibold px-2 text-white/90">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages || isRendering}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Next Page"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={scale <= 0.6 || isRendering}
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Zoom Out"
          >
            <MagnifyingGlassMinus size={16} weight="bold" />
          </button>
          <span className="text-xs font-mono px-2 text-white/80">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            disabled={scale >= 2.4 || isRendering}
            onClick={() => setScale((s) => Math.min(2.4, s + 0.2))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Zoom In"
          >
            <MagnifyingGlassPlus size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 w-full overflow-auto flex items-start justify-center p-6">
        <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
          <canvas ref={canvasRef} className="block" />
        </div>
      </div>
    </div>
  );
};
