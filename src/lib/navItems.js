// Shared primary navigation items — used by both BottomNav (mobile)
// and LeftSidebarNav (desktop) so the two can never drift out of sync.
export const navItems = [
  { to: '/home', icon: 'home', label: 'Home' },
  { to: '/search', icon: 'search', label: 'Search' },
  { to: '/shelf', icon: 'library', label: 'Library' },
  { to: '/contribute', icon: 'contribute', label: 'Contribute' },
  { to: '/profile', icon: 'profile', label: 'Profile' },
]

export const TOUR_NAV_IDS = {
  search: 'tour-nav-search',
  library: 'tour-nav-library',
  contribute: 'tour-nav-contribute',
  profile: 'tour-nav-profile',
}