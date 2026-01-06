import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';

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

const Index = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<Result | null>(null);
  const [bestMethod, setBestMethod] = useState<string>('');
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

  const addResult = (result: Result) => {
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
              >
                <Icon name="TrendingUp" size={20} className="mr-2" />
                Альфа
              </Button>
              <Button
                onClick={() => addResult('omega')}
                className="flex-1 h-16 text-lg bg-primary hover:bg-primary/90"
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
      </div>
    </div>
  );
};

export default Index;
