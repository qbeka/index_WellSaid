# WellSaid

**Understanding your health shouldn't be a privilege.**

**WellSaid** is a healthcare copilot that manages an entire doctor's visit lifecycle for you. Ensuring that language and memory don't get in the way of you recieving the best care available. Everyone deserves to know what is going on with them medically, and language should not be getting in the way of that.  

---

## Our Motivation Behind WellSaid

As children of immigrants, many of us have seen our parents or grandparents struggle to understand their medical situations. The issue is usually not a lack of education, but a language barrier. When someone cannot fully understand their doctor, diagnosis, or medical report, it becomes much harder to trust the healthcare system. That fear and uncertainty is very real in many immigrant communities.

As healthcare continues to rely more on technology, especially digital medical reporting, accessibility becomes even more important. Yet many of these tools are not designed with elderly users, non-English speakers, or people with low digital confidence in mind. If healthcare technology is meant to improve care, it must also be built in a way that includes everyone.

This isn't just something a few people deale with and the stats prove it:

- **82%** of older adults believe the healthcare system is unprepared to meet their needs. The danger is even greater for those facing language barriers.
- Patients with limited English proficiency (LEP) are **nearly twice as likely** to suffer physical harm from medical errors compared to English-speaking patients.
- Low health literacy leads to **68% more** misinterpretations of prescriptions.
- Patients with language barriers have **11% to 14% higher odds** of hospital readmission when professional interpretation is missing.
- Communication errors are the root cause of **59%** of serious adverse events in clinical settings.

> Sources:
> 1. [The Growing Demand for Age-Friendly Care (John A. Hartford Foundation)](https://www.johnahartford.org/images/uploads/resources/The_Growing_Demand_for_Age-Friendly_Care_Report_FINAL.pdf)
> 2. [Language Barriers and Patient Safety (PubMed)](https://pubmed.ncbi.nlm.nih.gov/29249189)
> 3. [Cognitive Impairment Severity and Barriers to Healthcare Engagement Among Older Adults (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10286119/) -- A study of 493 older adults finding that those with moderate cognitive impairment were over 4x more likely to feel uncomfortable asking doctors questions and over 5x more likely to delay care due to embarrassment, highlighting how cognitive decline compounds barriers to meaningful healthcare engagement.
> 4. [The Impact of Language Barriers on Patient Safety and Quality of Care (Bowen, 2015)](https://www.santefrancais.ca/wp-content/uploads/2018/11/SSF-Bowen-S.-Language-Barriers-Study-1.pdf) -- A comprehensive review finding that language barriers affect nearly every dimension of healthcare quality: from access and patient assessment to medication errors and adverse events. Patients with limited English proficiency face up to 49% of adverse events involving physical harm compared to 29.5% for English-speaking patients, and language barriers are linked to longer hospital stays, increased readmissions, and compromised informed consent.

---

## What is WellSaid

WellSaid is a healthcare copilot designed to manage the entire doctor's visit lifecycle. It is built specifically for the elderly and those with limited English proficiency.

By capturing conversations, daily health notes, and complex documents, WellSaid turns data into formats that are easy to understand and act upon.

**Understand and Translate** -- Record and explain visits, turning confusing medical language into clear, structured next steps in the patient's preferred language.

**Scheduling** -- Manage the logistics of the before, during, and after stages of appointments so nothing falls through the cracks.

**Success** -- Transform dense paperwork into data that doctors can easily use, so families don't have to rely on memory recall alone.

We aren't just building for efficiency. We are building to ensure that no son or daughter has to watch their parents struggle to be heard in a moment of crisis. WellSaid is about protecting dignity, reducing family stress, and ensuring that everyone -- regardless of the language they speak -- knows exactly what comes next for their health.

---

## Features

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

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS, Motion |
| **Backend and Data** | Next.js API routes, Supabase Auth, Supabase Database (Postgres with Row Level Security) |
| **AI** | Vercel AI SDK, OpenAI GPT-4o-mini (chat), GPT-4o (vision), Zod schemas for structured outputs |
| **Voice** | AssemblyAI streaming transcription, Vapi SDK for outbound AI voice calls |
| **Mobile** | React Native (Expo) for iOS and Android |
| **i18n** | Language preferences propagate across UI and all LLM calls |

---

## Challenges

**Preventing AI Hallucination** -- Making sure the assistant only answers from the user's actual data, never guessing or making things up.

**Voice to Structure** -- Turning raw spoken conversations into clean, organized summaries without losing important clinical details.

**Live Transcription** -- Keeping speech-to-text fast and reliable while handling errors and pauses gracefully.

**Document Accuracy** -- Scanning and summarizing medical documents without losing meaning or critical details.
