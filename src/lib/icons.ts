import * as icons from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

function kebabToPascal(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const NON_ICON_EXPORTS = new Set([
  'Icon',
  'LucideProvider',
  'CreateLucideIcon',
]);

export function getIcon(name: string): LucideIcon {
  const pascalName = kebabToPascal(name);
  const icon = NON_ICON_EXPORTS.has(pascalName)
    ? undefined
    : (icons as unknown as Record<string, LucideIcon | undefined>)[pascalName];
  if (!icon)
    throw new Error(`Unknown icon "${name}" — check the lucide icon name.`);
  return icon;
}
