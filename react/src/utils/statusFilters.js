export const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Inactive'];

export const appendInactiveFilter = (statusValue, queryParams) => {
  if (!statusValue || statusValue === 'All') {
    return queryParams;
  }

  const isInactive = statusValue === 'Inactive';
  return `${queryParams}&inactive=${isInactive}`;
};
