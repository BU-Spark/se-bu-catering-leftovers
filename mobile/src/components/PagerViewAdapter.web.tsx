import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

type PagerViewProps = {
  children: ReactNode;
  initialPage?: number;
  onPageSelected?: (event: { nativeEvent: { position: number } }) => void;
  style?: StyleProp<ViewStyle>;
};

export type PagerViewHandle = {
  setPage: (page: number) => void;
};

const PagerViewAdapter = forwardRef<PagerViewHandle, PagerViewProps>(
  ({ children, initialPage = 0, onPageSelected, style }, ref) => {
    const pages = useMemo(() => React.Children.toArray(children), [children]);
    const [currentPage, setCurrentPage] = useState(
      Math.min(initialPage, pages.length - 1),
    );

    useImperativeHandle(ref, () => ({
      setPage: (page: number) => {
        const nextPage = Math.min(Math.max(page, 0), pages.length - 1);
        setCurrentPage(nextPage);
        onPageSelected?.({ nativeEvent: { position: nextPage } });
      },
    }));

    return <View style={style}>{pages[currentPage]}</View>;
  },
);

PagerViewAdapter.displayName = 'PagerViewAdapterWeb';

export default PagerViewAdapter;
