import { useCallback, useEffect, useState, type FunctionComponent } from 'react';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { Box, InputAdornment, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { Navigate, useNavigate } from 'react-router-dom';

import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import { ProfileSelect } from '@/features/Onboarding/components/ProfileSelect';
import { onboardingApi, type ReferentialItem } from '@/features/Onboarding/onboarding.api';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { BackButton } from '@/shared/components/BackButton';

const MIN_AGE = 15;
const MAX_AGE = 100;

/** Révélation en fondu montant, mise en cascade via `animation-delay`. */
const FieldReveal = styled(Box)({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  animation: 'fieldIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both',
  '@keyframes fieldIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

// Habillage « capsule » du MobileDatePicker (MUI X v9 → classes MuiPickers*),
// aligné sur ProfileSelect / FieldCapsule : radius 18, fond dégradé, glow teal.
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
      width: '100%',
      maxWidth: 395,
      '& .MuiInputLabel-root': {
        fontFamily: "'Ubuntu', sans-serif",
        fontWeight: 500,
        color: 'rgba(55,75,70,0.62)',
        '&.Mui-focused': { color: '#016557' },
      },
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
        transition: 'all 0.25s ease',
      },
      '& .MuiPickersSectionList-root': { padding: '14px 0' },
      '& .MuiPickersOutlinedInput-notchedOutline': {
        borderColor: 'rgba(55,75,70,0.08)',
        borderWidth: 1,
      },
      '&:hover .MuiPickersOutlinedInput-notchedOutline': { borderColor: 'rgba(1,134,117,0.28)' },
      '& .MuiPickersInputBase-root.Mui-focused': {
        boxShadow:
          '0 10px 28px rgba(1,134,117,0.18), 0 0 0 4px rgba(1,134,117,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
        '& .MuiPickersOutlinedInput-notchedOutline': {
          borderColor: 'rgba(1,134,117,0.38)',
          borderWidth: 1,
        },
      },
      // L'icône de tête suffit ; le champ entier reste tappable.
      '& .MuiInputAdornment-positionEnd': { display: 'none' },
    },
  },
} as const;

export const OnboardingProfilePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const { userData, setProfile } = useOnboardingStore();

  const [birthDate, setBirthDate] = useState<Dayjs | null>(null);
  const [regions, setRegions] = useState<ReferentialItem[]>([]);
  const [prefectures, setPrefectures] = useState<ReferentialItem[]>([]);
  const [regionId, setRegionId] = useState('');
  const [regionName, setRegionName] = useState('');
  const [prefectureId, setPrefectureId] = useState('');
  const [prefectureName, setPrefectureName] = useState('');
  const [loadError, setLoadError] = useState(false);

  // Pré-remplit la date depuis l'éventuelle valeur saisie par l'administrateur.
  useEffect(() => {
    if (userData?.dateOfBirth) setBirthDate(dayjs(userData.dateOfBirth));
  }, [userData?.dateOfBirth]);

  const loadRegions = useCallback(async () => {
    setLoadError(false);
    try {
      setRegions(await onboardingApi.getRegions());
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void loadRegions();
  }, [loadRegions]);

  const handleRegionChange = async (id: string, name: string) => {
    setRegionId(id);
    setRegionName(name);
    // La région change : on invalide la préfecture précédente.
    setPrefectureId('');
    setPrefectureName('');
    setPrefectures([]);
    setLoadError(false);
    try {
      setPrefectures(await onboardingApi.getPrefectures(id));
    } catch {
      setLoadError(true);
    }
  };

  const handlePrefectureChange = (id: string, name: string) => {
    setPrefectureId(id);
    setPrefectureName(name);
  };

  if (!userData) return <Navigate to="/onboarding/invitation" replace />;

  const isValid = Boolean(birthDate && birthDate.isValid() && regionId && prefectureId);
  const today = dayjs();

  const handleSubmit = () => {
    if (!isValid || !birthDate) return;
    setProfile({
      birthDate: birthDate.format('YYYY-MM-DD'),
      regionId,
      regionName,
      prefectureId,
      prefectureName,
    });
    navigate('/onboarding/pin');
  };

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
        <BackButton onClick={() => navigate('/onboarding/welcome')} label="Retour" />
      </Box>

      <OnboardingStepper current={1} total={3} />

      <Medallion>
        <BadgeOutlinedIcon />
      </Medallion>

      <Eyebrow>Profil</Eyebrow>

      <Title>Complétez votre profil</Title>

      <Subtitle sx={{ mb: 3 }}>Renseignez votre date de naissance et votre localité</Subtitle>

      <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
        <FieldReveal sx={{ animationDelay: '0.04s' }}>
          <MobileDatePicker
            value={birthDate}
            onChange={setBirthDate}
            format="DD/MM/YYYY"
            minDate={today.subtract(MAX_AGE, 'year')}
            maxDate={today.subtract(MIN_AGE, 'year')}
            slotProps={datePickerSlotProps}
          />
        </FieldReveal>

        <FieldReveal sx={{ animationDelay: '0.1s' }}>
          <ProfileSelect
            label="Région"
            value={regionId}
            options={regions}
            onChange={(id, name) => void handleRegionChange(id, name)}
            placeholder="Sélectionnez votre région"
            icon={<PublicRoundedIcon />}
          />
        </FieldReveal>

        <FieldReveal sx={{ animationDelay: '0.16s' }}>
          <ProfileSelect
            label="Préfecture"
            value={prefectureId}
            options={prefectures}
            onChange={handlePrefectureChange}
            disabled={!regionId}
            placeholder="Sélectionnez votre préfecture"
            icon={<LocationCityRoundedIcon />}
          />
        </FieldReveal>
      </Stack>

      {loadError && (
        <ErrorBanner mb={0}>
          Impossible de charger la liste. Vérifiez votre connexion.{' '}
          <TextLink
            onClick={() => void loadRegions()}
            sx={{ p: 0, minWidth: 0, fontSize: 12.75, verticalAlign: 'baseline' }}
          >
            Réessayer
          </TextLink>
        </ErrorBanner>
      )}

      <PrimaryButton onClick={handleSubmit} disabled={!isValid} sx={{ mt: 3 }}>
        Continuer
      </PrimaryButton>
    </OnboardingLayout>
  );
};
