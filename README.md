# WellSaid

## A Language Barrier Shouldn't Be Life-Threatening

When my father had a heart attack, the emergency room was already chaotic. But the real danger wasn’t just his heart; it was the struggle to grasp understanding. My dad only speaks Albanian, and as the doctors asked him countless questions about his symptoms and history, he couldn't find the words to respond. Luckily, I was there to step in to translate everything. Had I not been there to bridge that gap, the outcome would have been a delayed response or worse. In these situations, you need all the time you can get.

This isn’t just my family’s story; it’s a systemic failure. We found that patients with limited English proficiency are nearly twice as likely to suffer physical harm from medical errors compared to English-speaking patients.

When communication breaks down in tense moments, the consequences are measurable and severe:

- Low health literacy leads to 68% more misinterpretations of prescriptions.
- Patients with language barriers have 11% to 14% higher odds of hospital readmission when professional interpretation is missing.
- Communication errors are the root cause of 59% of serious adverse events in clinical settings.

For my dad, being unable to speak the native language in the ER was a life-threatening problem. A misunderstood instruction or a missed detail in discharge paperwork is often the cause of a manageable recovery turning into a critical return to the ER.

## Introducing WellSaid

We created a healthcare tool designed to manage your entire doctor’s visit, from booking to long-term care, ensuring that language and memory are never barriers to health. WellSaid records and explains visits, turning confusing medical language into clear next steps in the patient's preferred language. WellSaid also manages the logistics of the before, during, and after stages of appointments so nothing falls through the cracks. By transforming paperwork and documents into easily understood data, families don't have to rely solely on memory and can protect their dignity.

Our app is built specifically for the elderly and those with limited English proficiency. Our goal is to simplify the entire process a patient goes through so no family is left guessing.

Finally, with our one-tap emergency mode and accessibility features, we ensure that everyone, regardless of language proficiency or tech literacy, can access WellSaid.

## What it does

WellSaid runs as both a native mobile app (iOS/Android via Expo) and a responsive web dashboard, so patients and families can manage care from anywhere.

### Record Visits

Capture visits or health concerns by voice, then automatically convert them into structured notes with clear action items.

### Grounded AI Assistant

Ask natural-language questions and get answers based strictly on your own records (notes, appointments, documents, and sessions). If the data is missing, the assistant says so clearly instead of guessing. Responses follow your selected language and support rich markdown formatting for readability.

### Document Intelligence

Upload or photograph labs, prescriptions, and care summaries. Vision models convert them into concise, searchable records that can be reused across the app.

### Appointments and Visit Workflow

Plan and manage appointments, then turn post-visit conversations into organized summaries with key topics and follow-up tasks. Users can store and maintain their primary hospital or clinic phone and extension directly in settings.

### Travel Health Profile

Fill out a pre-visit medical profile (blood type, allergies, conditions, medications, emergency contact, insurance, notes) and instantly translate it for international providers.

### Nearby Providers

With location permission, discover nearby hospitals, clinics, doctors, and pharmacies using OpenStreetMap data. View distance, address, and phone number, then save a provider contact as your active clinic number.

### Emergency Mode (Mobile)

Use one-tap emergency recording to capture urgent context fast. WellSaid transcribes the recording, generates a structured emergency note, saves it, and sends an alert to your Care Circle contact.

### Care Circle

Users can configure a trusted emergency contact in settings. Emergency mode sends alerts with transcript context so family or caregivers can respond quickly.

### Voice Everywhere

Support real-time speech-to-text for notes and interactions, plus outbound AI voice calls to clinics and hospitals for scheduling, confirmation, and rescheduling.

### In-App Translation

Translate conversations in-app, speak translated output aloud, copy translated text, and generate translated travel profiles for cross-language care scenarios.

### Multilingual Support

UI and AI experiences support many languages, including English, Spanish, Mandarin, Cantonese, Korean, Japanese, Vietnamese, Tagalog, Arabic, Portuguese, Hindi, Russian, French, German, Dutch, Albanian, and more.

### Accessibility Features

