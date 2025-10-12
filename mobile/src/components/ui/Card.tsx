import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return (
    <PaperCard mode="contained" style={style}>
      <PaperCard.Content>{children}</PaperCard.Content>
    </PaperCard>
  );
}
