import { TreeCreateRequestDetail, TreeEventDetail, TreeEventsApi } from './types';

export const TREE_UPDATED_EVENT = 'giga:content-tree-updated';
export const TREE_CREATE_REQUEST_EVENT = 'giga:content-tree-create-request';

const resolveDefaultTarget = (): EventTarget | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window;
};

export const createTreeEventsApi = (target?: EventTarget | null): TreeEventsApi => {
    const eventTarget = target === undefined ? resolveDefaultTarget() : target;

    return {
        emitUpdate: (detail: TreeEventDetail): void => {
            if (!eventTarget) {
                return;
            }

            eventTarget.dispatchEvent(new CustomEvent<TreeEventDetail>(TREE_UPDATED_EVENT, { detail }));
        },
        subscribeToUpdates: (listener: (detail: TreeEventDetail) => void): (() => void) => {
            if (!eventTarget) {
                return () => undefined;
            }

            const handler = (event: Event): void => {
                const customEvent = event as CustomEvent<TreeEventDetail>;
                listener(customEvent.detail);
            };

            eventTarget.addEventListener(TREE_UPDATED_EVENT, handler as EventListener);
            return () => {
                eventTarget.removeEventListener(TREE_UPDATED_EVENT, handler as EventListener);
            };
        },
        emitCreateRequest: (detail: TreeCreateRequestDetail): void => {
            if (!eventTarget) {
                return;
            }

            eventTarget.dispatchEvent(new CustomEvent<TreeCreateRequestDetail>(TREE_CREATE_REQUEST_EVENT, { detail }));
        },
        subscribeToCreateRequests: (listener: (detail: TreeCreateRequestDetail) => void): (() => void) => {
            if (!eventTarget) {
                return () => undefined;
            }

            const handler = (event: Event): void => {
                const customEvent = event as CustomEvent<TreeCreateRequestDetail>;
                listener(customEvent.detail);
            };

            eventTarget.addEventListener(TREE_CREATE_REQUEST_EVENT, handler as EventListener);
            return () => {
                eventTarget.removeEventListener(TREE_CREATE_REQUEST_EVENT, handler as EventListener);
            };
        }
    };
};

export const treeEvents = createTreeEventsApi();
