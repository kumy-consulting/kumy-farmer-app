import { useMemo, type FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import type { AlertSeverity } from '@/features/Domaines/domaines.types';

import { HealthSynthesis } from './HealthSynthesis';
import { NdviTrend } from './NdviTrend';
import { RiskAdviceList, type RiskWithStage } from './RiskAdviceList';
import type { IndicatorPoint, ItkParcelTasks } from '../../parcelle.types';

interface ConseilsTabContentProps {
  itk: ItkParcelTasks | null;
  ndvi: number | null;
  indicators: IndicatorPoint[];
}

/** Sévérité de risque ITK → sévérité d'alerte (pour le verdict santé). */
const RISK_TO_ALERT: Record<string, AlertSeverity> = { high: 'critical', medium: 'warning', low: 'info' };

/** Petit en-tête de section numéroté (carnet agronomique). */
const SectionTitle: FunctionComponent<{ n: string; title: string }> = ({ n, title }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pt: 2.5, pb: 0.5 }}>
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 11, fontWeight: 700, color: '#35A18F', letterSpacing: '0.1em' }}>
      {n}
    </Typography>
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: '#1A1C1B' }}>
      {title}
    </Typography>
  </Stack>
);

/** Onglet Conseils (Essentiel) : synthèse santé + risques/recommandations + évolution NDVI. */
export const ConseilsTabContent: FunctionComponent<ConseilsTabContentProps> = ({ itk, ndvi, indicators }) => {
  const currentOrder = itk?.currentStage?.order ?? 0;

  // Risques du stade courant + des stades à venir (les stades passés ne sont plus actionnables).
  const risks = useMemo<RiskWithStage[]>(() => {
    const stages = itk?.stages ?? [];
    const relevant = itk?.currentStage ? stages.filter((s) => s.order >= currentOrder) : stages;
    const order = { high: 0, medium: 1, low: 2 } as const;
    return relevant
      .flatMap((s) => s.risks.map((r) => ({ ...r, stageName: s.stageName })))
      .sort((a, b) => (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3));
  }, [itk, currentOrder]);

  const worstSeverity = useMemo<AlertSeverity | undefined>(() => {
    if (risks.some((r) => r.severity === 'high')) return 'critical';
    if (risks.some((r) => r.severity === 'medium')) return 'warning';
    if (risks.some((r) => r.severity === 'low')) return RISK_TO_ALERT.low;
    return undefined;
  }, [risks]);

  const lastNdviDate = useMemo(() => {
    const valid = indicators
      .filter((d) => typeof d.ndvi === 'number' && (d.ndvi as number) > 0)
      .map((d) => d.date)
      .sort((a, b) => a.localeCompare(b));
    return valid[valid.length - 1];
  }, [indicators]);

  return (
    <Box sx={{ pb: 1 }}>
      <HealthSynthesis
        ndvi={ndvi}
        worstSeverity={worstSeverity}
        lastNdviDate={lastNdviDate}
        currentStageName={itk?.currentStage?.stageName}
      />

      <SectionTitle n="01" title="Risques & recommandations" />
      <RiskAdviceList risks={risks} />

      <SectionTitle n="02" title="Évolution de la végétation" />
      <NdviTrend indicators={indicators} />
    </Box>
  );
};
