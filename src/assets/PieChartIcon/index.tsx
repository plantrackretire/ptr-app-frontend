import { ISvgImg } from '../Svg';


export const PieChartIcon: React.FC<ISvgImg> = ({ title }) => {
  return (
    <svg role="img" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16">
      <title>{title ? title : ''}</title>
      <path d="M7 9v-8.938c-3.946 0.492-7 3.858-7 7.938 0 4.418 3.582 8 8 8 4.080 0 7.446-3.054 7.938-7h-8.938z"></path>
      <path d="M8 8h8c0-4.418-3.582-8-8-8v8z"></path>
    </svg>
  );
};