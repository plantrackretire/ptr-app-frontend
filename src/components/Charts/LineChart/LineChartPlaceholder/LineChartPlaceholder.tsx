import '../LineChart.css';


export const LineChartPlaceholder: React.FC = () => {
  return (
    <div className="line-chart">
      <div className="placeholder"><br /></div>
      <div className="line-chart--chart placeholder" />
      <div className="placeholder"><br /></div>
    </div>
  );
};