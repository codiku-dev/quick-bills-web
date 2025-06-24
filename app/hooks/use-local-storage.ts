import { Dispatch, SetStateAction, useEffect } from "react";

import { useState } from "react";

export const useLocalStorage = (key: string): [string | null, Dispatch<SetStateAction<string | null>>] => {
    const [value, setValue] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(key);
            setValue(stored);
        } catch (error) {
            console.warn('localStorage not available:', error);
        }
    }, [key]);

    return [value, setValue];
};