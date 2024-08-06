import { defaultYearlyChartHeight } from '..';
import '../YearlyChart.css';


export const YearlyChartPlaceholder: React.FC = () => {
  let chartHeight = defaultYearlyChartHeight;
  
  return (
    <div className="yearly-chart">
      <div className="placeholder"><br /></div>
      <div className="yearly-chart--chart placeholder"  style={{ height: chartHeight }} />
      <div className="placeholder"><br /></div>
    </div>
  );
};