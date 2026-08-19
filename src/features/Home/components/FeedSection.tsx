import type { FunctionComponent } from 'react';

import { Stack } from '@mui/material';

import type { FeedGroup, FeedItem } from '../home.feed.types';
import { FeedCard } from './FeedCard';
import { SectionHeader } from './SectionHeader';

interface FeedSectionProps {
  group: FeedGroup;
  isOnline: boolean;
  onSelect: (item: FeedItem) => void;
  onAction: (id: string, action: 'start' | 'complete') => void;
}

export const FeedSection: FunctionComponent<FeedSectionProps> = ({ group, isOnline, onSelect, onAction }) => (
  <Stack>
    <SectionHeader title={group.label} count={group.items.length} />
    <Stack spacing={1.25}>
      {group.items.map((item) => (
        <FeedCard key={item.id} item={item} isOnline={isOnline} onSelect={onSelect} onAction={onAction} />
      ))}
    </Stack>
  </Stack>
);
