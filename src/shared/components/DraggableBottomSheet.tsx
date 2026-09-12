import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { Box } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

/**
 * Feuille inférieure glissable (drag) — pointer events natifs, sans librairie.
 * Portée depuis la PWA ingénieur (`DraggableBottomSheet`). Points d'accroche
 * (snap points) triés, translation par `translateY`, décision au relâchement
 * par vélocité ou proximité.
 */

const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const SNAP_DURATION = 280;
const VELOCITY_THRESHOLD = 0.4; // px/ms
const TAP_THRESHOLD_PX = 6;

const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const Sheet = styled(Box, {
  shouldForwardProp: (p) =>
    p !== 'translateY' &&
    p !== 'isDragging' &&
    p !== 'totalHeightPx' &&
    p !== 'sheetZIndex' &&
    p !== 'bottomOffset',
})<{
  translateY: number;
  isDragging: boolean;
  totalHeightPx: number;
  sheetZIndex: number;
  bottomOffset: number;
}>(({ translateY, isDragging, totalHeightPx, sheetZIndex, bottomOffset }) => ({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: bottomOffset,
  height: totalHeightPx > 0 ? totalHeightPx : '50vh',
  transform: `translateY(${translateY}px)`,
  transition: isDragging ? 'none' : `transform ${SNAP_DURATION}ms ${EASE}`,
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  background: 'linear-gradient(180deg, #FCFDFA 0%, #F5F9F4 100%)',
  boxShadow: '0 -10px 30px rgba(1, 50, 40, 0.16), 0 -1px 0 rgba(255,255,255,0.95) inset',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  willChange: 'transform',
  zIndex: sheetZIndex,
  animation: `${fadeIn} 320ms ease both`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1.5,
    borderRadius: 2,
    background: 'linear-gradient(90deg, transparent 0%, rgba(1,134,117,0.40) 50%, transparent 100%)',
    opacity: 0.7,
    pointerEvents: 'none',
  },
}));

const HandleArea = styled(Box, {
  shouldForwardProp: (p) => p !== 'isDragging',
})<{ isDragging: boolean }>(({ isDragging }) => ({
  position: 'relative',
  flexShrink: 0,
  height: 26,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: isDragging ? 'grabbing' : 'grab',
  touchAction: 'none',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  '&::after': { content: '""', position: 'absolute', inset: 0 },
}));

const HandleBar = styled(Box, {
  shouldForwardProp: (p) => p !== 'isDragging',
})<{ isDragging: boolean }>(({ isDragging }) => ({
  width: 44,
  height: 4,
  borderRadius: 999,
  background: isDragging
    ? 'linear-gradient(90deg, #018675 0%, #016557 100%)'
    : 'linear-gradient(90deg, rgba(1,134,117,0.45) 0%, rgba(1,134,117,0.65) 50%, rgba(1,134,117,0.45) 100%)',
  transition: 'background 200ms ease, transform 180ms ease',
  transform: isDragging ? 'scaleX(1.18)' : 'scaleX(1)',
  boxShadow: isDragging ? '0 2px 6px rgba(1,134,117,0.30)' : '0 1px 2px rgba(1,134,117,0.18)',
}));

const Content = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  overscrollBehavior: 'contain',
});

interface DraggableBottomSheetProps {
  /** Hauteurs d'accroche (px ou longueur CSS "45vh"). Triées ascendant. */
  snapPoints: (number | string)[];
  initialSnap?: number;
  contentBottomPadding?: number;
  bottomOffset?: number;
  zIndex?: number;
  onSnapChange?: (index: number) => void;
  children: ReactNode;
}

const resolveCssLengthPx = (value: number | string): number => {
  if (typeof value === 'number') return value;
  if (typeof window === 'undefined') return 0;
  if (value.endsWith('vh')) return (window.innerHeight * parseFloat(value)) / 100;
  if (value.endsWith('px')) return parseFloat(value);
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style.height = value;
  document.body.appendChild(el);
  const px = el.getBoundingClientRect().height;
  document.body.removeChild(el);
  return px;
};

const computeSortedSnapsPx = (snapPoints: (number | string)[]): number[] =>
  snapPoints.map((p) => resolveCssLengthPx(p)).sort((a, b) => a - b);

const computeInitialTranslate = (snapPoints: (number | string)[], initialSnap: number): number => {
  const snaps = computeSortedSnapsPx(snapPoints);
  if (snaps.length === 0) return 0;
  const total = snaps[snaps.length - 1] ?? 0;
  const idx = Math.max(0, Math.min(initialSnap, snaps.length - 1));
  const h = snaps[idx] ?? 0;
  return Math.max(0, total - h);
};

