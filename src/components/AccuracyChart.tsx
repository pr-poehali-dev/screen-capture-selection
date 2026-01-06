import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface PredictionMethod {
  name: string;
  accuracy: number;
  predictions: number;
  correct: number;
}

interface AccuracyChartProps {
  methods: PredictionMethod[];
}

export const AccuracyChart = ({ methods }: AccuracyChartProps) => {
  const maxAccuracy = Math.max(...methods.map(m => m.accuracy), 1);
  const sortedMethods = [...methods].sort((a, b) => b.accuracy - a.accuracy);

  const getColorClass = (index: number) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-muted-foreground'];
    return colors[index % colors.length];
  };

  const getBarColor = (index: number) => {
    const colors = ['#8B5CF6', '#0EA5E9', '#F97316', '#10B981'];
    return colors[index % colors.length];
  };

  return (
    <Card className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Icon name="TrendingUp" size={20} className="text-primary" />
          График точности методов
        </h2>
        {methods.some(m => m.predictions > 0) && (
          <Badge variant="outline">
            {methods.reduce((sum, m) => sum + m.predictions, 0)} прогнозов
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {sortedMethods.map((method, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${getColorClass(index)}`}
                  style={{ backgroundColor: getBarColor(index) }}
                />
                <span className="font-medium text-sm">{method.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {method.correct}/{method.predictions}
                </span>
                <span className="font-mono font-bold text-lg min-w-[60px] text-right">
                  {method.accuracy.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out flex items-center justify-end px-3"
                style={{
                  width: `${method.accuracy}%`,
                  backgroundColor: getBarColor(index),
                  opacity: 0.9
                }}
              >
                {method.accuracy > 15 && (
                  <span className="text-xs font-semibold text-white">
                    {method.accuracy.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {methods.every(m => m.predictions === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
            <p>Добавьте результаты для отображения графика точности</p>
          </div>
        )}
      </div>

      {methods.some(m => m.predictions > 0) && (
        <div className="pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {Math.max(...methods.map(m => m.accuracy)).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Макс. точность</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">
              {(methods.reduce((sum, m) => sum + m.accuracy, 0) / methods.length).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Средняя точность</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent">
              {methods.reduce((sum, m) => sum + m.predictions, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Всего прогнозов</div>
          </div>
        </div>
      )}
    </Card>
  );
};
