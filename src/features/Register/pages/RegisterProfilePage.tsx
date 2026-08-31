import { useState, type FunctionComponent, type ReactNode } from 'react';

import { Box, Stack, TextField, Typography } from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { Navigate, useNavigate } from 'react-router-dom';

import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import { PrimaryButton, Subtitle, Title } from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

const AGE_MIN = 15;
const AGE_MAX = 100;
const LONGUEUR_NOM_MIN = 2;

/**
 * Une rubrique de la carte : le libellé en petites capitales, la valeur sous un
 * filet.
 *
 * Trois capsules blanches empilées dans une carte blanche, c'était une surface
 * dans une surface dans une surface. Le filet dit la même chose — « écrivez
 * ici » — sans ajouter de boîte, et c'est la forme qu'ont les rubriques d'une
 * pièce d'identité, ce que cet écran est en train de fabriquer.
 *
 * Le filet passe de 1 px sourd à 2 px teal à la saisie : sur un téléphone en
 * plein soleil, un contour à 8 % d'opacité n'existe pas, un trait plein si.
 */
const rubriqueSx = {
  width: '100%',
  '& .MuiInputLabel-root': {
    position: 'static',
    transform: 'none',
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: '#5C5F5E',
    '&.Mui-focused': { color: '#016557' },
  },
  // Le sélecteur du picker n'est pas le même que celui d'un champ texte : en
  // MUI X v9 la saisie de date est une `PickersInputBase`, qui hérite ici du
  // gabarit « filled » du thème et arrivait donc avec le filet noir par défaut.
  '& .MuiInput-root, & .MuiPickersInputBase-root': {
    marginTop: '2px',
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 16.5,
    fontWeight: 600,
    color: '#1A1C1B',
    '&::before': { borderBottom: '1px solid rgba(55,75,70,0.18)' },
    '&:hover:not(.Mui-disabled)::before': { borderBottom: '1px solid rgba(1,134,117,0.45)' },
    '&::after': { borderBottom: '2px solid #018675' },
  },
  '& input, & .MuiPickersSectionList-root': { padding: '7px 0 9px' },
  // Le calendrier de fin de ligne : deux rubriques sur trois n'ont pas d'icône,
  // et la troisième s'ouvre en touchant la ligne comme les autres. L'icône ne
  // faisait qu'annoncer un geste déjà disponible.
  '& .MuiInputAdornment-positionEnd': { display: 'none' },
} as const;

/**
 * Le gabarit `JJ/MM/AAAA` d'une date encore vide.
 *
 * MUI masque ce gabarit (`opacity: 0`) tant que le champ n'a pas le focus, pour
 * qu'il se comporte comme un vrai placeholder. Sur un sélecteur *mobile*, ce
 * focus n'arrive jamais : toucher la ligne ouvre une boîte de dialogue. La
 * rubrique restait donc une ligne vide, sans rien qui dise qu'elle attend
 * quelque chose ni sous quelle forme.
 */
const dateVideSx = {
  '& .MuiPickersInputBase-sectionsContainer': { opacity: 1 },
  '& .MuiPickersSectionList-root': { color: 'rgba(55,75,70,0.38)' },
} as const;

const Rubrique: FunctionComponent<{ children: ReactNode; aide?: string }> = ({ children, aide }) => (
  <Box sx={{ width: '100%', position: 'relative' }}>
    {children}
    {aide && (
      <Typography
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          fontSize: 11,
          fontWeight: 500,
          color: '#8F9291',
          lineHeight: '16px',
        }}
      >
        {aide}
      </Typography>
    )}
  </Box>
);

/** Les initiales, dès qu'on a de quoi les tirer. */
const initiales = (prenom: string, nom: string): string =>
  `${prenom.trim()[0] ?? ''}${nom.trim()[0] ?? ''}`.toUpperCase();

/**
 * Prénom, nom, date de naissance.
 *
 * En branche `pending` / `inactive`, les champs arrivent pré-remplis : le
 * partenaire a saisi ces informations, l'agriculteur les confirme ou les
 * corrige. En branche `absent`, tout est vierge.
 *
 * **Le formulaire est la carte.** L'écran promettait « ces informations
 * figureront sur votre carte d'agriculteur » en petit gris, sous un médaillon
 * de 92 px qui, lui, ne portait aucune information. La promesse est maintenant
 * l'objet même que l'on remplit : disque d'initiales et nom se composent
 * pendant la frappe, dans la grammaire exacte de la carte que l'agriculteur
 * retrouvera dans Mon espace. Rien n'a été ajouté à l'écran — le médaillon a
 * été retiré et sa place rendue au travail.
 *
 * Ce que le titre et le sous-titre disent une fois lu, ils n'ont plus à le
 * répéter : ils se replient à l'ouverture du clavier, et c'est la carte qui
 * reste sous les yeux.
 */
