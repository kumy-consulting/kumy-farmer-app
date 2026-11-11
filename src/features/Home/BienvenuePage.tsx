import type { FunctionComponent } from 'react';

import LogoutRounded from '@mui/icons-material/LogoutRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { ENCRE_DOUCE, FEUILLE, MENTHE, VERT_PROFOND } from '@/features/Home/components/carteAttente.styles';
import { CarteBonnesPratiques } from '@/features/Home/components/CarteBonnesPratiques';
import { CarteEtudeDeSol } from '@/features/Home/components/CarteEtudeDeSol';
import { CarteParcours } from '@/features/Home/components/CarteParcours';
import { initiales } from '@/features/Home/initiales';
import { useEtudeDeSol } from '@/features/Home/useEtudeDeSol';
import { CarteRattachementVue } from '@/features/Rattachement/CarteRattachement';
import { rattachementAFaire, useRattachement } from '@/features/Rattachement/useRattachement';
import { useAuthStore } from '@/shared/stores/authStore';
import { SUPPORT_TEL_HREF, SUPPORT_TELEPHONE_LOCAL } from '@/shared/support';
import { error } from '@/theme/colors';

/**
 * Le seul écran d'un compte auto-inscrit que personne n'a encore adopté.
 *
 * Sans domaine ni technicien, le tableau de bord n'aurait rien à montrer et les
 * quatre onglets mèneraient à des écrans vides. Un écran qui explique la suite
 * vaut mieux que quatre qui ne disent rien.
 *
 * Il se lit de haut en bas comme une liste de priorités : où en est le compte,
 * ce qu'il faut faire d'abord, ce qu'on peut demander, ce qu'on peut lire. **Un
 * seul geste porte une bande verte pleine à la fois** : tant que l'identité
 * reste à confirmer, c'est elle, et l'étude de sol passe en bande claire.
 */
export const BienvenuePage: FunctionComponent = () => {
  const nomComplet = useAuthStore((s) => s.user?.displayName);
  const prenom = nomComplet?.split(' ')[0];
  const telephone = useAuthStore((s) => s.user?.phone);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const etudeDeSol = useEtudeDeSol();
  const rattachement = useRattachement();

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #0E7A67 0%, #0C6E5C 50%, #0A6152 100%)',
      }}
    >
      {/* La tête de l'accueil : cet écran ne ressemble pas à l'accueil, il le
          remplace tant que l'exploitation n'existe pas, et il en porte donc
          l'identité. Le texte reste blanc plein — sur ce vert, chaque cran
          d'opacité passe sous le seuil de contraste en plein soleil. */}
      <Box
        sx={{
          flex: 'none',
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 10px), 30px) 24px 22px',
          color: '#FFFFFF',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.25}>
          <Typography
            noWrap
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              minWidth: 0,
            }}
          >
            {prenom ? `Bonjour ${prenom}` : 'Bonjour'}
          </Typography>

          {/* Les initiales : c'est SON dossier. Le rond n'a pas de libellé
              visible, l'étiquette accessible le porte. */}
          <Box
            component="button"
            type="button"
            aria-label="Mon profil"
            onClick={() => navigate('/mon-espace/informations')}
            sx={{
              appearance: 'none',
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              border: '1.5px solid rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.14)',
              font: 'inherit',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#FFFFFF',
              cursor: 'pointer',
              '&:active': { background: 'rgba(255,255,255,0.24)' },
              '&:focus-visible': { outline: '2px solid #FFFFFF', outlineOffset: 2 },
            }}
          >
            {initiales(nomComplet) || <PersonRounded sx={{ fontSize: 20 }} />}
          </Box>
        </Stack>

        <Typography
          component="h1"
          sx={{
            mt: 1.75,
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 'clamp(22px, 6.2vw, 26px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            maxWidth: '16ch',
          }}
        >
          Votre exploitation reste à ouvrir
        </Typography>
      </Box>

      {/* La feuille : tout ce qui reste sous la tête. Elle défile quand le
          téléphone est trop court — rogner une carte serait pire. */}
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: FEUILLE,
          borderRadius: '26px 26px 0 0',
          px: 2,
          pt: 2,
          pb: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        }}
      >
        <Stack spacing={1.5}>
          <CarteParcours telephone={telephone} />

          <CarteRattachementVue rattachement={rattachement} />

          <CarteEtudeDeSol
            requestedAt={etudeDeSol.requestedAt}
            isLoading={etudeDeSol.isLoading}
            isSending={etudeDeSol.isSending}
            error={etudeDeSol.error}
            demander={() => void etudeDeSol.demander()}
            secondaire={rattachementAFaire(rattachement.etat)}
          />

          <CarteBonnesPratiques onOuvrir={() => navigate('/bonnes-pratiques')} />
        </Stack>

        {/* Le pied : où joindre Kumy, puis partir. La déconnexion n'a pas
            d'autre place sur ce compte — Mon espace n'est pas encore ouvert —,
            mais elle n'a pas à peser : un lien rouge, pas un bouton. */}
        <Stack alignItems="center" sx={{ mt: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ fontSize: 13, color: ENCRE_DOUCE }}>
            <span>Une question ?</span>
            <Box
              component="a"
              href={SUPPORT_TEL_HREF}
              aria-label={`Appeler Kumy au ${SUPPORT_TELEPHONE_LOCAL}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                minHeight: 36,
                px: 1.5,
                borderRadius: '999px',
                background: MENTHE,
                color: VERT_PROFOND,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
                '& svg': { fontSize: 17 },
                '&:active': { background: '#D3EDE4' },
                '&:focus-visible': { outline: `2px solid ${VERT_PROFOND}`, outlineOffset: 2 },
              }}
            >
              <PhoneOutlined aria-hidden />
              {SUPPORT_TELEPHONE_LOCAL}
            </Box>
          </Stack>

          <Box
            component="button"
            type="button"
            onClick={() => void logout()}
            sx={{
              appearance: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              mt: 1.25,
              minHeight: 40,
              px: 1.5,
              border: 0,
              borderRadius: '12px',
              background: 'none',
              font: 'inherit',
              fontSize: 13.5,
              fontWeight: 600,
              color: error[40],
              cursor: 'pointer',
              '& svg': { fontSize: 17 },
              '&:active': { background: 'rgba(186,26,26,0.06)' },
              '&:focus-visible': { outline: `2px solid ${error[40]}`, outlineOffset: 2 },
            }}
          >
            <LogoutRounded aria-hidden />
            Se déconnecter
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};
