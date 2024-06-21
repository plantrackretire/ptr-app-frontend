import './PieChartTitle.css';


interface IPieChartTitle {
  title: string,
}

export const PieChartTitle: React.FC<IPieChartTitle> = ({ title }) => {
  return (
    <div className="pie-chart--title">
      <h3>{title}</h3>
    </div>
  );
};