const arraysEqual = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export const DraggableBottomSheet: FunctionComponent<DraggableBottomSheetProps> = ({
  snapPoints,
  initialSnap = 0,
  contentBottomPadding = 0,
  bottomOffset = 0,
  zIndex = 1050,
  onSnapChange,
  children,
}) => {
  const snapPointsKey = useMemo(() => snapPoints.join('|'), [snapPoints]);

  const [snapsPx, setSnapsPx] = useState<number[]>(() => computeSortedSnapsPx(snapPoints));

  const totalHeightPx = snapsPx[snapsPx.length - 1] ?? 0;
  const minHeightPx = snapsPx[0] ?? 0;

  const initialIndex = useMemo(
    () => Math.max(0, Math.min(initialSnap, snapPoints.length - 1)),
    [initialSnap, snapPoints.length],
  );

  const [translate, setTranslate] = useState<number>(() =>
    computeInitialTranslate(snapPoints, initialSnap),
  );
  const [isDragging, setIsDragging] = useState(false);
  const indexRef = useRef<number>(initialIndex);
  const startY = useRef(0);
  const startTranslate = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);
  const totalDelta = useRef(0);

  useEffect(() => {
    const compute = () => {
      const next = computeSortedSnapsPx(snapPoints);
      setSnapsPx((prev) => (arraysEqual(prev, next) ? prev : next));
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapPointsKey]);

  useEffect(() => {
    if (totalHeightPx <= 0) return;
    const idx = indexRef.current;
    const h = snapsPx[idx] ?? snapsPx[0] ?? 0;
    setTranslate(Math.max(0, totalHeightPx - h));
  }, [totalHeightPx, snapsPx]);

  const snapToIndex = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(snapsPx.length - 1, i));
      indexRef.current = clamped;
      const h = snapsPx[clamped] ?? snapsPx[0] ?? 0;
      setTranslate(Math.max(0, totalHeightPx - h));
      onSnapChange?.(clamped);
    },
    [snapsPx, totalHeightPx, onSnapChange],
  );

  const findNearestIndex = useCallback(
    (currentTranslate: number): number => {
      const visibleHeight = totalHeightPx - currentTranslate;
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < snapsPx.length; i++) {
        const d = Math.abs((snapsPx[i] ?? 0) - visibleHeight);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      return bestIdx;
    },
    [snapsPx, totalHeightPx],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      startY.current = e.clientY;
      startTranslate.current = translate;
      lastY.current = e.clientY;
      lastT.current = performance.now();
      velocity.current = 0;
      totalDelta.current = 0;
      setIsDragging(true);
    },
    [translate],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const now = performance.now();
      const dy = e.clientY - lastY.current;
      const dt = now - lastT.current;
      if (dt > 0) velocity.current = dy / dt;
      lastY.current = e.clientY;
      lastT.current = now;

      const delta = e.clientY - startY.current;
      totalDelta.current = delta;
      const maxTranslate = Math.max(0, totalHeightPx - minHeightPx);
      setTranslate(Math.max(0, Math.min(maxTranslate, startTranslate.current + delta)));
    },
    [isDragging, totalHeightPx, minHeightPx],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);

      if (Math.abs(totalDelta.current) < TAP_THRESHOLD_PX) {
        const lastIndex = snapsPx.length - 1;
        snapToIndex(indexRef.current === lastIndex ? 0 : lastIndex);
        return;
      }
      if (velocity.current > VELOCITY_THRESHOLD) {
        snapToIndex(indexRef.current - 1);
        return;
      }
      if (velocity.current < -VELOCITY_THRESHOLD) {
        snapToIndex(indexRef.current + 1);
        return;
      }
      snapToIndex(findNearestIndex(translate));
    },
    [isDragging, translate, snapsPx.length, snapToIndex, findNearestIndex],
  );

  return (
    <Sheet
      translateY={translate}
      isDragging={isDragging}
      totalHeightPx={totalHeightPx}
      sheetZIndex={zIndex}
      bottomOffset={bottomOffset}
      role="dialog"
      aria-modal={false}
    >
      <HandleArea
        isDragging={isDragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Glissez pour replier ou déplier la feuille"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const lastIndex = snapsPx.length - 1;
            snapToIndex(indexRef.current === lastIndex ? 0 : lastIndex);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            snapToIndex(indexRef.current + 1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            snapToIndex(indexRef.current - 1);
          }
        }}
      >
        <HandleBar isDragging={isDragging} />
      </HandleArea>
      <Content sx={{ pb: `${contentBottomPadding}px` }}>{children}</Content>
    </Sheet>
  );
};
