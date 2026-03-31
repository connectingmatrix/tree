import { useEffect, useRef, useState } from 'react';

export const useSize = () => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ height: 0, width: 0 });

    useEffect(() => {
        if (!ref.current) {
            return;
        }
        const observer = new ResizeObserver(([entry]) => {
            const rect = entry?.contentRect;
            if (!rect) {
                return;
            }
            setSize({ height: rect.height, width: rect.width });
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, size };
};
