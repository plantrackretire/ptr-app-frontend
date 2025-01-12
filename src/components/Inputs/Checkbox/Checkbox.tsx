import React, { useEffect, useState } from 'react';
import "./Checkbox.css";

interface CheckboxProps {
  initialValue: boolean;
  onValueSubmit: (value: boolean, handleValueSubmitResult: (result: string) => void) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ initialValue, onValueSubmit }) => {
    const [localValue, setLocalValue] = useState<boolean>(initialValue || false);
    const [state, setState] = useState<string>("none");
    const [submitResult, setSubmitResult] = useState<string>("");

    useEffect(() => {
        if(state === "submitted") {
            setState("none");
        }
        // if(state !== "editing") {
        //     setLocalValue(initialValue);
        // }
        setSubmitResult("");
    }, [submitResult]);

    const handleValueSubmitResult = (result: string) => {
        setSubmitResult(result);
    }

    const handleInputChange = () => {
        const newValue = !localValue;
        setLocalValue(newValue);
        setState("submitted")
        submitValue(newValue);
    };

    // const handleBlur = () => {
    //     if(localValue !== initialValue) {
    //         setState("submitted");
    //         submitValue();
    //     } else {
    //         setState("none");
    //     }
    // };

    const submitValue = (value: boolean) => {
        onValueSubmit(value, handleValueSubmitResult);
    };

    // const handleFocus = () => {
    //     setState("editing");
    // };

    // Determine the value to display:
    let displayValue: boolean;
    switch(state) {
        case "editing": displayValue = localValue; break;
        case "submitted": displayValue = localValue; break; // Need this to avoid old value flickering while update happening.
        case "none": displayValue = initialValue; break;
        default: displayValue = initialValue; break;
    }

    return (
        <input
            className="checkbox-input"
            type="checkbox"
            checked={displayValue}
            onChange={handleInputChange}
        />
    );
};
