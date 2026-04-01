import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Breakpoints tuned for phone / tablet / laptop (web + native). */
const BP = {
  tablet: 600,
  desktop: 1024,
  wide: 1280,
};

/** Hook for tablet/desktop-friendly layouts (resize-safe on web). */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isMobile = width < BP.tablet;
    const isTablet = width >= BP.tablet && width < BP.desktop;
    const isDesktop = width >= BP.desktop;
    const isWide = width >= BP.wide;

    let maxContentWidth = width;
    let horizontalPadding = 16;
    let gridColumns = 2;
    let statCardWidthPct = '48%';
    let actionCardWidthPct = '48%';

    if (isDesktop) {
      horizontalPadding = 24;
      maxContentWidth = Math.min(1280, width);
      gridColumns = isWide ? 4 : 4;
      statCardWidthPct = '23%';
      actionCardWidthPct = '23%';
    } else if (isTablet) {
      horizontalPadding = 20;
      maxContentWidth = Math.min(960, width);
      gridColumns = 3;
      statCardWidthPct = '31%';
      actionCardWidthPct = '31%';
    }

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isWide,
      maxContentWidth,
      horizontalPadding,
      gridColumns,
      statCardWidthPct,
      actionCardWidthPct,
    };
  }, [width, height]);
}
