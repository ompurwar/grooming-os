// Occasion categories for outfit requests
import { Briefcase, PartyPopper, Coffee, Award, Gem, Activity } from 'lucide-react'

export const OCCASION_CATEGORIES = {
  professional: {
    label: 'Professional',
    icon: Briefcase,
    occasions: {
      office_daily: 'Office — Daily',
      important_meeting: 'Important Meeting',
      client_presentation: 'Client Presentation',
      conference: 'Conference / Summit',
      interview: 'Job Interview',
      networking: 'Networking Event',
    },
  },
  social: {
    label: 'Social',
    icon: PartyPopper,
    occasions: {
      dinner_date: 'Dinner Date',
      house_party: 'House Party',
      club_night: 'Club Night',
      brunch: 'Brunch',
      wedding_guest: 'Wedding Guest',
      cocktail: 'Cocktail Party',
      reunion: 'Friends Reunion',
    },
  },
  casual: {
    label: 'Casual',
    icon: Coffee,
    occasions: {
      weekend_errands: 'Weekend Errands',
      coffee_catchup: 'Coffee Catch-up',
      movie: 'Movie Night',
      travel_airport: 'Travel / Airport',
      road_trip: 'Road Trip',
      shopping: 'Shopping',
    },
  },
  formal: {
    label: 'Formal',
    icon: Award,
    occasions: {
      black_tie: 'Black Tie Event',
      award_ceremony: 'Award Ceremony',
      gala_dinner: 'Gala Dinner',
      charity_event: 'Charity Event',
    },
  },
  cultural: {
    label: 'Cultural',
    icon: Gem,
    occasions: {
      diwali: 'Diwali',
      eid: 'Eid',
      holi: 'Holi',
      puja: 'Puja / Temple',
      family_function: 'Family Function',
      wedding_ceremony: 'Wedding Ceremony',
      sangeet: 'Sangeet / Mehendi',
    },
  },
  active: {
    label: 'Active',
    icon: Activity,
    occasions: {
      gym: 'Gym / Workout',
      running: 'Running',
      sports_event: 'Sports Event (Spectating)',
      outdoor_adventure: 'Outdoor / Hiking',
      yoga: 'Yoga',
    },
  },
} as const;

export type OccasionCategory = keyof typeof OCCASION_CATEGORIES;
export type Occasion = {
  [K in OccasionCategory]: keyof (typeof OCCASION_CATEGORIES)[K]['occasions'];
}[OccasionCategory];

// Flat list of all occasions for quick lookup
export const ALL_OCCASIONS = Object.entries(OCCASION_CATEGORIES).flatMap(
  ([categoryKey, category]) =>
    Object.entries(category.occasions).map(([key, label]) => ({
      key,
      label,
      category: categoryKey as OccasionCategory,
      categoryLabel: category.label,
      icon: category.icon,
    }))
);
