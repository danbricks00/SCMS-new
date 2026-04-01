import { View } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * Centers content and caps width on large screens so mobile-first UIs
 * do not stretch edge-to-edge on laptop/tablet.
 */
export default function ResponsiveScreen({ children, style, innerStyle }) {
  const { maxContentWidth, horizontalPadding } = useResponsiveLayout();

  return (
    <View style={[{ flex: 1, width: '100%', alignItems: 'center' }, style]}>
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            maxWidth: maxContentWidth,
            paddingHorizontal: horizontalPadding,
          },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
