import '../NetworthChart.css';
import { defaultNetworthChartHeight } from '..';


export const NetworthChartPlaceholder: React.FC = () => {
  let chartHeight = defaultNetworthChartHeight;
  
  return (
    <div className="networth-chart">
      <div className="placeholder"><br /></div>
      <div className="networth-chart--chart placeholder"  style={{ height: chartHeight }} />
      <div className="placeholder"><br /></div>
    </div>
  );
};