export const C = {
  sand50: '#FAF7F2',
  sand100: '#F0E8DA',
  sand200: '#DECCB0',
  sand300: '#C4A87A',
  sand500: '#B08D62',
  sand600: '#9A7D5B',
  sand700: '#6B5438',
  sand900: '#453622',

  sage50: '#EEF5EF',
  sage100: '#DDE9DE',
  sage200: '#C5D9C7',
  sage500: '#5B8A55',
  sage700: '#3D6438',

  coffee800: '#3E2E1E',
  coffee900: '#2C2016',

  pageBg: '#F8F4EE',
  cardBg: '#FFFDF9',

  success: '#4D9E6B',
  successBg: '#EFF8F2',
  danger: '#C75050',
  dangerBg: '#FDF0F0',
  warning: '#D4932A',
  warningBg: '#FDF6EA',
  info: '#4A7AB5',
  infoBg: '#EBF3FA',
} as const

export const shadows = {
  sm: '0 1px 3px rgba(69,54,34,0.04), 0 1px 2px rgba(69,54,34,0.03)',
  md: '0 4px 8px rgba(69,54,34,0.06), 0 2px 4px rgba(69,54,34,0.03)',
  lg: '0 8px 24px rgba(69,54,34,0.08), 0 4px 8px rgba(69,54,34,0.04)',
  primary: '0 2px 8px rgba(176,141,98,0.25)',
  glass: '0 8px 32px rgba(69,54,34,0.08)',
} as const

export const glass = {
  background: 'rgba(255, 253, 249, 0.7)',
  blur: 'blur(12px)',
  border: '1px solid rgba(222, 204, 176, 0.3)',
  shadow: shadows.glass,
  borderRadius: '16px',
} as const

/** Brown glass + clay surfaces for sidebar / chrome (reference: claymorphism + frosted rail). */
export const sidebarChrome = {
  surface:
    'linear-gradient(168deg, rgba(255,253,249,0.94) 0%, rgba(248,241,230,0.82) 42%, rgba(236,222,204,0.9) 100%)',
  blur: 'blur(22px) saturate(1.12)',
  railShadow:
    '4px 0 28px rgba(44, 32, 22, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.45), inset -1px 0 0 rgba(176, 141, 98, 0.12)',
  border: '1px solid rgba(176, 141, 98, 0.2)',
  brandCard:
    'linear-gradient(145deg, rgba(255,253,249,0.75) 0%, rgba(255,250,244,0.55) 100%)',
  brandShadow: '0 2px 12px rgba(69, 54, 34, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.65)',
  footerCard:
    'linear-gradient(160deg, rgba(255,253,249,0.7) 0%, rgba(245,236,224,0.5) 100%)',
  navActive: 'rgba(176, 141, 98, 0.26)',
  navHover: 'rgba(176, 141, 98, 0.14)',
  iconOrb: 'linear-gradient(145deg, #C4A87A 0%, #8B6A45 55%, #6B5438 100%)',
} as const

export const headerGlass = {
  background: 'linear-gradient(180deg, rgba(255,253,249,0.82) 0%, rgba(255,253,249,0.68) 100%)',
  blur: 'blur(18px) saturate(1.08)',
  border: '1px solid rgba(222, 204, 176, 0.35)',
} as const
