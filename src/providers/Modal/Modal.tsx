import './Modal.css';
import React, {useContext, useRef, useState} from "react";


export enum ModalType {
    confirm = "confirm",
    confirmWithCancel = "confirmWithCancel",
};
  
type UseModalShowReturnType = {
    show: boolean;
    setShow: (value: boolean) => void;
    onHide: () => void;
}

const useModalShow = (): UseModalShowReturnType => {
    const [show, setShow] = useState(false);

    const handleOnHide = () => {
        setShow(false);
    };

    return {
        show,
        setShow,
        onHide: handleOnHide,
    }
};

export type ModalContextType = {
    showConfirmation: (modalType: ModalType, title: string, content?: string | JSX.Element) => Promise<boolean>;
};

type ModalContextProviderProps = {
    children: React.ReactNode
}

const ModalContext = React.createContext<ModalContextType>({} as ModalContextType);

export const ModalContextProvider: React.FC<ModalContextProviderProps> = (props) => {
    const {setShow, show, onHide} = useModalShow();
    const [content, setContent] = useState<{ title: string, content: string | JSX.Element | null} | null>();
    const [modalType, setModalType] = useState<ModalType>(ModalType.confirm);
    const resolver = useRef<Function>();
    const modalRef = useRef<HTMLDivElement>(null);

    const handleShow = (modalType: ModalType, title: string, content?: string | JSX.Element): Promise<boolean> => {
        content ? setContent({ title, content }) : setContent({ title, content: null });
        setShow(true);
        setModalType(modalType);
        return new Promise(function (resolve) {
            resolver.current = resolve;
        });
    };

    const modalContext: ModalContextType = {
        showConfirmation: handleShow
    };

    const handleOk = () => {
        resolver.current && resolver.current(true);
        onHide();
    };

    const handleCancel = () => {
        resolver.current && resolver.current(false);
        onHide();
    };

    return (
        <ModalContext.Provider value={modalContext}>
            {props.children}

            {content && show && 
                <div id="modal"
                    onClick={(e) => {
                        if (modalRef.current && modalRef.current.contains(e.target as Node)) {
                            return;
                        }
                        handleCancel();
                    }}
                >
                    <div id="modal--content" ref={modalRef}>
                        <div id="modal--content-title">
                            {content.title}
                        </div>
                        { content.content &&
                            <div id="modal--content-body">
                                {content.content}
                            </div>
                        }
                        <div id="modal--content-buttons">
                            { modalType == ModalType.confirmWithCancel &&
                                <button className="button-el" onClick={handleCancel}>Cancel</button>
                            }
                            <button className="button-el--visual" onClick={handleOk}>OK</button>
                        </div>
                    </div>
                </div>
            }
        </ModalContext.Provider>
    )
};

const useModalContext = (): ModalContextType => useContext(ModalContext);

export {
    useModalShow,
    useModalContext,
}
