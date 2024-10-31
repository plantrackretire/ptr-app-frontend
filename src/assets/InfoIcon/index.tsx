import { ISvgImg } from '../Svg';


export const InfoIcon: React.FC<ISvgImg> = ({ title }) => {
  return (
    <svg role="img" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16">
      <title>{title ? title : ''}</title>
      <path d="M9 12c0 0.552-0.448 1-1 1s-1-0.448-1-1 0.448-1 1-1 1 0.448 1 1z"></path>
      <path d="M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z"></path>
      <path d="M8 10.004c-0.414 0-0.75-0.336-0.75-0.75v-0.5c0-0.525 0.203-0.998 0.602-1.404 0.295-0.3 0.653-0.525 0.999-0.742 0.712-0.447 1.024-0.687 1.024-1.107 0-0.457-0.264-0.762-0.485-0.938-0.355-0.282-0.849-0.437-1.39-0.437-0.821 0-1.559 0.548-1.796 1.333-0.12 0.397-0.538 0.621-0.934 0.502s-0.621-0.538-0.502-0.934c0.205-0.68 0.631-1.291 1.2-1.721 0.589-0.445 1.292-0.68 2.031-0.68 0.878 0 1.703 0.271 2.322 0.762 0.679 0.539 1.053 1.289 1.053 2.113 0 1.293-0.998 1.92-1.726 2.377-0.611 0.384-0.899 0.596-0.899 0.876v0.5c0 0.414-0.336 0.75-0.75 0.75z"></path>
    </svg>
  );
};