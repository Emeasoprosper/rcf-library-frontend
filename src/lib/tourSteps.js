// RCFMOUAULIBRARYreact/student-dashboard/src/lib/tourSteps.js
export const TOUR_STEPS = [
  {
    id: 'welcome',
    mobileSelector: null,
    desktopSelector: null,
    title: 'Welcome to the RCF Library 👋',
    body: "Let's take a quick look around — this'll only take a minute.",
  },
  {
    id: 'search',
    mobileSelector: '[data-tour="tour-search"]',
    desktopSelector: '[data-tour="tour-search-desktop"]',
    title: 'Search the archives',
    body: 'Find books, audio and videos across the whole library — tap here anytime.',
  },
  {
    id: 'notifications',
    mobileSelector: '[data-tour="tour-notifications"]',
    desktopSelector: '[data-tour="tour-notifications-desktop"]',
    title: 'Stay updated',
    body: 'Announcements, approvals and heads-up alerts land here.',
  },
  {
    id: 'nav-search',
    mobileSelector: '[data-tour="tour-nav-search"]',
    desktopSelector: '[data-tour="tour-search-desktop"]',
    title: 'Browse & filter',
    body: 'Explore categories, departments and levels to find exactly what you need.',
  },
  {
    id: 'nav-library',
    mobileSelector: '[data-tour="tour-nav-library"]',
    desktopSelector: '[data-tour="tour-nav-library-desktop"]',
    title: 'Your Library',
    body: "Everything you've saved, your reading history and offline downloads live here.",
  },
  {
    id: 'nav-contribute',
    mobileSelector: '[data-tour="tour-nav-contribute"]',
    desktopSelector: '[data-tour="tour-nav-contribute-desktop"]',
    title: 'Contribute & request',
    body: 'Upload resources, suggest materials or request something the library is missing.',
  },
  {
    id: 'nav-profile',
    mobileSelector: '[data-tour="tour-nav-profile"]',
    desktopSelector: '[data-tour="tour-nav-profile-desktop"]',
    title: 'Your profile',
    body: 'Manage your account and settings — you can restart this tour anytime from here.',
  },
]