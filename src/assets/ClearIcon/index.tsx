import { ISvgImg } from '../Svg';


export const ClearIcon: React.FC<ISvgImg> = ({ title }) => {
  return (
    <svg role="img" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16">
      <title>{title ? title : ''}</title>
      <path d="M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z"></path>
      <path d="M10.5 4l-2.5 2.5-2.5-2.5-1.5 1.5 2.5 2.5-2.5 2.5 1.5 1.5 2.5-2.5 2.5 2.5 1.5-1.5-2.5-2.5 2.5-2.5z"></path>
    </svg>
  );
};


// Old method
// export const ClearIcon: React.FC<ISvgImg> = ({ width, height, altText, setTitle }) => {
//   return (
//     <Svg svgFile={svgImage} width={width} height={height} altText={altText} setTitle={setTitle} />
//   );
// };  