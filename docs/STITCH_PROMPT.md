# Grooming OS — Stitch UI Generation Prompt

*Copy and paste the sections below into Stitch (stitch.withgoogle.com) to generate UI components and screens that perfectly match the Grooming OS design system.*

---

## 1. Context & Product Overview
**App Name:** Grooming OS
**Description:** An elite, AI-powered personal stylist and grooming assistant for men. It acts as a digital wardrobe, a contextual outfit generator, and a grooming consultant (hair, beard, glasses). 
**Target Audience:** Men looking for a premium, effortless, and highly personalized styling experience.

## 2. Core Features (What we have so far)
- **Digital Wardrobe:** Users upload clothes, AI auto-tags them (color, category, formality).
- **AI Styling Engine:** Users prompt for an occasion (e.g., "Date Night"). AI uses weather and the user's digitized closet to generate an outfit with reasoning.
- **Travel Capsule Planner:** Generates a minimal, mix-and-match packing list based on trip duration and destination.
- **Grooming & Virtual Try-On (VTO):** Scans user's face, recommends haircuts/beards, and generates photorealistic previews using AI.
- **Profile:** Tracks body type, face shape, and style preferences.

## 3. Design System & Styling Rules
**CRITICAL RULE:** Do NOT use Tailwind classes. Generate standard semantic HTML and pure CSS. Use CSS Modules conventions if possible.

**Aesthetic:**
- Premium, modern, dark-mode default.
- "Glassmorphism" heavily used for cards and modals (translucent backgrounds with background blur).
- Smooth, subtle micro-animations (fade-ins, subtle scaling on hover).
- High contrast, legible typography.

**Color Palette (CSS Variables used in our app):**
- **Backgrounds:** Very dark slate/blue (`#1a1a2e`, `#16213e`)
- **Glass Effects:** `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(16px)` and subtle white borders `rgba(255, 255, 255, 0.08)`.
- **Text:** Primary is off-white (`#f8f9fa`), Secondary is light gray (`#a0aec0`), Muted is dark gray (`#718096`).
- **Accent (Gold/Champagne):** Used for primary buttons, AI generation glows, and active states. Gradient from `#d4af37` (gold) to `#aa8014` (dark gold).
- **Secondary Accent (Blue):** Used for "Daily AI Curated" badges or secondary actions (`#4a9eff`).

**Typography:**
- **Font Family:** `Inter` (sans-serif) for all text.
- **Weights:** Regular (400) for body, Medium (500) for buttons/subtitles, Bold (700) for headings.
- **Spacing:** Tight letter-spacing for headings (`-0.02em`), relaxed line-height for body text (`1.6`).

**Icons:**
- Use **Lucide React** style icons (minimal, 2px stroke, unfilled vectors). Example icons: Sparkles (for AI), Briefcase, Globe, User, Shirt, Scissors. No emojis.

**UI Component Paradigms:**
- **Buttons:** Primary buttons have a gold gradient background, bold text, and a subtle glowing box-shadow. Disabled buttons are faded and grayed out.
- **Cards (Glass-card):** Rounded corners (16px to 24px), glassmorphism background, subtle 1px border. Hovering lifts the card slightly (`transform: translateY(-4px)`).
- **Inputs:** Darker background than the main canvas (`rgba(0,0,0,0.2)`), subtle border. On focus, the border highlights in gold.
- **Chips/Tags:** Pill-shaped, translucent background, small text. Used for occasions ("Date", "Office", "Travel") or clothing tags ("Navy", "Cotton"). Active chips get a gold border and subtle gold background tint.

## 4. Example Prompt to give Stitch
*(Copy this specifically when asking Stitch for a new screen)*

> "Design a new mobile-first [INSERT SCREEN NAME, e.g., Marketplace Discovery] screen for Grooming OS. 
> 
> **Style constraints:** Dark mode only. Background is a deep navy/slate (#1a1a2e). Use 'Inter' font. Use glassmorphism for all cards (translucent background, heavy blur, subtle white border). Primary calls to action should use a premium gold gradient (#d4af37 to #aa8014) with a soft glow. 
> 
> **Content requirements:** [INSERT SPECIFIC CONTENT, e.g., Show a grid of recommended clothing items based on the user's current wardrobe gaps. Each item card should have an image, brand name, price, and a 'Buy' button]. 
> 
> Do not use Tailwind. Output semantic HTML and standard CSS. Ensure icons look like minimal vector strokes (Lucide style)."
