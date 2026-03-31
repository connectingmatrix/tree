import React from 'react';
import { TreeRootDefinition, TreeRootKind } from './types';

export interface NodeProps extends TreeRootDefinition {
    kind: TreeRootKind;
}

export const Node = (_props: NodeProps): React.ReactNode => null;

export const readRootDefinitions = (children: React.ReactNode): TreeRootDefinition[] =>
    React.Children.toArray(children)
        .filter(React.isValidElement<NodeProps>)
        .map((child) => ({
            kind: child.props.kind,
            icon: child.props.icon,
            label: child.props.label
        }));
