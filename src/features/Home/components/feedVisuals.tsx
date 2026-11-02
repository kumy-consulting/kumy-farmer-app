import type { ReactElement } from 'react';

import AcUnitRounded from '@mui/icons-material/AcUnitRounded';
import AgricultureRounded from '@mui/icons-material/AgricultureRounded';
import EnergySavingsLeafRounded from '@mui/icons-material/EnergySavingsLeafRounded';
import PersonPinCircleRounded from '@mui/icons-material/PersonPinCircleRounded';
import PestControlRounded from '@mui/icons-material/PestControlRounded';
import SanitizerRounded from '@mui/icons-material/SanitizerRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SensorsOffRounded from '@mui/icons-material/SensorsOffRounded';
import UmbrellaRounded from '@mui/icons-material/UmbrellaRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import YardRounded from '@mui/icons-material/YardRounded';

import type { AlertSeverity } from '@/features/Domaines/domaines.types';
import type { FieldTaskStatus } from '@/features/FieldTasks/fieldTasks.types';
import { error, primary } from '@/theme/colors';

import type { FeedIcon, FeedKind } from '../home.feed.types';

/** Pictogramme d'une carte du fil. */
export const feedIcon = (icon: FeedIcon): ReactElement =>
  ({
    drought: <EnergySavingsLeafRounded />,
    frost: <AcUnitRounded />,
    disease: <PestControlRounded />,
    sensor_offline: <SensorsOffRounded />,
    soil_moisture: <WaterDropRounded />,
    rain: <UmbrellaRounded />,
    irrigation: <WaterDropRounded />,
    treatment: <SanitizerRounded />,
    sowing: <YardRounded />,
    harvest: <AgricultureRounded />,
    inspection: <SearchRounded />,
    window: <ScheduleRounded />,
    visit: <PersonPinCircleRounded />,
  })[icon];

interface Tone {
  main: string;
  soft: string;
  label: string;
}

/** Ton d'une alerte — trois niveaux, jamais davantage. */
export const SEVERITY_TONE: Record<AlertSeverity, Tone> = {
  critical: { main: error[40], soft: 'rgba(186,26,26,0.10)', label: 'Critique' },
  warning: { main: '#8C5000', soft: 'rgba(198,138,26,0.16)', label: 'À surveiller' },
  info: { main: primary[50], soft: 'rgba(1,134,117,0.10)', label: 'Info' },
};

/** Ton par nature de carte, quand aucune sévérité ne s'applique. */
export const KIND_TONE: Record<FeedKind, { main: string; soft: string }> = {
  alert: { main: error[40], soft: 'rgba(186,26,26,0.10)' },
  task: { main: primary[50], soft: 'rgba(1,134,117,0.10)' },
  itk: { main: '#4E635D', soft: 'rgba(78,99,93,0.10)' },
  window: { main: '#8C5000', soft: 'rgba(198,138,26,0.16)' },
  visit: { main: '#3A5A8C', soft: 'rgba(58,90,140,0.12)' },
};

export const TASK_STATUS: Record<FieldTaskStatus, { label: string; color: string; bg: string }> = {
  planned: { label: 'À faire', color: '#5C5F5E', bg: '#F0F1EF' },
  in_progress: { label: 'En cours', color: primary[40], bg: 'rgba(1,134,117,0.12)' },
  done: { label: 'Fait', color: '#2E7D32', bg: 'rgba(46,125,50,0.12)' },
};
