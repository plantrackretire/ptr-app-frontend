import { ISvgImg } from '../Svg';


export const PerformanceChartIcon: React.FC<ISvgImg> = ({ title }) => {
  return (
    <svg role="img" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16">
      <title>{title ? title : ''}</title>
      <path d="M11.5 0l1.72 1.72-4.22 4.22-3-3-5.5 5.5 1.061 1.061 4.439-4.439 3 3 5.28-5.28 1.72 1.72v-4.5z"></path>
      <path d="M13 6.561v9.439h2v-11.439z"></path>
      <path d="M10 9.561v6.439h2v-8.439z"></path>
      <path d="M7 16h2v-5.439l-2-2z"></path>
      <path d="M4 16h2v-8.439l-2 2z"></path>
      <path d="M1 12.561v3.439h2v-5.439z"></path>
    </svg>
  );
};