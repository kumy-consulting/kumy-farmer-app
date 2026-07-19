import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/shared/db/database';

import { clearRememberedPhone, getRememberedPhone, setRememberedPhone } from './rememberedPhone.service';

describe('rememberedPhone', () => {
  beforeEach(async () => {
    await db.authPrefs.clear();
  });
  it('persiste puis relit', async () => {
    await setRememberedPhone('+224622201362');
    expect(await getRememberedPhone()).toBe('+224622201362');
  });
  it('efface', async () => {
    await setRememberedPhone('+224622201362');
    await clearRememberedPhone();
    expect(await getRememberedPhone()).toBeNull();
  });
});
