export const TAB_ROUTES = [
  { name: 'index', title: 'Ana Sayfa', titleKey: 'nav.home', icon: 'home' },
  {
    name: 'islemler',
    title: 'İşlemler',
    titleKey: 'nav.transactions',
    icon: 'arrow-left-right',
  },
  {
    name: 'butceler',
    title: 'Bütçeler',
    titleKey: 'nav.budgets',
    icon: 'wallet',
  },
  {
    name: 'hedefler',
    title: 'Hedefler',
    titleKey: 'nav.goals',
    icon: 'target',
  },
  {
    name: 'ayarlar',
    title: 'Ayarlar',
    titleKey: 'nav.settings',
    icon: 'settings',
  },
] as const;
