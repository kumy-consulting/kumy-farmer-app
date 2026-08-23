import { useState, type FunctionComponent } from 'react';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { Box, InputAdornment, Stack, TextField } from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { Navigate, useNavigate } from 'react-router-dom';

import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

const AGE_MIN = 15;
const AGE_MAX = 100;
const LONGUEUR_NOM_MIN = 2;

/** Habillage capsule commun aux deux champs texte, aligné sur `ProfileSelect`. */
const champSx = {
  width: '100%',
  maxWidth: 395,
  '& .MuiInputLabel-root': {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 500,
    color: 'rgba(55,75,70,0.62)',
    '&.Mui-focused': { color: '#016557' },
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: 'rgba(20,40,35,0.92)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)',
    boxShadow: '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
    '& fieldset': { borderColor: 'rgba(55,75,70,0.08)', borderWidth: 1 },
    '&:hover fieldset': { borderColor: 'rgba(1,134,117,0.28)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(1,134,117,0.38)', borderWidth: 1 },
  },
} as const;

const datePickerSlotProps = {
  textField: {
    fullWidth: true,
    label: 'Date de naissance',
    InputLabelProps: { shrink: true },
    InputProps: {
      startAdornment: (
        <InputAdornment position="start" sx={{ ml: 0.25, mr: 0.5 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 21, color: '#016557' }} />
        </InputAdornment>
      ),
    },
    sx: {
      ...champSx,
      '& .MuiPickersInputBase-root': {
        borderRadius: '18px',
        paddingLeft: '16px',
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 15,
        fontWeight: 600,
        color: 'rgba(20,40,35,0.92)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)',
        boxShadow: '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
      },
      '& .MuiPickersSectionList-root': { padding: '14px 0' },
      '& .MuiPickersOutlinedInput-notchedOutline': {
        borderColor: 'rgba(55,75,70,0.08)',
        borderWidth: 1,
      },
      '& .MuiInputAdornment-positionEnd': { display: 'none' },
    },
  },
} as const;

/**
 * Prénom, nom, date de naissance.
 *
 * En branche `pending` / `inactive`, les champs arrivent pré-remplis : le
 * partenaire a saisi ces informations, l'agriculteur les confirme ou les
 * corrige. En branche `absent`, tout est vierge.
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

  const estValide =
    firstName.trim().length >= LONGUEUR_NOM_MIN &&
    lastName.trim().length >= LONGUEUR_NOM_MIN &&
    Boolean(birthDate?.isValid());

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
        <Medallion>
          <BadgeOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Profil</Eyebrow>

      <Title>Qui êtes-vous ?</Title>

      <Subtitle sx={{ mb: 3 }}>Ces informations figureront sur votre carte d’agriculteur</Subtitle>

      <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
        <TextField
          label="Prénom"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={champSx}
        />

        <TextField
          label="Nom"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={champSx}
        />

        <MobileDatePicker
          value={birthDate}
          onChange={setBirthDate}
          format="DD/MM/YYYY"
          minDate={aujourdhui.subtract(AGE_MAX, 'year')}
          maxDate={aujourdhui.subtract(AGE_MIN, 'year')}
          slotProps={datePickerSlotProps}
        />
      </Stack>

      <PrimaryButton onClick={handleContinue} disabled={!estValide} sx={{ mt: 3 }}>
        Continuer
      </PrimaryButton>
    </OnboardingLayout>
  );
};
