import { describe, expect, it } from 'vitest';
import { resolveCreatedNodeNavigation, resolveNodeNavigationUrl, resolveScopeRootUrl } from '../navigation';

describe('navigation helpers', () => {
    it('resolves created node navigation for user/global/org routes', () => {
        expect(resolveScopeRootUrl('u')).toBe('/u');
        expect(resolveScopeRootUrl('g')).toBe('/g');
        expect(resolveScopeRootUrl('u', 'org-1')).toBe('/org/org-1');

        expect(resolveNodeNavigationUrl({ scope: 'u', url: '/u/channel/ch-1' }, 'org-1')).toBe('/org/org-1/channel/ch-1');

        expect(
            resolveCreatedNodeNavigation({
                createdNode: { scope: 'u', url: '/u/channel/ch-1/category/cat-1' },
                contextType: 'organization',
                organizationId: 'org-1'
            })
        ).toBe('/org/org-1/channel/ch-1/category/cat-1');

        expect(
            resolveCreatedNodeNavigation({
                createdNode: { scope: 'u', url: '/u/channel/ch-1' },
                contextType: 'global'
            })
        ).toBe('/g/channel/ch-1');
    });
});
