import type { FunctionComponent, ReactNode } from 'react';

import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { styled } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';

/** Hauteur de la barre (hors débordement du bouton central + safe-area). */
export const NAV_HEIGHT = 66;

const CREAM = '#F7F4E9';
const MINT = '#93F4E0';

/* --------------------------------------------------------------------------
 * Barre de navigation basse « Kumy » — teal forêt, coins arrondis, bouton
 * central proéminent portant la pousse de la marque (Domaines). Inspirée du
 * langage organique/agri de la suite AgriPilot.
 * ------------------------------------------------------------------------ */

const Nav = styled('nav')({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1200,
  height: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
  pointerEvents: 'none',
  animation: 'navRise 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both',
  '@keyframes navRise': {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const Bar = styled('div')({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '10px 26px 0',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  background: 'linear-gradient(180deg, #0A5647 0%, #05372C 100%)',
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  boxShadow: '0 -10px 34px rgba(0, 28, 22, 0.30)',
  // Liseré haut lumineux + fine texture de profondeur.
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(147,244,224,0.45), transparent)',
    borderRadius: 1,
  },
});

const Item = styled('button', { shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>(
  ({ active }) => ({
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    flex: 1,
    maxWidth: 96,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    paddingTop: 8,
    color: active ? CREAM : 'rgba(198,224,215,0.60)',
    transition: 'color 0.25s ease, transform 0.15s ease',
    fontFamily: "'Ubuntu', sans-serif",
    '& svg': {
      fontSize: 25,
      transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      transform: active ? 'translateY(-1px) scale(1.04)' : 'none',
      filter: active ? 'drop-shadow(0 4px 10px rgba(147,244,224,0.45))' : 'none',
    },
    '&:active': { transform: 'scale(0.94)' },
    '@media (hover: hover)': { '&:hover': { color: CREAM } },
  }),
);

const ItemLabel = styled('span', { shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>(
  ({ active }) => ({
    fontSize: 10.5,
    fontWeight: active ? 700 : 500,
    letterSpacing: '0.02em',
    lineHeight: 1,
  }),
);

/** Point indicateur d'onglet actif. */
const Dot = styled('span', { shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>(
  ({ active }) => ({
    width: 5,
    height: 5,
    borderRadius: '50%',
    marginTop: 2,
    background: MINT,
    boxShadow: '0 0 8px rgba(147,244,224,0.8)',
    opacity: active ? 1 : 0,
    transform: active ? 'scale(1)' : 'scale(0.2)',
    transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
  }),
);

const Center = styled('button')({
  all: 'unset',
  boxSizing: 'border-box',
  cursor: 'pointer',
  flexShrink: 0,
  width: 92,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 5,
  fontFamily: "'Ubuntu', sans-serif",
  '&:active .kumy-fab': { transform: 'translateY(-24px) scale(0.93)' },
});

const Fab = styled('span', { shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>(
  ({ active }) => ({
    position: 'relative',
    marginTop: -30,
    width: 62,
    height: 62,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #14a08b 0%, #0a6a59 55%, #075143 100%)',
    border: `2px solid ${active ? 'rgba(147,244,224,0.85)' : 'rgba(147,244,224,0.35)'}`,
    boxShadow: active
      ? '0 12px 26px rgba(0,50,40,0.5), 0 0 0 6px rgba(147,244,224,0.12), 0 2px 0 rgba(255,255,255,0.25) inset'
      : '0 12px 26px rgba(0,50,40,0.5), 0 2px 0 rgba(255,255,255,0.22) inset',
    transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), border-color 0.25s ease, box-shadow 0.25s ease',
    // Halo doux sous le bouton.
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '-9px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(20,160,139,0.35) 0%, transparent 70%)',
      zIndex: -1,
    },
    // Anneau pointillé tournant (accent organique).
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '-7px',
      borderRadius: '50%',
      border: '1px dashed rgba(147,244,224,0.45)',
      animation: 'fabRing 22s linear infinite',
    },
    '@keyframes fabRing': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    '@media (prefers-reduced-motion: reduce)': { '&::after': { animation: 'none' } },
    '& svg': { display: 'block' },
  }),
);

const CenterLabel = styled('span', { shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>(
  ({ active }) => ({
    fontSize: 10.5,
    fontWeight: active ? 700 : 600,
    letterSpacing: '0.02em',
    lineHeight: 1,
    marginTop: -1,
    color: active ? CREAM : 'rgba(210,231,225,0.78)',
    transition: 'color 0.25s ease',
  }),
);

/** Conteneur centré du bouton, superposé à la barre (pointer-events actifs). */
const CenterWrapper = styled('div')({
  position: 'absolute',
  left: '50%',
  top: 0,
  transform: 'translateX(-50%)',
  pointerEvents: 'auto',
  display: 'flex',
  justifyContent: 'center',
});

/** Pousse Kumy (deux feuilles + tige), reprise de la marque. */
const Sprout: FunctionComponent = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 22V10.5" stroke={CREAM} strokeWidth="2.1" strokeLinecap="round" />
    <path d="M11.6 13.4C7.9 13.4 5.4 11 5.4 6.6c4 0 6.2 2.6 6.2 6.8Z" fill={CREAM} />
    <path d="M12.4 11.4c3.4 0 5.9-2.3 5.9-6.4-3.7 0-5.9 2.6-5.9 6.4Z" fill="#EAF7F1" />
  </svg>
);

interface TabDef {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
}

const SIDE_TABS: Array<'left' | 'right'> = ['left', 'right'];

export const BottomNav: FunctionComponent = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

  const left: TabDef = { key: 'accueil', label: 'Accueil', path: '/', icon: <HomeRoundedIcon /> };
  const right: TabDef = { key: 'mon-espace', label: 'Mon espace', path: '/mon-espace', icon: <PersonRoundedIcon /> };
  const sides = { left, right };

  const domainesActive = isActive('/domaines');

  return (
    <Nav aria-label="Navigation principale">
      <Bar>
        {SIDE_TABS.map((side) => {
          const tab = sides[side];
          const active = isActive(tab.path);
          return (
            <Item
              key={tab.key}
              type="button"
              active={active}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(tab.path)}
            >
              {tab.icon}
              <ItemLabel active={active}>{tab.label}</ItemLabel>
              <Dot active={active} />
            </Item>
          );
        })}
      </Bar>

      {/* Bouton central rendu après la barre pour déborder par-dessus. */}
      <CenterWrapper>
        <Center
          type="button"
          aria-label="Domaines"
          aria-current={domainesActive ? 'page' : undefined}
          onClick={() => navigate('/domaines')}
        >
          <Fab className="kumy-fab" active={domainesActive}>
            <Sprout />
          </Fab>
          <CenterLabel active={domainesActive}>Domaines</CenterLabel>
        </Center>
      </CenterWrapper>
    </Nav>
  );
};
