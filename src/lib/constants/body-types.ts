// Body type definitions and fit recommendation rules
import { Square, Landmark, Flame, Sparkles, Briefcase, Gem, Activity, TreePine } from 'lucide-react'

export const BODY_TYPES = {
  ectomorph: {
    label: 'Ectomorph',
    description: 'Lean and long build with narrow shoulders and a fast metabolism.',
    traits: ['Narrow shoulders', 'Long limbs', 'Low body fat', 'Fast metabolism'],
  },
  mesomorph: {
    label: 'Mesomorph',
    description: 'Athletic and muscular build with broad shoulders and a medium frame.',
    traits: ['Broad shoulders', 'Athletic build', 'Medium bone structure', 'Gains muscle easily'],
  },
  endomorph: {
    label: 'Endomorph',
    description: 'Wider build with a softer frame and a tendency to store body fat.',
    traits: ['Wider waist', 'Broader hips', 'Stocky build', 'Slower metabolism'],
  },
  ecto_meso: {
    label: 'Ecto-Mesomorph',
    description: 'Lean but athletic build, combining length with muscle definition.',
    traits: ['Lean muscle', 'Defined physique', 'Moderate shoulders', 'Low to medium body fat'],
  },
  endo_meso: {
    label: 'Endo-Mesomorph',
    description: 'Powerful build with broad frame and solid muscle mass.',
    traits: ['Strong frame', 'Broad chest', 'Solid build', 'Moderate body fat'],
  },
} as const;

export type BodyType = keyof typeof BODY_TYPES;

export const FACE_SHAPES = {
  oval: {
    label: 'Oval',
    description: 'Balanced proportions, slightly longer than wide with a gently rounded jawline.',
    hairstyle_notes: 'Most versatile face shape. Almost any hairstyle works well.',
  },
  round: {
    label: 'Round',
    description: 'Equal width and length with soft angles and full cheeks.',
    hairstyle_notes: 'Hairstyles with height and volume on top work best. Avoid round shapes.',
  },
  square: {
    label: 'Square',
    description: 'Strong jawline with equal width across forehead, cheekbones, and jaw.',
    hairstyle_notes: 'Shorter sides with textured top. Avoid blunt cuts.',
  },
  heart: {
    label: 'Heart',
    description: 'Wide forehead tapering to a narrow chin.',
    hairstyle_notes: 'Side parts and medium-length styles balance the forehead. Avoid excessive volume on top.',
  },
  oblong: {
    label: 'Oblong',
    description: 'Longer than wide with a tall forehead and long chin.',
    hairstyle_notes: 'Avoid adding height. Side-swept styles and fringes work well.',
  },
  diamond: {
    label: 'Diamond',
    description: 'Narrow forehead and jaw with wide cheekbones.',
    hairstyle_notes: 'Wispy bangs and textured styles. Side parts balance cheekbone width.',
  },
} as const;

export type FaceShape = keyof typeof FACE_SHAPES;

export const SKIN_TONES = {
  fair_warm: { label: 'Fair — Warm Undertone', palette: 'earthy' },
  fair_cool: { label: 'Fair — Cool Undertone', palette: 'jewel' },
  fair_neutral: { label: 'Fair — Neutral', palette: 'balanced' },
  medium_warm: { label: 'Medium — Warm Undertone', palette: 'earthy' },
  medium_cool: { label: 'Medium — Cool Undertone', palette: 'jewel' },
  medium_neutral: { label: 'Medium — Neutral', palette: 'balanced' },
  dark_warm: { label: 'Dark — Warm Undertone', palette: 'earthy' },
  dark_cool: { label: 'Dark — Cool Undertone', palette: 'jewel' },
  dark_neutral: { label: 'Dark — Neutral', palette: 'balanced' },
} as const;

export type SkinTone = keyof typeof SKIN_TONES;

