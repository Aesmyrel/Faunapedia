import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

import type { IconRef } from '@/data/reference';
import { useHideSpiders } from '@/hooks/use-hide-spiders';

export interface IconProps {
  icon: IconRef;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}

/** Icône vectorielle issue de l’une des trois familles utilisées par l’app. */
export function Icon(props: IconProps) {
  // L’icône des arachnides est une araignée : remplacée en mode arachnophobie.
  if (props.icon.set === 'fa6' && props.icon.name === 'spider') return <ArachnidIcon {...props} />;
  return <Glyph {...props} />;
}

function ArachnidIcon(props: IconProps) {
  const hidden = useHideSpiders();
  return <Glyph {...props} icon={hidden ? mci('eye-off-outline') : props.icon} />;
}

function Glyph({ icon, size = 20, color, style }: IconProps) {
  switch (icon.set) {
    case 'fa6':
      return (
        <FontAwesome6
          name={icon.name as keyof typeof FontAwesome6.glyphMap}
          size={size * 0.86}
          color={color}
          style={style}
          solid
        />
      );
    case 'ion':
      return <Ionicons name={icon.name as keyof typeof Ionicons.glyphMap} size={size} color={color} style={style} />;
    default:
      return (
        <MaterialCommunityIcons
          name={icon.name as keyof typeof MaterialCommunityIcons.glyphMap}
          size={size}
          color={color}
          style={style}
        />
      );
  }
}

export const mci = (name: string): IconRef => ({ set: 'mci', name });
