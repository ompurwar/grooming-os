// Wardrobe item taxonomy for the Grooming OS

export const CATEGORIES = {
  top: 'Top',
  bottom: 'Bottom',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessory: 'Accessory',
  ethnic: 'Ethnic',
} as const;

export type Category = keyof typeof CATEGORIES;

export const SUB_CATEGORIES: Record<Category, Record<string, string>> = {
  top: {
    tshirt: 'T-Shirt',
    polo: 'Polo',
    dress_shirt: 'Dress Shirt',
    casual_shirt: 'Casual Shirt',
    henley: 'Henley',
    sweater: 'Sweater',
    hoodie: 'Hoodie',
    vest: 'Vest',
    tank_top: 'Tank Top',
  },
  bottom: {
    jeans: 'Jeans',
    chinos: 'Chinos',
    dress_trousers: 'Dress Trousers',
    shorts: 'Shorts',
    joggers: 'Joggers',
    cargo: 'Cargo Pants',
    linen_pants: 'Linen Pants',
  },
  outerwear: {
    blazer: 'Blazer',
    jacket: 'Jacket',
    bomber: 'Bomber Jacket',
    leather_jacket: 'Leather Jacket',
    denim_jacket: 'Denim Jacket',
    overcoat: 'Overcoat',
    windbreaker: 'Windbreaker',
    cardigan: 'Cardigan',
  },
  footwear: {
    sneakers: 'Sneakers',
    loafers: 'Loafers',
    oxford: 'Oxford Shoes',
    derby: 'Derby Shoes',
    boots: 'Boots',
    chelsea_boots: 'Chelsea Boots',
    sandals: 'Sandals',
    slides: 'Slides',
    running_shoes: 'Running Shoes',
  },
  accessory: {
    watch: 'Watch',
    belt: 'Belt',
    sunglasses: 'Sunglasses',
    wallet: 'Wallet',
    chain: 'Chain/Necklace',
    bracelet: 'Bracelet',
    ring: 'Ring',
    tie: 'Tie',
    pocket_square: 'Pocket Square',
    cap: 'Cap/Hat',
    scarf: 'Scarf',
    bag: 'Bag',
  },
  ethnic: {
    kurta: 'Kurta',
    sherwani: 'Sherwani',
    nehru_jacket: 'Nehru Jacket',
    dhoti: 'Dhoti',
    pathani: 'Pathani Suit',
    indo_western: 'Indo-Western',
    lungi: 'Lungi',
    churidar: 'Churidar',
  },
};

export const COLORS = [
  'black', 'white', 'navy', 'grey', 'charcoal',
  'beige', 'cream', 'khaki', 'tan', 'brown',
  'olive', 'forest_green', 'sage', 'teal',
  'burgundy', 'maroon', 'red', 'coral', 'pink',
  'sky_blue', 'royal_blue', 'cobalt', 'indigo',
  'lavender', 'purple', 'plum',
  'mustard', 'yellow', 'gold', 'orange', 'rust',
] as const;

export type Color = (typeof COLORS)[number];

export const COLOR_LABELS: Record<Color, string> = {
  black: 'Black', white: 'White', navy: 'Navy', grey: 'Grey', charcoal: 'Charcoal',
  beige: 'Beige', cream: 'Cream', khaki: 'Khaki', tan: 'Tan', brown: 'Brown',
  olive: 'Olive', forest_green: 'Forest Green', sage: 'Sage', teal: 'Teal',
  burgundy: 'Burgundy', maroon: 'Maroon', red: 'Red', coral: 'Coral', pink: 'Pink',
  sky_blue: 'Sky Blue', royal_blue: 'Royal Blue', cobalt: 'Cobalt', indigo: 'Indigo',
  lavender: 'Lavender', purple: 'Purple', plum: 'Plum',
  mustard: 'Mustard', yellow: 'Yellow', gold: 'Gold', orange: 'Orange', rust: 'Rust',
};

export const PATTERNS = [
  'solid', 'striped', 'checked', 'plaid',
  'printed', 'floral', 'paisley', 'geometric',
  'abstract', 'camo', 'polka_dot', 'herringbone',
  'houndstooth', 'color_block',
] as const;

export type Pattern = (typeof PATTERNS)[number];

export const MATERIALS = [
  'cotton', 'linen', 'polyester', 'wool', 'silk',
  'denim', 'leather', 'suede', 'nylon', 'velvet',
  'corduroy', 'cashmere', 'fleece', 'tweed',
  'satin', 'chiffon', 'knit', 'mesh',
] as const;

export type Material = (typeof MATERIALS)[number];

export const FORMALITY_LEVELS = {
  1: 'Very Casual',
  2: 'Casual',
  3: 'Smart Casual',
  4: 'Business / Semi-Formal',
  5: 'Formal / Black Tie',
} as const;

export type FormalityScore = keyof typeof FORMALITY_LEVELS;

export const SEASONS = ['summer', 'monsoon', 'winter', 'all_season'] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_LABELS: Record<Season, string> = {
  summer: 'Summer',
  monsoon: 'Monsoon',
  winter: 'Winter',
  all_season: 'All Season',
};

export const CONDITIONS = ['new', 'good', 'worn', 'needs_repair'] as const;
export type Condition = (typeof CONDITIONS)[number];
