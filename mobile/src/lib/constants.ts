// src/lib/constants.ts
// Shared constants used across the app

export const PRESET_LOCATIONS: Array<{
  label: string;
  name: string;
  address: string;
  campus_section: string;
}> = [
  // Verified: BU School of Law, 765 Commonwealth Ave, 02215
  {
    label: 'BU School of Law (LAW Tower)',
    name: 'Boston University School of Law',
    address: '765 Commonwealth Avenue, Boston, MA 02215',
    campus_section: 'Central',
  },
  // Verified: BU Hillel, 213 Bay State Rd, 02215
  {
    label: 'BU Hillel House',
    name: 'Florence & Chafetz Hillel House',
    address: '213 Bay State Road, Boston, MA 02215',
    campus_section: 'Central',
  },
  {
    label: 'GSU – Metcalf Ballroom',
    name: 'George Sherman Union (Metcalf Ballroom)',
    address: '775 Commonwealth Avenue, Boston, MA 02215',
    campus_section: 'Central',
  },
  {
    label: 'GSU – Food Court',
    name: 'George Sherman Union (Food Court)',
    address: '775 Commonwealth Avenue, Boston, MA 02215',
    campus_section: 'Central',
  },
  {
    label: 'Questrom School of Business',
    name: 'Questrom School of Business',
    address: '595 Commonwealth Avenue, Boston, MA 02215',
    campus_section: 'Central',
  },
  {
    label: 'EPIC (Engineering Product Innovation Center)',
    name: 'Engineering Product Innovation Center',
    address: '750 Commonwealth Avenue, Boston, MA 02215',
    campus_section: 'East',
  },
  {
    label: 'Warren Towers Lobby',
    name: 'Warren Towers',
    address: '700 Commonwealth Avenue, Boston, MA 02215',
    campus_section: 'West',
  },
];
