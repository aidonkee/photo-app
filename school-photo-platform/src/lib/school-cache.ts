import { cache } from 'react';
import { getSchoolAndClasses } from '@/actions/parent/cart-actions';

/**
 * Cached wrapper for getSchoolAndClasses.
 * React.cache() deduplicates calls within the same request,
 * so generateMetadata and the layout component share one DB query.
 */
export const getCachedSchoolAndClasses = cache(async (slug: string) => {
  return getSchoolAndClasses(slug);
});
