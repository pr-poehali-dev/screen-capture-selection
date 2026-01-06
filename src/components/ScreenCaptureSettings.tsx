import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface CaptureArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenCaptureSettingsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onAreaSelect: (area: CaptureArea) => void;
  onClose: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export const ScreenCaptureSettings = ({
  videoRef,
  onAreaSelect,
  onClose,
  sensitivity,
  onSensitivityChange
}: ScreenCaptureSettingsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<CaptureArea | null>(null);

  useEffect(() => {
    drawVideo();
    const interval = setInterval(drawVideo, 100);
    return () => clearInterval(interval);
  }, [selection]);

  const drawVideo = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (selection) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.clearRect(selection.x, selection.y, selection.width, selection.height);
      ctx.drawImage(
        video,
        selection.x, selection.y, selection.width, selection.height,
        selection.x, selection.y, selection.width, selection.height
      );

      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 3;
      ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);

      const midX = selection.x + selection.width / 2;
      ctx.strokeStyle = '#0EA5E9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX, selection.y);
      ctx.lineTo(midX, selection.y + selection.height);
      ctx.stroke();

      ctx.fillStyle = '#0EA5E9';
      ctx.font = 'bold 16px IBM Plex Sans';
      ctx.fillText('АЛЬФА', selection.x + 10, selection.y + 30);

      ctx.fillStyle = '#8B5CF6';
      ctx.fillText('ОМЕГА', midX + 10, selection.y + 30);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setDragStart({ x, y });
    setSelection(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    setSelection({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const confirmSelection = () => {
    if (selection && selection.width > 50 && selection.height > 50) {
      onAreaSelect(selection);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 z-50 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Icon name="Settings" size={24} className="text-primary" />
              Настройка захвата
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base mb-3 block">
                Чувствительность распознавания: {sensitivity}%
              </Label>
              <div className="flex items-center gap-4">
                <Icon name="Volume" size={18} className="text-muted-foreground" />
                <Slider
                  value={[sensitivity]}
                  onValueChange={(values) => onSensitivityChange(values[0])}
                  min={10}
                  max={50}
                  step={5}
                  className="flex-1"
                />
                <Icon name="Volume2" size={18} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Чем выше значение, тем меньше ложных срабатываний
              </p>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base mb-3 block">
                Выделите область с колонками Альфа и Омега
              </Label>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                {!selection && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-background/90 px-6 py-4 rounded-lg text-center space-y-2">
                      <Icon name="MousePointer2" size={32} className="mx-auto text-primary" />
                      <p className="font-medium">Нажмите и перетащите для выделения области</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selection && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    {Math.round(selection.width)}×{Math.round(selection.height)}px
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Область выбрана. Левая половина = Альфа, правая = Омега
                  </p>
                </div>
                <Button onClick={confirmSelection} className="gap-2">
                  <Icon name="Check" size={18} />
                  Применить
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary rounded"></div>
              <h3 className="font-semibold">Альфа (голубой)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Левая половина выделенной области. Система ищет преобладание голубого цвета.
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <h3 className="font-semibold">Омега (фиолетовый)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Правая половина выделенной области. Система ищет преобладание фиолетового цвета.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
