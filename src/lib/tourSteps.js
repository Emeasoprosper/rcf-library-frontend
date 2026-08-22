// RCFMOUAULIBRARYreact/student-dashboard/src/lib/tourSteps.js
export const TOUR_STEPS = [
  {
    id: 'welcome',
    selector: null,
    title: 'Welcome to the RCF Library 👋',
    body: "Let's take a quick look around — this'll only take a minute.",
  },
  {
    id: 'search',
    selector: '[data-tour="tour-search"]',
    title: 'Search the archives',
    body: 'Find books, audio and videos across the whole library — tap here anytime.',
  },
  {
    id: 'notifications',
    selector: '[data-tour="tour-notifications"]',
    title: 'Stay updated',
    body: 'Announcements, approvals and heads-up alerts land here.',
  },
  {
    id: 'nav-search',
    selector: '[data-tour="tour-nav-search"]',
    title: 'Browse & filter',
    body: 'Explore categories, departments and levels to find exactly what you need.',
  },
  {
    id: 'nav-library',
    selector: '[data-tour="tour-nav-library"]',
    title: 'Your Library',
    body: "Everything you've saved, your reading history and offline downloads live here.",
  },
  {
    id: 'nav-contribute',
    selector: '[data-tour="tour-nav-contribute"]',
    title: 'Contribute & request',
    body: 'Upload resources, suggest materials or request something the library is missing.',
  },
  {
    id: 'nav-profile',
    selector: '[data-tour="tour-nav-profile"]',
    title: 'Your profile',
    body: 'Manage your account and settings — you can restart this tour anytime from here.',
  },
]