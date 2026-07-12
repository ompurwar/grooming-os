# Grooming OS — Feature Specification & User Stories

This document outlines the detailed feature specifications and user stories for the current state of the **Grooming OS** application. 

---

## 1. Product Overview

**Grooming OS** is an elite, AI-powered personal stylist and grooming assistant for men. It acts as a digital wardrobe, a contextual outfit generator, and a grooming consultant. By leveraging advanced vision models (GPT-4o), vector search (pgvector), and image generation pipelines (Replicate), the platform curates hyper-personalized looks based on the user's physical profile, actual clothing, and real-time environmental context.

---

## 2. Epics & User Stories

### Epic 1: Authentication & Onboarding
*Establishing the user's secure account and initial style profile.*

- **User Story 1.1 (Sign Up / Log In):** As a new user, I want to create an account using my email and password so that my wardrobe and personal data are securely saved and synced across my devices.
- **User Story 1.2 (Style Onboarding):** As a first-time user, I want to complete a brief onboarding quiz about my style preferences so that the AI understands my baseline fashion sense before making recommendations.

### Epic 2: Intelligent Profile (Body & Face Analysis)
*Building a biometric profile to tailor recommendations to the user's unique physical traits.*

- **User Story 2.1 (Body Profiling):** As a user, I want to upload full-body photos so the AI can analyze my body type, estimate my height, and provide tailored fit recommendations (e.g., "avoid horizontal stripes", "opt for tailored fits").
- **User Story 2.2 (Face Profiling):** As a user, I want to upload a selfie so the AI can determine my face shape, skin tone, and undertone, which helps in recommending flattering colors, hairstyles, and glasses frames.

### Epic 3: Wardrobe Management
*Digitizing the user's physical closet using AI.*

- **User Story 3.1 (Add Items):** As a user, I want to snap a picture of my clothing item or upload it from my gallery so that I can add it to my digital closet.
- **User Story 3.2 (AI Auto-Tagging):** As a user, when I upload an item, I want the AI (GPT-4o Vision) to automatically categorize it, identify its primary color, pattern, material, and assign a formality score, so I don't have to manually type out descriptions.
- **User Story 3.3 (Browse Closet):** As a user, I want to view my digitized wardrobe organized by category (Tops, Bottoms, Footwear, Accessories) so I can easily see what I own.

### Epic 4: AI Contextual Styling Engine
*Generating the perfect outfit for any occasion.*

- **User Story 4.1 (Prompt-Based Styling):** As a user, I want to type an occasion or prompt (e.g., "Date night at a high-end sushi restaurant") so that the AI can curate a specific outfit for that event.
- **User Story 4.2 (Weather Integration):** As a user, I want the system to automatically fetch my local weather based on my location, so that the recommended outfits are climate-appropriate (e.g., suggesting a coat if it's freezing).
- **User Story 4.3 (Closet RAG Search):** As a user, I expect the AI to only recommend items I actually own, by semantically matching my prompt against the vector embeddings of my wardrobe items.
- **User Story 4.4 (Styling Rationale):** As a user, I want to read the AI's reasoning for *why* an outfit works (matching colors, occasion appropriateness) along with accompanying grooming tips (e.g., "wear a musky cologne").
- **User Story 4.5 (Save Looks):** As a user, I want to save AI-generated outfits that I like into a "Saved Looks" tab so I can quickly reference them later.

### Epic 5: Travel Capsule Creator
*Automating packing for trips.*

- **User Story 5.1 (Generate Capsule):** As a user planning a trip, I want to input my destination, duration, and luggage size, so the AI can build a cohesive "Capsule Wardrobe".
- **User Story 5.2 (Mix-and-Match Focus):** As a user, I expect the generated travel capsule to focus on core items that can be mixed and matched to maximize outfit combinations while minimizing luggage space.
- **User Story 5.3 (Manage Capsules):** As a user, I want to view, revisit, and delete my saved travel capsules. (Note: A capsule cannot be deleted if specific outfits are already linked to it to preserve data integrity).

### Epic 6: Grooming Intelligence & Virtual Try-On (VTO)
*Upgrading the user's grooming routine and experimenting with new looks risk-free.*

- **User Story 6.1 (Grooming Scan):** As a user, I want to perform a face scan so the AI can recommend specific hairstyles, beard trims, or eyewear styles that complement my face shape.
- **User Story 6.2 (Virtual Try-On):** As a user, when the AI recommends a new hairstyle, I want to click a "Try On" button to generate a photorealistic preview of what I would look like with that hairstyle, without having to actually cut my hair.

---

## 3. Technical Feature Matrix

| Feature | Description | Underlying Technology |
| :--- | :--- | :--- |
| **Auth & Sessions** | Secure user authentication and session management. | Supabase Auth (Email/Pass) + Next.js Middleware |
| **Database & Storage** | Relational data, RLS security policies, and image bucket storage. | Supabase PostgreSQL, Supabase Storage |
| **Image Cropping** | Client-side UI for cropping photos before upload. | `react-easy-crop` |
| **Vision Analysis** | Extracting structured metadata from raw clothing and face images. | OpenAI GPT-4o Vision API (`generateObject`) |
| **Semantic Matching** | Finding the best wardrobe items based on text prompts. | OpenAI `text-embedding-3-small` + `pgvector` |
| **Generative Styling** | Curating outfits and writing the styling rationale. | OpenAI GPT-4o Text API |
| **Context Awareness** | Injecting real-time weather data into the LLM context window. | Browser Geolocation API + Open-Meteo API |
| **Workflow Orchestration** | Managing long-running, resilient backend tasks (e.g., heavy AI pipelines). | Temporal Cloud + Temporal Node.js Worker |
| **Virtual Try-On (VTO)** | Generating realistic image modifications (e.g., swapping hairstyles). | Replicate API + Custom Webhooks |

---

## 4. Key Workflows & Edge Cases Handled

*   **Empty Wardrobe Fallback:** If the user requests an outfit but hasn't uploaded enough items to their digital closet, the system handles the lack of vector matches gracefully (either prompting them to add more items or suggesting generic pieces they should buy).
*   **VTO Asynchrony:** Generating a Virtual Try-On image via Replicate takes time (10-30 seconds). The system uses an async webhook (`/api/webhooks/vto`) to receive the completed image and update the database, ensuring the Next.js server doesn't timeout while waiting for the GPU generation.
*   **Safe Capsule Deletion:** When deleting a travel capsule, the system explicitly checks if there are any dependent Outfits linked to that capsule. If there are, it blocks the deletion to prevent orphaned data and broken UI states.
