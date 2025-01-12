import { ISvgImg } from '../Svg';


export const EditIcon: React.FC<ISvgImg> = ({ title }) => {
  return (
    <svg role="img" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16">
      <title>{title ? title : ''}</title>
        <path d="M12 8.5v5.5h-10v-10h5.5l2-2h-8c-0.825 0-1.5 0.675-1.5 1.5v11c0 0.825 0.675 1.5 1.5 1.5h11c0.825 0 1.5-0.675 1.5-1.5v-8l-2 2z"></path>
        <path d="M13.5 0l-9.5 9.5v2.5h2.5l9.5-9.5c0-1.5-1-2.5-2.5-2.5z"></path>
      </svg>
  );
};
