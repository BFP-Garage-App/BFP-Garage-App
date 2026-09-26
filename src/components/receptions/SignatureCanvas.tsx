import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, FileSignature } from 'lucide-react';

interface SignatureCanvasProps {
  value?: string | null;
  signerName?: string | null;
  onChange: (dataUrl: string | null) => void;
  onSignerNameChange?: (name: string) => void;
  readOnly?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  value,
  signerName = '',
  onChange,
  onSignerNameChange,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on CSS display size
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    }

    // Load existing signature if present
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = '#0f172a'; // Deep navy blue stroke
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearSignature = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  const getCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-orange-600" />
          <h4 className="text-sm font-bold text-slate-900">Signature électronique (Facultative)</h4>
        </div>
        {!readOnly && (hasDrawn || value) && (
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors font-medium"
          >
            <Eraser className="w-3.5 h-3.5" />
            Effacer la signature
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Le client ou l’atelier peut apposer sa signature sur l’écran tactile ou à la souris pour attester de l’état du véhicule.
      </p>

      {/* Signer name input */}
      {!readOnly && onSignerNameChange && (
        <div className="mb-3">
          <label className="text-[11px] font-medium text-slate-700 block mb-1">
            Nom du signataire (Facultatif)
          </label>
          <input
            type="text"
            value={signerName || ''}
            onChange={(e) => onSignerNameChange(e.target.value)}
            placeholder="Ex: M. Dupont ou BFP Atelier"
            className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          />
        </div>
      )}

      {/* Canvas Area */}
      <div className="relative border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-36 touch-none ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
        />

        {!hasDrawn && !value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400 font-mono select-none">
              Signez ici au doigt ou à la souris (Facultatif)
            </span>
          </div>
        )}

        {/* Signature watermark base line */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-300 pointer-events-none" />
      </div>

      {(hasDrawn || value) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
          <Check className="w-3.5 h-3.5" />
          <span>Signature enregistrée</span>
        </div>
      )}
    </div>
  );
};
