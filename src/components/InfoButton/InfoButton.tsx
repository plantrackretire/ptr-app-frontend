import { InfoIcon } from '../../assets/InfoIcon';
import { ModalType, useModalContext } from '../../providers/Modal';
import './InfoButton.css';

interface IInfoButton {
  content: JSX.Element,
  lightColor?: boolean,
}

export const InfoButton: React.FC<IInfoButton> = ({ content, lightColor }) => {
  const modalContext = useModalContext();

  const handleInfoButtonClick = async () => {
    await modalContext.showModal(ModalType.closable, content);
  }

  return (
    <button className={'button-el info-button svg-container' + (lightColor ? ' light' : '')} onClick={handleInfoButtonClick}>
      <InfoIcon title="Additional Info" />
    </button>
  );
};
