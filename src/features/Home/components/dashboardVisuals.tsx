import type { ReactElement } from 'react';

import AcUnitRounded from '@mui/icons-material/AcUnitRounded';
import AgricultureRounded from '@mui/icons-material/AgricultureRounded';
import CloudRounded from '@mui/icons-material/CloudRounded';
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded';
import PestControlRounded from '@mui/icons-material/PestControlRounded';
import SanitizerRounded from '@mui/icons-material/SanitizerRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SensorsOffRounded from '@mui/icons-material/SensorsOffRounded';
import ThunderstormRounded from '@mui/icons-material/ThunderstormRounded';
import UmbrellaRounded from '@mui/icons-material/UmbrellaRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import WbSunnyRounded from '@mui/icons-material/WbSunnyRounded';
import YardRounded from '@mui/icons-material/YardRounded';

import { error, primary } from '@/theme/colors';

import type {
  ActivityStatus,
  ActivityType,
  AlertSeverity,
  AlertType,
  DomainsHealth,
  WeatherCondition,
} from '../dashboard.types';

export const weatherIcon = (c: WeatherCondition): ReactElement =>
  ({
    sunny: <WbSunnyRounded />,
    cloudy: <CloudRounded />,
    rain: <UmbrellaRounded />,
    storm: <ThunderstormRounded />,
  })[c];

export const weatherLabel = (c: WeatherCondition): string =>
  ({ sunny: 'Ensoleillé', cloudy: 'Nuageux', rain: 'Pluvieux', storm: 'Orageux' })[c];

export const alertIcon = (t: AlertType): ReactElement =>
  ({
    drought: <LocalFireDepartmentRounded />,
    frost: <AcUnitRounded />,
    disease: <PestControlRounded />,
    sensor_offline: <SensorsOffRounded />,
    soil_moisture: <WaterDropRounded />,
    rain: <UmbrellaRounded />,
  })[t];

export const activityIcon = (t: ActivityType): ReactElement =>
  ({
    irrigation: <WaterDropRounded />,
    treatment: <SanitizerRounded />,
    sowing: <YardRounded />,
    harvest: <AgricultureRounded />,
    inspection: <SearchRounded />,
  })[t];

interface Tone {
  main: string;
  soft: string;
  label: string;
}

export const SEVERITY: Record<AlertSeverity, Tone> = {
  critical: { main: error[40], soft: 'rgba(186,26,26,0.10)', label: 'Critique' },
  warning: { main: '#8C5000', soft: 'rgba(198,138,26,0.16)', label: 'À surveiller' },
  info: { main: primary[50], soft: 'rgba(1,134,117,0.10)', label: 'Info' },
};

export const STATUS: Record<ActivityStatus, { label: string; color: string; bg: string }> = {
  todo: { label: 'À faire', color: '#5C5F5E', bg: '#F0F1EF' },
  in_progress: { label: 'En cours', color: primary[40], bg: 'rgba(1,134,117,0.12)' },
  done: { label: 'Fait', color: '#2E7D32', bg: 'rgba(46,125,50,0.12)' },
};

export const HEALTH: Record<DomainsHealth, { label: string; color: string; bg: string }> = {
  good: { label: 'Bonne', color: primary[40], bg: 'rgba(1,134,117,0.12)' },
  attention: { label: 'Attention', color: '#8C5000', bg: 'rgba(198,138,26,0.16)' },
  critical: { label: 'Critique', color: error[40], bg: 'rgba(186,26,26,0.10)' },
};
