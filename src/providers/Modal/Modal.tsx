import React, {useContext, useRef, useState} from "react";
import './Modal.css';
import { ClearIcon } from "../../assets/ClearIcon";


// Inputs:
//  For confirm types (confirm and confirmWithCancel): title (required), content (optional).
//  For closable: title (required) as content.
export enum ModalType {
    confirm = "confirm",
    confirmWithCancel = "confirmWithCancel",
    closable = "closable",
    noButtons = "noButtons",
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
    showModal: (modalType: ModalType, title: string | JSX.Element, content?: string | JSX.Element) => Promise<ModalReturnContent>;
    closeWithContent: (content: any) => void;
};

type ModalContextProviderProps = {
    children: React.ReactNode
}

type ModalReturnContent = {
    status: boolean,
    content?: any,
}

const ModalContext = React.createContext<ModalContextType>({} as ModalContextType);

export const ModalContextProvider: React.FC<ModalContextProviderProps> = ({ children }) => {
    const {setShow, show, onHide} = useModalShow();
    const [content, setContent] = useState<{ title: string | JSX.Element, content: string | JSX.Element | null} | null>();
    const [modalType, setModalType] = useState<ModalType>(ModalType.confirm);
    const resolver = useRef<Function>();
    const modalRef = useRef<HTMLDivElement>(null);

    const handleShow = (modalType: ModalType, title: string | JSX.Element, content?: string | JSX.Element): Promise<ModalReturnContent> => {
        switch(modalType) {
            case ModalType.confirm:
            case ModalType.confirmWithCancel:
                setContent({ title, content: content ? content : null });
                break;
            case ModalType.closable:
                setContent({ title, content: null });
                break;
            case ModalType.noButtons:
                setContent({ title, content: null });
                break;
            }
        setShow(true);
        setModalType(modalType);
        return new Promise(function (resolve) {
            resolver.current = resolve;
        });
    };

    const handleCloseWithContent = (returnValue: any) => {
        resolver.current && resolver.current({ status: true, content: returnValue });
        onHide();
        setContent(null);
    };

    const modalContext: ModalContextType = {
        showModal: handleShow,
        closeWithContent: handleCloseWithContent,
    };

    const handleOk = () => {
        resolver.current && resolver.current({ status: true });
        onHide();
        setContent(null);
    };

    const handleCancel = () => {
        resolver.current && resolver.current({ status: false });
        onHide();
        setContent(null);
    };

    return (
        <ModalContext.Provider value={modalContext}>
            {children}

            {content && show && 
                <div id="modal"
                    onClick={(e) => {
                        if (modalRef.current && modalRef.current.contains(e.target as Node)) {
                            return;
                        }
                        handleCancel();
                    }}
                >
                    { ((modalType === ModalType.confirm) || (modalType === ModalType.confirmWithCancel)) &&
                        <div id="modal--content--confirmable" className="modal--content" ref={modalRef}>
                            <div id="modal--content--confirmable-title">
                                {content.title}
                            </div>
                            { content.content &&
                                <div id="modal--content--confirmable-body">
                                    {content.content}
                                </div>
                            }
                            <div id="modal--content--confirmable-buttons">
                                { modalType == ModalType.confirmWithCancel &&
                                    <button className="button-el" onClick={handleCancel}>Cancel</button>
                                }
                                <button className="button-el--visual" onClick={handleOk}>OK</button>
                            </div>
                        </div>
                    }
                    { (modalType === ModalType.closable) &&
                        <div id="modal--content--closable" className="modal--content" ref={modalRef}>
                            <div id="modal--content--closable-close">
                                <button className="button-el" onClick={handleCancel}><ClearIcon title="Close" /></button>
                            </div>
                            {content.title}
                        </div>
                    }
                    { (modalType === ModalType.noButtons) &&
                        <div id="modal--content--closable" className="modal--content" ref={modalRef}>
                            {content.title}
                        </div>
                    }
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
