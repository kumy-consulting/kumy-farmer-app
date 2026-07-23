import { useCallback, useEffect, useState, type ChangeEvent, type FunctionComponent } from 'react';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { IconButton, InputBase, Stack } from '@mui/material';
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
  FieldCapsule,
  Medallion,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';

const MIN_AGE = 15;
const MAX_AGE = 100;

const DetailInput = styled(InputBase)({
  flex: 1,
  padding: '10px 16px',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 15,
  fontWeight: 500,
  color: 'rgba(20,40,35,0.92)',
  '& input': {
    padding: 0,
    '&::placeholder': {
      color: 'rgba(55,75,70,0.42)',
      opacity: 1,
      fontWeight: 400,
    },
  },
});

const datePickerSlotProps = {
  textField: {
    fullWidth: true,
    sx: {
      maxWidth: 395,
      '& .MuiOutlinedInput-root': {
        borderRadius: '18px',
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 15,
        fontWeight: 600,
        color: 'rgba(20,40,35,0.92)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)',
        boxShadow: '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
        '& fieldset': { borderColor: 'rgba(55,75,70,0.08)' },
        '&:hover fieldset': { borderColor: 'rgba(1,134,117,0.28)' },
        '&.Mui-focused fieldset': { borderColor: 'rgba(1,134,117,0.38)', borderWidth: 1 },
      },
      '& .MuiOutlinedInput-input': { padding: '16px 18px' },
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
  const [addressDetail, setAddressDetail] = useState('');
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
      addressDetail: addressDetail.trim() || null,
    });
    navigate('/onboarding/pin');
  };

  return (
    <OnboardingLayout>
      <IconButton
        onClick={() => navigate('/onboarding/welcome')}
        aria-label="Retour"
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          left: 8,
          color: '#374B46',
          zIndex: 2,
        }}
      >
        <ArrowBackRoundedIcon />
      </IconButton>

      <OnboardingStepper current={1} total={3} />

      <Medallion>
        <BadgeOutlinedIcon />
      </Medallion>

      <Eyebrow>Profil</Eyebrow>

      <Title>Complétez votre profil</Title>

      <Subtitle sx={{ mb: 3 }}>Renseignez votre date de naissance et votre localité</Subtitle>

      <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
        <MobileDatePicker
          label="Date de naissance"
          value={birthDate}
          onChange={setBirthDate}
          format="DD/MM/YYYY"
          minDate={today.subtract(MAX_AGE, 'year')}
          maxDate={today.subtract(MIN_AGE, 'year')}
          slotProps={datePickerSlotProps}
        />

        <ProfileSelect
          label="Région"
          value={regionId}
          options={regions}
          onChange={(id, name) => void handleRegionChange(id, name)}
          placeholder="Sélectionnez votre région"
        />

        <ProfileSelect
          label="Préfecture"
          value={prefectureId}
          options={prefectures}
          onChange={handlePrefectureChange}
          disabled={!regionId}
          placeholder="Sélectionnez votre préfecture"
        />

        <FieldCapsule sx={{ alignItems: 'center' }}>
          <DetailInput
            value={addressDetail}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setAddressDetail(event.target.value)}
            placeholder="Quartier / repère (optionnel)"
            fullWidth
            inputProps={{ 'aria-label': 'Quartier ou repère', autoComplete: 'off' }}
          />
        </FieldCapsule>
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
