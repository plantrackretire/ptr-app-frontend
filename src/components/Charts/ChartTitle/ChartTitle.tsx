import './ChartTitle.css';


interface IChartTitle {
  title: string,
}

export const ChartTitle: React.FC<IChartTitle> = ({ title }) => {
  return (
    <div>
      <h4>{title}</h4>
    </div>
  );
};
