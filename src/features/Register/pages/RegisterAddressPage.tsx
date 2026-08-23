import { useCallback, useEffect, useRef, useState, type FunctionComponent } from 'react';

import HolidayVillageRoundedIcon from '@mui/icons-material/HolidayVillageRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { Box, Stack } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import { ProfileSelect } from '@/features/Onboarding/components/ProfileSelect';
import { onboardingApi, type ReferentialItem } from '@/features/Onboarding/onboarding.api';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { registerApi } from '@/features/Register/register.api';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

/**
 * L'adresse administrative, en trois niveaux dépendants.
 *
 * La remise à zéro de la cascade vit dans le store (`setAdresse`) : elle est
 * trop facile à oublier ici, et la laisser à l'écran signifierait la réécrire
 * à chaque nouvel appelant.
 *
 * Ni district ni coordonnées GPS — volontairement non collectés.
 */
export const RegisterAddressPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const registrationToken = useRegisterStore((s) => s.registrationToken);
  const adresse = useRegisterStore((s) => s.adresse);
  const setAdresse = useRegisterStore((s) => s.setAdresse);

  const [regions, setRegions] = useState<ReferentialItem[]>([]);
  const [prefectures, setPrefectures] = useState<ReferentialItem[]>([]);
  const [sousPrefectures, setSousPrefectures] = useState<ReferentialItem[]>([]);
  const [erreurChargement, setErreurChargement] = useState(false);

  // Une réponse lente ne doit jamais écraser une demande plus récente : sur un
  // réseau lent, deux changements de région rapprochés arrivent parfois dans le
  // désordre, et la liste afficherait les préfectures de l'ancienne région
  // pendant que le store porte déjà la nouvelle.
  const demandePrefectures = useRef(0);
  const demandeSousPrefectures = useRef(0);

  const chargerRegions = useCallback(async () => {
    setErreurChargement(false);
    try {
      setRegions(await onboardingApi.getRegions());
    } catch {
      setErreurChargement(true);
    }
  }, []);

  useEffect(() => {
    void chargerRegions();
  }, [chargerRegions]);

  if (!registrationToken) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const handleRegion = async (id: string, name: string) => {
    setAdresse({ regionId: id, regionName: name });
    setPrefectures([]);
    setSousPrefectures([]);
    setErreurChargement(false);
    const ticket = ++demandePrefectures.current;
    // Une sous-préfecture encore en vol pour l'ancienne préfecture ne doit pas
    // non plus pouvoir s'appliquer une fois la région changée.
    demandeSousPrefectures.current += 1;
    try {
      const items = await onboardingApi.getPrefectures(id);
      if (ticket !== demandePrefectures.current) return;
      setPrefectures(items);
    } catch {
      if (ticket !== demandePrefectures.current) return;
      setErreurChargement(true);
    }
  };

  const handlePrefecture = async (id: string, name: string) => {
    setAdresse({ prefectureId: id, prefectureName: name });
    setSousPrefectures([]);
    setErreurChargement(false);
    const ticket = ++demandeSousPrefectures.current;
    try {
      const items = await registerApi.getSousPrefectures(id);
      if (ticket !== demandeSousPrefectures.current) return;
      setSousPrefectures(items);
    } catch {
      if (ticket !== demandeSousPrefectures.current) return;
      setErreurChargement(true);
    }
  };

  const estValide = Boolean(
    adresse.regionId && adresse.prefectureId && adresse.sousPrefectureId,
  );

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
        <BackButton onClick={() => navigate(ROUTES_INSCRIPTION.profil)} label="Retour au profil" />
      </Box>

      <OnboardingStepper current={2} total={4} />

      <Medallion>
        <PlaceOutlinedIcon />
      </Medallion>

      <Eyebrow>Localité</Eyebrow>

      <Title>Où cultivez-vous ?</Title>

      <Subtitle sx={{ mb: 3 }}>Votre région, votre préfecture et votre sous-préfecture</Subtitle>

      <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
        <ProfileSelect
          label="Région"
          value={adresse.regionId ?? ''}
          options={regions}
          onChange={(id, name) => void handleRegion(id, name)}
          placeholder="Sélectionnez votre région"
          icon={<PublicRoundedIcon />}
        />

        <ProfileSelect
          label="Préfecture"
          value={adresse.prefectureId ?? ''}
          options={prefectures}
          onChange={(id, name) => void handlePrefecture(id, name)}
          disabled={!adresse.regionId}
          placeholder="Sélectionnez votre préfecture"
          icon={<LocationCityRoundedIcon />}
        />

        <ProfileSelect
          label="Sous-préfecture"
          value={adresse.sousPrefectureId ?? ''}
          options={sousPrefectures}
          onChange={(id, name) => setAdresse({ sousPrefectureId: id, sousPrefectureName: name })}
          disabled={!adresse.prefectureId}
          placeholder="Sélectionnez votre sous-préfecture"
          icon={<HolidayVillageRoundedIcon />}
        />
      </Stack>

      {erreurChargement && (
        <ErrorBanner mb={0}>
          Impossible de charger la liste. Vérifiez votre connexion.{' '}
          <TextLink
            onClick={() => void chargerRegions()}
            sx={{ p: 0, minWidth: 0, fontSize: 12.75, verticalAlign: 'baseline' }}
          >
            Réessayer
          </TextLink>
        </ErrorBanner>
      )}

      <PrimaryButton
        onClick={() => navigate(ROUTES_INSCRIPTION.pin)}
        disabled={!estValide}
        sx={{ mt: 3 }}
      >
        Continuer
      </PrimaryButton>
    </OnboardingLayout>
  );
};
