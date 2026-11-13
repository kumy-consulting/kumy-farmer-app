import { apiClient } from '@/shared/api/client';

/** Où en est la demande de rattachement de l'agriculteur connecté. */
export interface EtatRattachement {
  statut: 'aucune' | 'en_attente' | 'bloquee' | 'confirmee' | 'refusee';
  /** Échéance du dernier code tiré, `null` s'il n'y en a pas de valable. */
  codeExpireA: string | null;
}

/** Le code à montrer à l'encadreur. Il n'est rendu qu'une fois. */
export interface CodeRattachement {
  code: string;
  expireA: string;
}

interface AttachRequestSelfDto {
  status: 'none' | 'pending' | 'confirmed' | 'rejected';
  blocked: boolean;
  codeExpiresAt: string | null;
}

interface AttachCodeDto {
  code: string;
  expiresAt: string;
}

const STATUTS: Record<AttachRequestSelfDto['status'], EtatRattachement['statut']> = {
  none: 'aucune',
  pending: 'en_attente',
  confirmed: 'confirmee',
  rejected: 'refusee',
};

export const rattachementApi = {
  async etat(): Promise<EtatRattachement> {
    const { data } = await apiClient.get<AttachRequestSelfDto>('/attach-requests/me');
    return {
      // Le blocage prime sur le statut : la demande y reste « en attente ».
      statut: data.blocked ? 'bloquee' : (STATUTS[data.status] ?? 'aucune'),
      codeExpireA: data.codeExpiresAt ?? null,
    };
  },

  async demanderCode(): Promise<CodeRattachement> {
    const { data } = await apiClient.post<AttachCodeDto>('/attach-requests/me/code');
    return { code: data.code, expireA: data.expiresAt };
  },
};
