'use client';

import { useEffect, useState } from 'react';

import { Switch } from '@nextui-org/react';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from 'next-themes';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Switch
      defaultSelected={theme === 'dark'}
      size="lg"
      color="success"
      startContent={<IconSun />}
      endContent={<IconMoon />}
      isSelected={theme === 'dark'}
      onValueChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}
    />
  );
}
