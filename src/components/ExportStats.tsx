import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface HistoryEntry {
  id: number;
  result: 'alpha' | 'omega';
  timestamp: Date;
}

interface PredictionMethod {
  name: string;
  accuracy: number;
  predictions: number;
  correct: number;
}

interface ExportStatsProps {
  history: HistoryEntry[];
  methods: PredictionMethod[];
  bestMethod: string;
}

export const ExportStats = ({ history, methods, bestMethod }: ExportStatsProps) => {
  const { toast } = useToast();

  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalResults: history.length,
      alphaCount: history.filter(h => h.result === 'alpha').length,
      omegaCount: history.filter(h => h.result === 'omega').length,
      bestMethod,
      methods: methods.map(m => ({
        name: m.name,
        accuracy: m.accuracy,
        predictions: m.predictions,
        correct: m.correct
      })),
      history: history.map(h => ({
        result: h.result,
        timestamp: h.timestamp.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction-stats-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Экспорт завершен",
      description: "Статистика сохранена в формате JSON"
    });
  };

  const exportToCSV = () => {
    const headers = ['Метод', 'Точность (%)', 'Прогнозов', 'Верных'];
    const rows = methods.map(m => [
      m.name,
      m.accuracy.toFixed(2),
      m.predictions.toString(),
      m.correct.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction-methods-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Экспорт завершен",
      description: "Статистика методов сохранена в формате CSV"
    });
  };

  const exportHistoryCSV = () => {
    const headers = ['№', 'Результат', 'Дата и время'];
    const rows = history.map((h, index) => [
      (index + 1).toString(),
      h.result === 'alpha' ? 'Альфа' : 'Омега',
      new Date(h.timestamp).toLocaleString('ru-RU')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction-history-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Экспорт завершен",
      description: "История результатов сохранена в формате CSV"
    });
  };

  const copyStatsToClipboard = () => {
    const alphaCount = history.filter(h => h.result === 'alpha').length;
    const omegaCount = history.filter(h => h.result === 'omega').length;
    const totalPredictions = methods.reduce((sum, m) => sum + m.predictions, 0);
    const avgAccuracy = methods.reduce((sum, m) => sum + m.accuracy, 0) / methods.length;

    const text = `
📊 СТАТИСТИКА ПРОГНОЗИРОВАНИЯ

Всего результатов: ${history.length}
- Альфа: ${alphaCount} (${((alphaCount / history.length) * 100).toFixed(1)}%)
- Омега: ${omegaCount} (${((omegaCount / history.length) * 100).toFixed(1)}%)

🎯 МЕТОДЫ ПРОГНОЗИРОВАНИЯ
${methods.map(m => `
${m.name}:
- Точность: ${m.accuracy.toFixed(1)}%
- Прогнозов: ${m.predictions}
- Верных: ${m.correct}
`).join('\n')}

🏆 Лучший метод: ${bestMethod}
📈 Средняя точность: ${avgAccuracy.toFixed(1)}%
🔢 Всего прогнозов: ${totalPredictions}
    `.trim();

    navigator.clipboard.writeText(text);

    toast({
      title: "Скопировано",
      description: "Статистика скопирована в буфер обмена"
    });
  };

  return (
    <Card className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Icon name="Download" size={20} className="text-primary" />
          Экспорт статистики
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={exportToJSON}
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          disabled={history.length === 0}
        >
          <Icon name="FileJson" size={24} className="text-primary" />
          <div>
            <div className="font-semibold">JSON</div>
            <div className="text-xs text-muted-foreground">Полная статистика</div>
          </div>
        </Button>

        <Button
          onClick={exportToCSV}
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          disabled={methods.every(m => m.predictions === 0)}
        >
          <Icon name="FileSpreadsheet" size={24} className="text-secondary" />
          <div>
            <div className="font-semibold">CSV методы</div>
            <div className="text-xs text-muted-foreground">Таблица методов</div>
          </div>
        </Button>

        <Button
          onClick={exportHistoryCSV}
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          disabled={history.length === 0}
        >
          <Icon name="FileText" size={24} className="text-accent" />
          <div>
            <div className="font-semibold">CSV история</div>
            <div className="text-xs text-muted-foreground">Все результаты</div>
          </div>
        </Button>

        <Button
          onClick={copyStatsToClipboard}
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          disabled={history.length === 0}
        >
          <Icon name="Copy" size={24} className="text-muted-foreground" />
          <div>
            <div className="font-semibold">Копировать</div>
            <div className="text-xs text-muted-foreground">В буфер обмена</div>
          </div>
        </Button>
      </div>

      {history.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Добавьте результаты для возможности экспорта
        </div>
      )}
    </Card>
  );
};
