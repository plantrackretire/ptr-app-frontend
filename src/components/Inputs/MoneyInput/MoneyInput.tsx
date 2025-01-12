import React, { Fragment, useEffect, useState } from 'react';
import { formatBalance } from '../../../utils/general';
import { ClearIcon } from '../../../assets/ClearIcon';
import "./MoneyInput.css";

interface MoneyInputProps {
  initialValue: string;
  onValueSubmit: (value: number, handleValueSubmitResult: (result: string) => void) => void;
  onDeleteValue?: (handleValueSubmitResult: (result: string) => void) => void,
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ initialValue, onValueSubmit, onDeleteValue }) => {
    const [localValue, setLocalValue] = useState<string>(initialValue || "");
    const [state, setState] = useState<string>("none");
    const [submitResult, setSubmitResult] = useState<string>("");

    useEffect(() => {
        if(state === "submitted") {
            setState("none");
        }
        if(state !== "editing") {
            setLocalValue(initialValue);
        }
        setSubmitResult("");
    }, [submitResult]);

    const handleValueSubmitResult = (result: string) => {
        setSubmitResult(result);
    }

    const handleValueDeleteResult = (result: string) => {
        setSubmitResult(result);
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;

        // Allow only numbers, optional decimal point, and up to two decimal places
        if (/^\d*\.?\d{0,2}$/.test(inputValue)) {
            setLocalValue(inputValue);
        }
    };

    const handleBlur = () => {
        const tmpLocalValue = localValue ? parseFloat(localValue) : 0;
        const tmpInitValue = initialValue ? parseFloat(initialValue) : 0;
        if(tmpLocalValue !== tmpInitValue) {
            setState("submitted");
            submitValue();
        } else {
            setState("none");
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        return; // Currently not using, some cases when entering 0 and pressing enter lose focus without triggering blur, so requiring focus change.
        if (event.key === 'Enter') {
            if(parseFloat(localValue) !== parseFloat(initialValue)) {
                submitValue();
            }
        }
    };

    const submitValue = () => {
        const numericValue = parseFloat(localValue);
        if (!isNaN(numericValue)) {
            onValueSubmit(numericValue, handleValueSubmitResult);
        }
        };

    const handleFocus = () => {
        setState("editing");
    };

    const handleDeleteValue = () => {
        onDeleteValue!(handleValueDeleteResult);
    };
    
    // Determine the value to display:
    let displayValue = "";
    switch(state) {
        case "editing": displayValue = localValue; break;
        case "submitted": displayValue = formatBalance(parseFloat(localValue) || 0); break; // Need this to avoid old value flickering while update happening.
        case "none": displayValue = formatBalance(parseFloat(initialValue) || 0); break;
        default: displayValue = formatBalance(parseFloat(initialValue) || 0); break;
    }

    return (
        <Fragment>
            {
                !onDeleteValue ?
                    <input
                        className="money-input--input"
                        type="text"
                        value={displayValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        placeholder="Enter amount"
                    />
                :
                    <div className="money-input">
                        <input
                            className="money-input--input"
                            type="text"
                            value={displayValue}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            onFocus={handleFocus}
                            placeholder="Enter amount"
                        />
                        <span className="svg-container" onClick={handleDeleteValue}>
                            <ClearIcon title="Delete reserve" />
                        </span>
                    </div>
            }
        </Fragment>
    );
};
