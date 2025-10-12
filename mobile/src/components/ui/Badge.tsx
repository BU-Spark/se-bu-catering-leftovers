import * as React from 'react';
import { Chip, useTheme } from 'react-native-paper';
import type { EventStatus } from '../../types';
import { spacing } from '../../lib/theme';

interface BadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md';
}

export function Badge({ status, size = 'md' }: BadgeProps) {
  const theme = useTheme();
  const bg =
    status === 'open' ? theme.colors.primary
  : theme.colors.error;

  const padH = size === 'sm' ? spacing.sm : spacing.md;
  const padV = size === 'sm' ? Math.max(2, spacing.xs) : Math.max(4, spacing.xs);

  return (
    <Chip
      compact
      style={{ backgroundColor: bg, paddingHorizontal: padH, paddingVertical: padV }}
      textStyle={{ color: theme.colors.onPrimary }}
    >
      {status}
    </Chip>
  );
}
