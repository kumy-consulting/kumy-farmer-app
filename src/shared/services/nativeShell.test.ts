
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { describe, expect, it, vi } from 'vitest';

import { hideNativeSplash, initNativeShell } from './nativeShell';

/**
 * Les plugins sont doublés module par module : ce sont des `Proxy` côté
 * Capacitor, donc `vi.spyOn` ne peut pas s'y accrocher.
 *
 * Sous jsdom, `Capacitor.isNativePlatform()` est faux. Ces tests verrouillent le
 * contrat « no-op sur web » du shell : c'est lui qui permet aux tests existants
 * de tourner sans aucun mock Capacitor.
 */
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(), exitApp: vi.fn() },
}));
vi.mock('@capacitor/keyboard', () => ({
  Keyboard: { setResizeMode: vi.fn() },
  KeyboardResize: { Native: 'native' },
}));
vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: { hide: vi.fn() },
}));
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setStyle: vi.fn(), setBackgroundColor: vi.fn(), setOverlaysWebView: vi.fn() },
  Style: { Light: 'LIGHT' },
}));

describe('nativeShell hors natif', () => {
  it('initNativeShell se résout sans toucher aux plugins', async () => {
    await expect(initNativeShell()).resolves.toBeUndefined();

    expect(StatusBar.setOverlaysWebView).not.toHaveBeenCalled();
    expect(StatusBar.setStyle).not.toHaveBeenCalled();
    expect(StatusBar.setBackgroundColor).not.toHaveBeenCalled();
    expect(Keyboard.setResizeMode).not.toHaveBeenCalled();
    expect(App.addListener).not.toHaveBeenCalled();
  });

  it('hideNativeSplash se résout sans masquer de splash', async () => {
    await expect(hideNativeSplash()).resolves.toBeUndefined();

    expect(SplashScreen.hide).not.toHaveBeenCalled();
  });
});