- **High legibility mode:** Larger text (35% scale), increased line height (70%), bolder weight, and extra letter spacing.
- **Haptic feedback (mobile):** Tactile feedback on buttons, toggles, tab switches, and high-priority actions.
- **Accessible text system:** Centralized text scaling and weight adjustments when legibility mode is enabled.
- **Calm visual language:** Simple layout, no gradients, and consistent contrast designed to reduce cognitive load.

## How we built it

### Frontend

- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS, and Motion. The dashboard includes home, action items, health notes, appointments, sessions, visit workflow, documents, scan, translation, and travel.
- **Mobile:** Expo (React Native) with tabs for Home, Health, Documents, Translate, and Settings, plus a central recording action. Emergency mode is accessible from Settings.

### Backend and data

Next.js API routes and Supabase power auth and data storage for profiles, notes, tasks, sessions, appointments, documents, travel profiles, and care circle alerts. Row-level security (RLS) enforces per-user access boundaries.

### AI layer

Vercel AI SDK with OpenAI models (GPT-4o for chat and vision). Structured outputs with Zod are used for visit summaries, action extraction, note parsing, and document processing. Prompts enforce strict grounding rules and anti-hallucination behavior with user-specific context.

### Voice

AssemblyAI handles streaming transcription for in-app voice interactions. Vapi powers outbound AI calls to clinics with configurable patient and assistant naming.

### Internationalization

Shared language constants drive UI and model interactions. User language preferences propagate across product surfaces so summaries and assistant responses remain consistent.

## Challenges we ran into

### Keeping the chat grounded

Strict prompt structure, explicit “do not invent” rules, and clear sectioning of user data were needed to keep the model within the provided context.

### Voice to structured data

Separating clinical content from small talk and reliably producing schema-valid summaries required careful prompt design.

### Real-time transcription UX

Managing streaming transcripts, turn detection, token provisioning, and error states while keeping the UI responsive.

### Document pipeline accuracy

Balancing summary quality with token efficiency so vision outputs could feed reliably into future chat context.

### Emergency mode UX

Designing a one-tap flow that works under stress and reliably notifies the Care Circle, including fallback when the profile or phone number is missing.

## Accomplishments we’re proud of

- End-to-end voice and document pipelines that turn raw input into structured, queryable data
- A grounded, context-aware chat assistant with explicit anti-hallucination rules
- Structured LLM outputs across the app for reliability and simpler frontends
- Multilingual support in both UI and AI
- Vision-based document scanning integrated into conversational workflows
- A unified experience on web and native mobile
- Travel health profile with translation for use abroad
- Location-based provider discovery and one-tap save to settings
- Emergency mode with Care Circle alerts
- Accessibility features (high legibility, haptics) designed for elderly and low-vision users
- Markdown rendering in chat for clearer AI answers

## What we learned

### Product and AI design

- Filtering clinical content needs explicit exclusion rules and speaker attribution
- Clear prompt sectioning helps reduce hallucination
- Structured outputs are more reliable than parsing free text in healthcare flows

### Technical

- Designing for elderly users increases complexity: simple controls (dropdowns, loading states) matter more
- Accessibility and cognitive load directly affect architecture
- Healthcare AI needs guardrails, consistency, and transparency; trust often matters more than model size

### Broader

- Many healthcare issues are coordination failures, not treatment failures
- Document comprehension is a major source of frustration
- Trust comes from reliability and clarity
- Care involves patients, providers, and caregivers
- AI should support, not replace, human relationships in care

## What’s next for WellSaid

### HIPAA compliance expansion

Supabase can be run with HIPAA-compliant infrastructure. Next step is integrating fully HIPAA-compliant LLM providers with BAAs for end-to-end protection.

### Deeper system integration

Connect with hospital systems (e.g., FHIR, patient portals) for real-time appointment and result syncing.

### Care Circle expansion

Allow secure sharing of selected summaries or documents with family and care coordinators.

### Proactive reminders

Reminders and “questions to ask” based on upcoming appointments and recent notes.

### Richer document support

Multi-page PDF uploads with structured extraction of medications, labs, and timelines.

### Accessibility and transparency

Expand voice-first flows and add “show source” explanations for AI-generated answers.

## Sources

- https://www.santefrancais.ca/wp-content/uploads/2018/11/SSF-Bowen-S.-Language-Barriers-Study-1.pdf
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10286119/
