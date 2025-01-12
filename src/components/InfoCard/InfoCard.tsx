import { InfoButton } from '../InfoButton';
import './InfoCard.css';


interface IInfoCard {
  title: string | null,
  titleInfo?: JSX.Element,
  middleContent?: JSX.Element,
  subTitle?: JSX.Element,
}

export const InfoCard: React.FC<IInfoCard> = ({ title, titleInfo, middleContent, subTitle }) => {
  if(title === null) {
    return (
      <div className='info-card'>
        <div></div>
        <div className="placeholder placeholder-heading1"><br /></div>
        <div></div>
        <div className="placeholder"><br /></div>
        <div className="placeholder"><br /></div>
        <div></div>
      </div>
    );
  }

  return (
      <div className='info-card'>
        <div className='info-card--title'>
          <h2>{title}</h2>
          { titleInfo &&
            <InfoButton content={titleInfo} />
          }
        </div>
        { middleContent && 
          <h1>{ middleContent }</h1>
        }
        { subTitle &&
          <div className='info-card--subtitle'>
            { subTitle }
          </div> 
        }
      </div>
  );
};