import '../PieChart.css';


interface IPieChartPlaceholder {
  height: string,
}

export const PieChartPlaceholder: React.FC<IPieChartPlaceholder> = ({height}) => {
  return (
    <div className="pie-chart">
      <div className="placeholder" style={{ width: height }}><br /></div>
      <div className="pie-chart--chart placeholder"  style={{ height: height, width: height }} />
    </div>
  );
};