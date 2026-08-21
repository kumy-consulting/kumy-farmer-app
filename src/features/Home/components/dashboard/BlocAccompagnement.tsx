import type { FunctionComponent } from 'react';

import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { Accompagnement } from '../../home.dashboard.types';
import { formatJour, formatSurvenu } from '../../home.echeance';
import { SectionHeader } from '../SectionHeader';
import { Carte, LienVoir } from './dashboardVisuals';

interface BlocAccompagnementProps {
  accompagnement: Accompagnement;
  onVoirVisite: () => void;
}

const initiales = (nom: string): string =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');

/** Ligne « libellé → valeur » — même grammaire que la fiche personnelle. */
const Ligne: FunctionComponent<{ label: string; valeur: string; sourdine?: boolean }> = ({
  label,
  valeur,
  sourdine,
}) => (
  <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
    <Typography sx={{ fontSize: 13, color: '#5C5F5E', flexShrink: 0 }}>{label}</Typography>
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 13.5,
        fontWeight: sourdine ? 500 : 700,
        color: sourdine ? '#5C5F5E' : '#1A1C1B',
        textAlign: 'right',
        minWidth: 0,
      }}
    >
      {valeur}
    </Typography>
  </Stack>
);

/**
 * L'état du suivi par le technicien (§9).
 *
 * L'application n'est pas un outil de surveillance : elle matérialise une
 * relation. Le bloc s'ouvre donc sur **quelqu'un** — initiales, nom, rôle — et
 * non sur un statut. Sans ce visage, le bloc n'était qu'un état vide déguisé en
 * carte : trois paragraphes pour dire qu'il ne se passe rien.
 *
 * Deux points d'honnêteté :
 *
 * 1. **La prochaine visite est inconnue, pas inexistante.** Aucun endpoint de
 *    visite n'est ouvert au rôle FARMER. « Pas encore fixée » dit ce qu'on sait ;
 *    « Non planifiée » affirmerait qu'il n'y en a pas.
 * 2. **Le lien n'apparaît que s'il mène quelque part.** Il pointait vers les
 *    domaines faute de mieux tout en s'annonçant « Voir l'accompagnement » — un
 *    libellé qui promettait une page inexistante. Sans dernière visite, il n'y a
 *    rien à ouvrir, donc rien à proposer.
 */
export const BlocAccompagnement: FunctionComponent<BlocAccompagnementProps> = ({
  accompagnement,
  onVoirVisite,
}) => {
  const { prochaineVisite, derniereVisite, technicien } = accompagnement;
  const nom = technicien ?? derniereVisite?.author ?? null;

  const derniere = derniereVisite
    ? [formatSurvenu(derniereVisite.at), derniereVisite.advice].filter(Boolean).join(' · ')
    : 'Aucune enregistrée';

  return (
    <div>
      <SectionHeader title="Mon accompagnement" />
      <Carte pad={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            aria-hidden
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: nom ? 'linear-gradient(140deg, #018675 0%, #016557 100%)' : 'rgba(1,134,117,0.10)',
              border: nom ? 'none' : '1.5px solid rgba(1,134,117,0.28)',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              '& svg': { fontSize: 22, color: '#016557' },
            }}
          >
            {nom ? initiales(nom) : <PersonOutlineRounded />}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 15.5,
                fontWeight: 700,
                color: '#1A1C1B',
                lineHeight: 1.25,
              }}
              noWrap
            >
              {nom ?? 'Votre technicien'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.15 }} noWrap>
              {nom ? 'Votre technicien' : 'Son nom s’affichera après sa première visite'}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 1.6, pt: 0.6, borderTop: '1px solid rgba(55,75,70,0.08)' }}>
          <Ligne label="Dernière visite" valeur={derniere} sourdine={!derniereVisite} />
          <Ligne
            label="Prochaine visite"
            valeur={
              prochaineVisite
                ? `${formatJour(prochaineVisite.date)}${prochaineVisite.domaine ? ` · ${prochaineVisite.domaine}` : ''}`
                : 'Pas encore fixée'
            }
            sourdine={!prochaineVisite}
          />

          {/* Pourquoi il vient. Une date de visite sans motif ne permet pas de
              préparer la parcelle ; c'est la ligne qui rend le passage utile
              avant qu'il ait lieu. */}
          {prochaineVisite?.objectif && (
            <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', lineHeight: 1.45, mt: 0.4 }}>
              {prochaineVisite.objectif}
            </Typography>
          )}
        </Box>

        {derniereVisite?.target && <LienVoir onClick={onVoirVisite}>Voir la dernière visite</LienVoir>}
      </Carte>
    </div>
  );
};