export const RegisterProfilePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const registrationToken = useRegisterStore((s) => s.registrationToken);
  const profilMemorise = useRegisterStore((s) => s.profil);
  const setProfil = useRegisterStore((s) => s.setProfil);

  const [firstName, setFirstName] = useState(profilMemorise.firstName);
  const [lastName, setLastName] = useState(profilMemorise.lastName);
  const [birthDate, setBirthDate] = useState<Dayjs | null>(
    profilMemorise.birthDate ? dayjs(profilMemorise.birthDate) : null,
  );

  // Arrivée directe sur l'URL : sans jeton, il n'y a pas d'inscription en cours.
  if (!registrationToken) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const prenomOk = firstName.trim().length >= LONGUEUR_NOM_MIN;
  const nomOk = lastName.trim().length >= LONGUEUR_NOM_MIN;
  const dateOk = Boolean(birthDate?.isValid());
  const estValide = prenomOk && nomOk && dateOk;

  const nomAffiche = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
  const marque = initiales(firstName, lastName);

  // Ce qui manque, nommé — mais seulement une fois le formulaire entamé. Sur une
  // carte vierge, la phrase ne ferait que répéter ce que l'écran montre déjà ;
  // c'est à mi-parcours qu'un bouton éteint devient une énigme.
  const manques = [
    !prenomOk && 'votre prénom',
    !nomOk && 'votre nom',
    !dateOk && 'votre date de naissance',
  ].filter(Boolean) as string[];
  const entame = Boolean(firstName || lastName || birthDate);

  const handleContinue = () => {
    if (!estValide || !birthDate) return;
    setProfil({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate.format('YYYY-MM-DD'),
    });
    navigate(ROUTES_INSCRIPTION.adresse);
  };

  const aujourdhui = dayjs();

  return (
    <OnboardingLayout>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={() => navigate(ROUTES_INSCRIPTION.code)} label="Retour au code" />
      </Box>

      <OnboardingStepper current={1} total={4} />

      <CollapseOnKeyboard>
        <Title sx={{ mt: 1 }}>Qui êtes-vous ?</Title>
        <Subtitle sx={{ mb: 0 }}>Écrivez vos noms comme sur votre pièce d’identité</Subtitle>
      </CollapseOnKeyboard>

      <Box
        sx={{
          width: '100%',
          maxWidth: 395,
          mt: 2.5,
          p: 2.25,
          borderRadius: '22px',
          background: '#FFFFFF',
          border: '1px solid rgba(55,75,70,0.07)',
          boxShadow: '0 10px 26px rgba(1,134,117,0.10)',
        }}
      >
        {/* L'en-tête EST l'aperçu : il se compose au fil de la frappe. */}
        <Stack direction="row" alignItems="center" spacing={1.75}>
          <Box
            aria-hidden
            sx={{
              flexShrink: 0,
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.02em',
              // Vide, le disque est un contour en pointillé : une place réservée.
              // Rempli, il devient la pastille pleine de la vraie carte. C'est le
              // seul mouvement de l'écran, et il récompense la frappe.
              color: marque ? '#FFFFFF' : 'transparent',
              background: marque
                ? 'linear-gradient(140deg, #018675 0%, #016557 100%)'
                : 'transparent',
              border: marque ? 'none' : '1.5px dashed rgba(1,134,117,0.35)',
              boxShadow: marque ? '0 0 0 5px rgba(1,134,117,0.09)' : 'none',
              transition: 'background 0.25s ease, color 0.25s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            {marque}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 'clamp(15px, 4.4vw, 19px)',
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
                color: nomAffiche ? '#1A1C1B' : 'rgba(55,75,70,0.38)',
                overflowWrap: 'anywhere',
              }}
            >
              {nomAffiche || 'Votre nom'}
            </Typography>
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5C5F5E',
                mt: 0.2,
              }}
            >
              Carte d’agriculteur
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ height: '1px', background: 'rgba(55,75,70,0.10)', my: 2 }} />

        <Stack spacing={2}>
          <Rubrique>
            <TextField
              variant="standard"
              label="Prénom"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={rubriqueSx}
            />
          </Rubrique>

          <Rubrique>
            <TextField
              variant="standard"
              label="Nom"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={rubriqueSx}
            />
          </Rubrique>

          {/* La limite d'âge est dite avant d'être opposée : le sélecteur refuse
              en silence une date trop récente, et un refus muet se lit comme une
              panne. */}
          <Rubrique aide={`${AGE_MIN} ans minimum`}>
            <MobileDatePicker
              value={birthDate}
              onChange={setBirthDate}
              format="DD/MM/YYYY"
              minDate={aujourdhui.subtract(AGE_MAX, 'year')}
              maxDate={aujourdhui.subtract(AGE_MIN, 'year')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'standard',
                  label: 'Date de naissance',
                  // Pas d'`InputLabelProps` ici : le champ de date n'est pas un
                  // TextField mais un `PickersTextField`, qui ne connaît pas
                  // cette propriété — et le libellé n'en a pas besoin, `rubriqueSx`
                  // le sort déjà de sa position flottante.
                  sx: birthDate ? rubriqueSx : { ...rubriqueSx, ...dateVideSx },
                },
              }}
            />
          </Rubrique>
        </Stack>
      </Box>

      <PrimaryButton onClick={handleContinue} disabled={!estValide} sx={{ mt: 2.5 }}>
        Continuer
      </PrimaryButton>

      {entame && manques.length > 0 && (
        <Typography
          sx={{
            mt: 1.25,
            fontSize: 12.5,
            fontWeight: 500,
            color: '#5C5F5E',
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          Il manque encore {manques.join(', ')}.
        </Typography>
      )}
    </OnboardingLayout>
  );
};
