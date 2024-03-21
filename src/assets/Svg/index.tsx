// Interface for svg component (to avoid duplicate declarations)
// All svg elements should be enclosed in an element with the class 'svg-container',
// and this class should be used by parent elements to set the size of the svg (set width and height on this class).
export interface ISvgImg {
  title?: string,
}


// Old method

// Everything below here is the former method no longer used, using an img tag.
// Interface for generic svg img element implemented below.
// export interface ISvg {
//   svgFile: string;
//   width?: string,
//   height?: string,
//   altText?: string,
//   setTitle?: boolean,
// }

// export const Svg: React.FC<ISvg> = ({ svgFile, width, height, altText, setTitle }) => {
//   const styles: {[k: string]: string} = {};
//   if(width)
//     styles.width = width;
//   if(height)
//     styles.height = height;
  
//   return (
//     <img src={svgFile} className="logo" alt={altText || ''} title={setTitle ? (altText  || '') : ''} style={styles} />
//   );
// };  