export const STYLE_ARCHETYPES = {
  minimalist: {
    label: 'Minimalist',
    description: 'Clean lines, neutral palette, understated elegance.',
    icon: Square,
  },
  old_money: {
    label: 'Old Money',
    description: 'Timeless, preppy, quietly luxurious.',
    icon: Landmark,
  },
  streetwear: {
    label: 'Streetwear',
    description: 'Urban, bold, trend-forward with an edge.',
    icon: Flame,
  },
  smart_casual: {
    label: 'Smart Casual',
    description: 'Polished yet relaxed — the versatile sweet spot.',
    icon: Sparkles,
  },
  classic: {
    label: 'Classic / Tailored',
    description: 'Structured, refined, investment dressing.',
    icon: Briefcase,
  },
  ethnic_modern: {
    label: 'Ethnic Modern',
    description: 'Traditional silhouettes with a contemporary twist.',
    icon: Gem,
  },
  athleisure: {
    label: 'Athleisure',
    description: 'Sport-inspired, comfortable, functional fashion.',
    icon: Activity,
  },
  rugged: {
    label: 'Rugged',
    description: 'Workwear-inspired, durable, masculine.',
    icon: TreePine,
  },
} as const;

export type StyleArchetype = keyof typeof STYLE_ARCHETYPES;

// Fit recommendation rules based on body type
export const FIT_RULES: Record<BodyType, {
  tops: string;
  bottoms: string;
  outerwear: string;
  general_tips: string[];
}> = {
  ectomorph: {
    tops: 'Fitted or slim fit — avoid oversized. Layering adds dimension.',
    bottoms: 'Slim or tapered fit. Avoid ultra-skinny as it exaggerates slimness.',
    outerwear: 'Structured blazers and bomber jackets add breadth to shoulders.',
    general_tips: [
      'Horizontal stripes can add visual width',
      'Layering creates depth and dimension',
      'Structured shoulders in blazers help balance proportions',
      'Avoid excessively baggy clothing',
    ],
  },
  mesomorph: {
    tops: 'Fitted or regular fit to showcase physique. Avoid baggy.',
    bottoms: 'Straight or regular fit. Slim tapered for casual.',
    outerwear: 'Almost anything works. Leather jackets and blazers look great.',
    general_tips: [
      'Your body type is the most versatile — most fits work',
      'V-necks accentuate broad shoulders',
      'Well-fitted clothes showcase your natural physique',
      'Avoid overly tight clothes that restrict movement',
    ],
  },
  endomorph: {
    tops: 'Regular or relaxed fit. Structured shoulders. Avoid skin-tight.',
    bottoms: 'Straight leg or relaxed fit with a clean taper.',
    outerwear: 'Structured blazers and longer jackets create a streamlined silhouette.',
    general_tips: [
      'Vertical patterns and monochrome outfits create a lengthening effect',
      'Structured outerwear defines shape without being restrictive',
      'Dark colors as a base with lighter accents work well',
      'Proper tailoring makes the biggest difference',
    ],
  },
  ecto_meso: {
    tops: 'Slim fit to show lean muscle. Fitted henleys and polos work great.',
    bottoms: 'Slim or tapered fit. Chinos and well-fitted jeans are ideal.',
    outerwear: 'Fitted blazers, denim jackets, and bombers.',
    general_tips: [
      'Your lean athletic build works with most fitted styles',
      'Show off your physique with well-fitted clothes',
      'Layering adds visual interest without bulk',
      'Athletic-cut shirts are your best friend',
    ],
  },
  endo_meso: {
    tops: 'Regular fit with structure. Avoid clinging fabrics.',
    bottoms: 'Straight or regular fit. Avoid skinny jeans.',
    outerwear: 'Structured coats and blazers that define the shoulder line.',
    general_tips: [
      'Embrace your powerful build with confident fits',
      'Structured pieces channel strength into style',
      'Monochromatic looks create a streamlined appearance',
      'Invest in tailoring — fit is everything for your body type',
    ],
  },
};
