import '../BarChart.css';


export const BarChartPlaceholder: React.FC = () => {
  return (
    <div className="bar-chart">
      <div className="placeholder"><br /></div>
      <div className="bar-chart--chart placeholder" />
      <div className="placeholder"><br /></div>
    </div>
  );
};