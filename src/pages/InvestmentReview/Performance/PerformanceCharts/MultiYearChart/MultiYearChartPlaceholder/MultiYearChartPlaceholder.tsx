import '../MultiYearChart.css';


export const MultiYearChartPlaceholder: React.FC = () => {
  return (
    <div className="multi-year-chart">
        <div className="placeholder placeholder-heading2"><br /></div>
        <div></div>
        <div className="multi-year-chart--chart placeholder"  style={{ height: "8em" }} />
        </div>
  );
};