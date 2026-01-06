import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ScreenCaptureSettings } from '@/components/ScreenCaptureSettings';
import { AccuracyChart } from '@/components/AccuracyChart';
import { ExportStats } from '@/components/ExportStats';

type Result = 'alpha' | 'omega';

interface HistoryEntry {
  id: number;
  result: Result;
  timestamp: Date;
}

interface PredictionMethod {
  name: string;
  predict: (history: HistoryEntry[]) => Result;
  accuracy: number;
  predictions: number;
  correct: number;
}

interface CaptureArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Index = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<Result | null>(null);
  const [bestMethod, setBestMethod] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureArea, setCaptureArea] = useState<CaptureArea | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(30);
  const [lastDetected, setLastDetected] = useState<{ result: Result; time: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [methods, setMethods] = useState<PredictionMethod[]>([
    {
      name: 'Частотный анализ',
      predict: (hist) => {
        const alphaCount = hist.filter(h => h.result === 'alpha').length;
        const omegaCount = hist.filter(h => h.result === 'omega').length;
        return alphaCount > omegaCount ? 'alpha' : 'omega';
      },
      accuracy: 0,
      predictions: 0,
      correct: 0
    },
    {
      name: 'Последние 5 значений',
      predict: (hist) => {
        const last5 = hist.slice(-5);
        const alphaCount = last5.filter(h => h.result === 'alpha').length;
        return alphaCount > 2 ? 'omega' : 'alpha';
      },
      accuracy: 0,
      predictions: 0,
      correct: 0
    },
    {
      name: 'Паттерн-анализ',
      predict: (hist) => {
        if (hist.length < 3) return 'alpha';
        const last3 = hist.slice(-3).map(h => h.result);
        if (last3.every(r => r === 'alpha')) return 'omega';
        if (last3.every(r => r === 'omega')) return 'alpha';
        return last3[last3.length - 1] === 'alpha' ? 'omega' : 'alpha';
      },
      accuracy: 0,
      predictions: 0,
      correct: 0
    },
    {
      name: 'Вероятностная модель',
      predict: (hist) => {
        if (hist.length < 2) return 'alpha';
        const transitions = { alphaAlpha: 0, alphaOmega: 0, omegaAlpha: 0, omegaOmega: 0 };
        for (let i = 0; i < hist.length - 1; i++) {
          const current = hist[i].result;
          const next = hist[i + 1].result;
          if (current === 'alpha' && next === 'alpha') transitions.alphaAlpha++;
          if (current === 'alpha' && next === 'omega') transitions.alphaOmega++;
          if (current === 'omega' && next === 'alpha') transitions.omegaAlpha++;
          if (current === 'omega' && next === 'omega') transitions.omegaOmega++;
        }
        const last = hist[hist.length - 1].result;
        if (last === 'alpha') {
          return transitions.alphaOmega > transitions.alphaAlpha ? 'omega' : 'alpha';
        } else {
          return transitions.omegaAlpha > transitions.omegaOmega ? 'alpha' : 'omega';
        }
      },
      accuracy: 0,
      predictions: 0,
      correct: 0
    }
  ]);

  useEffect(() => {
    if (history.length > 0) {
      makePrediction();
    }
  }, [history]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring && captureArea) {
      interval = setInterval(() => {
        analyzeScreen();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, captureArea]);

  const makePrediction = () => {
    const updatedMethods = methods.map(method => {
      const prediction = method.predict(history);
      return { ...method, lastPrediction: prediction };
    });

    const bestMethodObj = updatedMethods.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );

    setCurrentPrediction(bestMethodObj.lastPrediction as Result);
    setBestMethod(bestMethodObj.name);
    setMethods(updatedMethods);
  };

  const startScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' as any }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsCapturing(true);
      toast({
        title: "Захват экрана активен",
        description: "Выделите область с колонками Альфа и Омега"
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось начать захват экрана",
        variant: "destructive"
      });
    }
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const handleAreaSelect = (area: CaptureArea) => {
    setCaptureArea(area);
    setIsMonitoring(true);
    setShowSettings(false);
    
    toast({
      title: "Мониторинг запущен",
      description: "Система начала автоматическое распознавание результатов"
    });
  };

  const analyzeScreen = async () => {
    if (!videoRef.current || !canvasRef.current || !captureArea) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = captureArea.width;
    canvas.height = captureArea.height;
    
    ctx.drawImage(
      video,
      captureArea.x, captureArea.y,
      captureArea.width, captureArea.height,
      0, 0,
      captureArea.width, captureArea.height
    );
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const leftHalf = ctx.getImageData(0, 0, canvas.width / 2, canvas.height);
    const rightHalf = ctx.getImageData(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    
    const leftBlue = analyzeColorDominance(leftHalf, 'blue');
    const rightPurple = analyzeColorDominance(rightHalf, 'purple');
    
    const threshold = sensitivity / 100;
    
    if (leftBlue > rightPurple && leftBlue > threshold) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU');
      setLastDetected({ result: 'alpha', time: timeStr });
      addResult('alpha');
    } else if (rightPurple > leftBlue && rightPurple > threshold) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU');
      setLastDetected({ result: 'omega', time: timeStr });
      addResult('omega');
    }
  };

  const analyzeColorDominance = (imageData: ImageData, color: 'blue' | 'purple'): number => {
    let matchingPixels = 0;
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (color === 'blue') {
        if (b > 180 && g > 200 && r < 150 && (g - r) > 50 && (b - r) > 30) {
          matchingPixels++;
        }
      } else if (color === 'purple') {
        if (r > 120 && b > 120 && g < 100 && Math.abs(r - b) < 60 && r > g && b > g) {
          matchingPixels++;
        }
      }
    }
    
    return matchingPixels / (data.length / 4);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCaptureArea(null);
    toast({
      title: "Мониторинг остановлен",
      description: "Захват экрана завершен"
    });
  };

  const addResult = (result: Result) => {
    const lastResult = history[history.length - 1];
    if (lastResult && Date.now() - lastResult.timestamp.getTime() < 5000) {
      return;
    }

    const newEntry: HistoryEntry = {
      id: Date.now(),
      result,
      timestamp: new Date()
    };

    if (currentPrediction) {
      const updatedMethods = methods.map(method => {
        const prediction = method.predict(history);
        const isCorrect = prediction === result;
        return {
          ...method,
          predictions: method.predictions + 1,
          correct: method.correct + (isCorrect ? 1 : 0),
          accuracy: ((method.correct + (isCorrect ? 1 : 0)) / (method.predictions + 1)) * 100
        };
      });
      setMethods(updatedMethods);
    }

    setHistory([...history, newEntry]);
    
    toast({
      title: "Результат добавлен",
      description: `Зафиксирован результат: ${result === 'alpha' ? 'Альфа' : 'Омега'}`
    });
  };

  const clearHistory = () => {
    setHistory([]);
    setCurrentPrediction(null);
    setBestMethod('');
    setMethods(methods.map(m => ({ ...m, accuracy: 0, predictions: 0, correct: 0 })));
  };

  const alphaCount = history.filter(h => h.result === 'alpha').length;
  const omegaCount = history.filter(h => h.result === 'omega').length;
  const totalCount = history.length;
  const alphaPercent = totalCount > 0 ? (alphaCount / totalCount) * 100 : 0;
  const omegaPercent = totalCount > 0 ? (omegaCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight">Система прогнозирования</h1>
          <p className="text-muted-foreground">ИИ-анализ паттернов Альфа/Омега</p>
        </div>

        <Card className="p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Icon name="Monitor" size={20} className="text-primary" />
              Захват экрана
            </h2>
            {isMonitoring && (
              <Badge className="animate-pulse-glow bg-green-500">
                <Icon name="Radio" size={12} className="mr-1" />
                Мониторинг активен
              </Badge>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            {!isCapturing && !isMonitoring && (
              <Button onClick={startScreenCapture} className="flex-1">
                <Icon name="ScreenShare" size={18} className="mr-2" />
                Начать захват экрана
              </Button>
            )}
            
            {isCapturing && (
              <Button onClick={openSettings} className="flex-1" variant="secondary">
                <Icon name="Crosshair" size={18} className="mr-2" />
                Настроить область и чувствительность
              </Button>
            )}
            
            {isMonitoring && (
              <Button onClick={stopMonitoring} className="flex-1" variant="destructive">
                <Icon name="StopCircle" size={18} className="mr-2" />
                Остановить мониторинг
              </Button>
            )}
          </div>

          <video ref={videoRef} className="hidden" />
          <canvas ref={canvasRef} className="hidden" />

          {captureArea && (
            <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Чувствительность</span>
                <Badge variant="outline">{sensitivity}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Область захвата</span>
                <Badge variant="outline">{Math.round(captureArea.width)}×{Math.round(captureArea.height)}px</Badge>
              </div>
              {lastDetected && isMonitoring && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Последнее распознавание</span>
                  <div className="flex items-center gap-2">
                    <Badge className={lastDetected.result === 'alpha' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}>
                      {lastDetected.result === 'alpha' ? 'α Альфа' : 'ω Омега'}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{lastDetected.time}</span>
                  </div>
                </div>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full" 
                onClick={openSettings}
                disabled={!isMonitoring}
              >
                <Icon name="Settings" size={14} className="mr-2" />
                Изменить настройки
              </Button>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 lg:col-span-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="Zap" size={20} className="text-primary" />
                Текущий прогноз
              </h2>
              {bestMethod && (
                <Badge variant="outline" className="animate-pulse-glow">
                  {bestMethod}
                </Badge>
              )}
            </div>

            {currentPrediction ? (
              <div className={`p-8 rounded-lg border-2 text-center space-y-3 ${
                currentPrediction === 'alpha' 
                  ? 'bg-secondary/10 border-secondary' 
                  : 'bg-primary/10 border-primary'
              }`}>
                <div className="text-6xl font-bold animate-pulse-glow">
                  {currentPrediction === 'alpha' ? 'АЛЬФА' : 'ОМЕГА'}
                </div>
                <p className="text-sm text-muted-foreground">
                  Следующий прогноз основан на анализе {history.length} результатов
                </p>
              </div>
            ) : (
              <div className="p-8 rounded-lg border-2 border-dashed text-center text-muted-foreground">
                <Icon name="BrainCircuit" size={48} className="mx-auto mb-3 opacity-50" />
                <p>Добавьте результаты для начала прогнозирования</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => addResult('alpha')}
                className="flex-1 h-16 text-lg bg-secondary hover:bg-secondary/90"
                disabled={isMonitoring}
              >
                <Icon name="TrendingUp" size={20} className="mr-2" />
                Альфа
              </Button>
              <Button
                onClick={() => addResult('omega')}
                className="flex-1 h-16 text-lg bg-primary hover:bg-primary/90"
                disabled={isMonitoring}
              >
                <Icon name="TrendingDown" size={20} className="mr-2" />
                Омега
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Icon name="BarChart3" size={20} className="text-primary" />
              Статистика
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary font-medium">Альфа</span>
                  <span className="font-mono">{alphaCount} ({alphaPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={alphaPercent} className="h-2 bg-muted [&>div]:bg-secondary" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-primary font-medium">Омега</span>
                  <span className="font-mono">{omegaCount} ({omegaPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={omegaPercent} className="h-2 bg-muted [&>div]:bg-primary" />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">Всего результатов</div>
                <div className="text-3xl font-bold font-mono">{totalCount}</div>
              </div>

              <Button 
                onClick={clearHistory} 
                variant="outline" 
                className="w-full"
                disabled={history.length === 0}
              >
                <Icon name="RotateCcw" size={16} className="mr-2" />
                Очистить историю
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6 space-y-4 animate-fade-in">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Icon name="Cpu" size={20} className="text-primary" />
            Методы прогнозирования
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {methods.map((method, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-card space-y-2 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{method.name}</h3>
                  {method.name === bestMethod && (
                    <Badge variant="default" className="text-xs">Лучший</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Точность</span>
                    <span className="font-mono font-medium">
                      {method.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={method.accuracy} className="h-1.5" />
                  <div className="text-xs text-muted-foreground">
                    {method.correct}/{method.predictions} верных
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <AccuracyChart methods={methods} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Icon name="History" size={20} className="text-primary" />
              История результатов
            </h2>

            {history.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {history.slice().reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      entry.result === 'alpha'
                        ? 'bg-secondary/20 text-secondary border border-secondary/50'
                        : 'bg-primary/20 text-primary border border-primary/50'
                    }`}
                  >
                    {entry.result === 'alpha' ? 'α' : 'ω'}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="FileX" size={48} className="mx-auto mb-3 opacity-30" />
                <p>История пуста</p>
              </div>
            )}
          </Card>

          <ExportStats history={history} methods={methods} bestMethod={bestMethod} />
        </div>
      </div>

      {showSettings && (isCapturing || isMonitoring) && (
        <ScreenCaptureSettings
          videoRef={videoRef}
          onAreaSelect={handleAreaSelect}
          onClose={() => setShowSettings(false)}
          sensitivity={sensitivity}
          onSensitivityChange={setSensitivity}
        />
      )}
    </div>
  );
};

export default Index;