import React, { forwardRef } from 'react';
import PagerView, { PagerViewProps } from 'react-native-pager-view';

export type PagerViewHandle = {
  setPage: (page: number) => void;
};

const PagerViewAdapter = forwardRef<PagerViewHandle, PagerViewProps>(
  (props, ref) => <PagerView ref={ref as any} {...props} />,
);

PagerViewAdapter.displayName = 'PagerViewAdapter';

export default PagerViewAdapter;
