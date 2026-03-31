import React from 'react';
import { RowRendererProps } from 'react-arborist';

export const TreeRow = <T,>({ attrs, children, innerRef }: RowRendererProps<T>) => (
    <div
        {...attrs}
        ref={innerRef}
        onClick={(event) => event.stopPropagation()}
        onFocus={(event) => event.stopPropagation()}
    >
        {children}
    </div>
);
