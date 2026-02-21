# WellSaid

**Understanding your health shouldn't be a privilege.**

**WellSaid** is a healthcare copilot that manages an entire doctor's visit lifecycle for you. Ensuring that language and memory don't get in the way of you receiving the best care available. Everyone deserves to know what is going on with them medically, and language should not be getting in the way of that.  

---

## Our Motivation Behind WellSaid

As children of immigrants, many of us have seen our parents or grandparents struggle to understand their medical situations. The issue is usually not a lack of education, but a language barrier. When someone cannot fully understand their doctor, diagnosis, or medical report, it becomes much harder to trust the healthcare system. That fear and uncertainty is very real in many immigrant communities.

As healthcare continues to rely more on technology, especially digital medical reporting, accessibility becomes even more important. Yet many of these tools are not designed with elderly users, non-English speakers, or people with low digital confidence in mind. If healthcare technology is meant to improve care, it must also be built in a way that includes everyone.

This isn't just something a few people deal with and the stats prove it:

- **82%** of older adults say the healthcare system is not prepared for the growing and changing needs of an aging population.
- LEP (limited English proficiency) patients are much more likely to experience physical harm in adverse events: **49.1%** of adverse events involving LEP patients caused physical harm vs **29.5%** for English-speaking patients.
- Low health literacy is linked to major medication misunderstanding: in one systematic review, **68%** of people with low health literacy misinterpreted medication schedules, vs **23%** in the high-literacy group.
- Language discordance is associated with higher readmission risk: a meta-analysis found adult patients with language-discordant care had **11%** higher odds of hospital readmission. In studies that did not specify any interpreter use, odds were **14%** higher.
- Communication problems are a root cause in **59%** of serious adverse events.
- Cognitive impairment compounds engagement barriers: in a study of 493 older adults, moderate cognitive impairment was linked to being **4.07x** more likely to feel uncomfortable asking doctors questions and **5.34x** more likely to delay care due to embarrassment.

> Sources:
> 1. [The Growing Demand for Age-Friendly Care (John A. Hartford Foundation)](https://www.johnahartford.org/images/uploads/resources/The_Growing_Demand_for_Age-Friendly_Care_Report_FINAL.pdf)
> 2. [Language Barriers and Patient Safety (PubMed)](https://pubmed.ncbi.nlm.nih.gov/29249189)
> 3. [Cognitive Impairment Severity and Barriers to Healthcare Engagement Among Older Adults (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10286119/) -- A study of 493 older adults finding that those with moderate cognitive impairment were over 4x more likely to feel uncomfortable asking doctors questions and over 5x more likely to delay care due to embarrassment, highlighting how cognitive decline compounds barriers to meaningful healthcare engagement.
> 4. [The Impact of Language Barriers on Patient Safety and Quality of Care (Bowen, 2015)](https://www.santefrancais.ca/wp-content/uploads/2018/11/SSF-Bowen-S.-Language-Barriers-Study-1.pdf) -- A comprehensive review finding that language barriers affect nearly every dimension of healthcare quality: from access and patient assessment to medication errors and adverse events. Patients with limited English proficiency face up to 49% of adverse events involving physical harm compared to 29.5% for English-speaking patients, and language barriers are linked to longer hospital stays, increased readmissions, and compromised informed consent.

---

## What is WellSaid

WellSaid is a healthcare copilot designed to manage the entire doctor's visit lifecycle. It is built specifically for the elderly and those with limited English proficiency.

By capturing conversations, daily health notes, and complex documents, WellSaid turns data into formats that are easy to understand and act upon.

**Understand and Translate:** Record and explain visits, turning confusing medical language into clear, structured next steps in the patient's preferred language.

**Scheduling:** Manage the logistics of the before, during, and after stages of appointments so nothing falls through the cracks.

**Success:** Transform dense paperwork into data that doctors can easily use, so families don't have to rely on memory recall alone.

We aren't just building for efficiency. We are building to ensure that no son or daughter has to watch their parents struggle to be heard in a moment of crisis. WellSaid is about protecting dignity, reducing family stress, and ensuring that everyone knows exactly what comes next for their health, regardless of what language they speak.

---

## Key Features

### Health Notes and Action Items
Record a visit or health concern by voice. The app converts it into structured notes and automatically extracts follow-up tasks.

### Context-Aware Chat Assistant
Answers questions strictly using the user's own data (notes, appointments, documents, past sessions). If information isn't available, it asks for further information and doesn't try to guess. Respects the user's preferred language.

### Document Scanning
Upload or photograph labs, prescriptions, or summaries. A vision LLM generates concise, searchable summaries stored for future reference.

### Appointments and Visit Flow
Schedule and manage appointments. After visits, record or paste conversations to generate structured summaries with key topics and action items.

### Voice Everywhere
Real-time speech-to-text for notes and chat, plus outbound call flows directly from the app.

### Automatic Voice Agent Scheduling
An AI voice agent can call clinics or hospitals to schedule, confirm, or reschedule appointments on the user's behalf.

### Multilingual Support
UI and AI responses available in multiple languages, including English, Spanish, Mandarin, Cantonese, Korean, Japanese, Vietnamese, Tagalog, Arabic, Portuguese, and more.

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS**
- **Motion** (animations)

### Backend & Data
- **Next.js API Routes**
- **Supabase Auth**
- **Supabase Postgres Database**
  - Row Level Security (RLS) enabled

### AI
- **Vercel AI SDK**
- **OpenAI**
  - **GPT-4o-mini** for chat
  - **GPT-4o** for vision
- **Zod** schemas for structured outputs

### Voice
- **AssemblyAI** (streaming transcription)
- **Vapi SDK** (outbound AI voice calls)

### Mobile
- **React Native (Expo)** for iOS and Android

### Internationalization
- **Language-aware UX**
  - User language preferences propagate across the UI
  - The same language preferences are passed into all LLM calls

---

## Challenges

**Preventing AI Hallucination** -- Making sure the assistant only answers from the user's actual data, never guessing or making things up.

**Voice to Structure** -- Turning raw spoken conversations into clean, organized summaries without losing important clinical details.

**Live Transcription** -- Keeping speech-to-text fast and reliable while handling errors and pauses gracefully.

**Document Accuracy** -- Scanning and summarizing medical documents without losing meaning or critical details.
