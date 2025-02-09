import { ISvgImg } from '../Svg';


export const DollarsIcon: React.FC<ISvgImg> = ({ title }) => {
  return (
    <svg role="img" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16">
      <title>{title ? title : ''}</title>
      <path d="M7.5 1c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5c4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5zM7.5 14.5c-3.314 0-6-2.686-6-6s2.686-6 6-6c3.314 0 6 2.686 6 6s-2.686 6-6 6zM8 8v-2h2v-1h-2v-1h-1v1h-2v4h2v2h-2v1h2v1h1v-1h2l-0-4h-2zM7 8h-1v-2h1v2zM9 11h-1v-2h1v2z"></path>
      </svg>
  );
};
