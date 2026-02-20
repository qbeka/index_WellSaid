# WellSaid Frontend Architecture

A senior-level design-to-engineering breakdown of the WellSaid frontend.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, Motion

**Target demographic:** Elderly users and those with Limited English Proficiency (LEP) operating in high-stress clinical environments. Every element and state transition is scrutinized for cognitive load and accessibility.

---

## 1. The Onboarding Pipeline: Frictionless State Progression

The onboarding UX is aggressively minimalist, optimizing for completion rate by presenting only one cognitive task per step.

### Layout and Typography
The layout uses a strict centralized flexbox or grid container (`min-h-screen flex items-center justify-center`). Typography is a clean, highly legible sans-serif (Inter or similar), scaling well for visually impaired users.

### Form Controls and Affordances
Inputs are large, pill-shaped (`rounded-full`), overriding standard browser defaults. This creates an inviting, tactile feel appropriate for elderly users and touch devices.

### State Management (Step 1)
The "Continue" button is explicitly disabled (`opacity-50 cursor-not-allowed`) until local state validation confirms both `firstName` and `lastName` strings have a length greater than zero.

### Custom Select UI (Step 2)
The native `<select>` HTML element is abandoned entirely. Native selects are notorious for inconsistent cross-browser styling and poor UX on mobile. Instead, a custom dropdown component is used. The active state (e.g. "US English") uses a distinct background color and a trailing checkmark icon to confirm the selection visually, mapping the state directly to the user's mental model.

### Context Switching (Step 3)
The app gracefully accepts pasted formatted strings (e.g. `(780) 735-7000`) without throwing validation errors. This implies robust input masking or backend sanitization, preventing user frustration when switching between apps to fetch information.

---

## 2. The Core Layout Architecture: Sidebar and Global Actions

Once authenticated, the app relies on a persistent shell layout.

### The Navigation Drawer
The left-hand sidebar is the central nervous system. It uses an overlay pattern (`z-50` fixed positioning with a backdrop blur/darken) rather than a persistent side-nav, maximizing the reading area for main content. Navigation includes:

- Home
- Action Items
- Health Notes
- Appointments
- Sessions
- Visit Flow
- Documents

### Active Route Indication
The active route is highlighted with a distinct visual treatment. Contrast ratios should meet or exceed WCAG AAA compliance.

### Global Floating Action Buttons

**Top Right ("I'm at a doctor's visit")** -- A persistent, high-contrast, high-priority escape hatch pinned to the layout header. This immediately routes the user into the recording and visit flow context.

**Bottom Right (Chat Widget)** -- Pinned `bottom-4 right-4`. Acts as a global context provider. The user can navigate across different views (Appointments, Health Notes) while maintaining chat state.

---

## 3. Graceful Degradation via Empty States

A massive UX trap for data-heavy apps is the blank white screen when an account is new. WellSaid handles this with educational empty states.

When the user clicks through "Action Items," "Health Notes," or any data-driven view, they are not shown a blank page. They are greeted with:

- A centralized icon
- A descriptive title (e.g. "No action items yet")
- Subtext explaining how that view will eventually be populated

This acts as passive onboarding, teaching the user how the app works before they have generated any data.

---

## 4. High-Stress Views: Fitts's Law in Action

When the user enters the "Conversation" recording view, the UI completely changes its paradigm.

### Radical Simplification
Standard navigation disappears. The entire DOM is cleared to present a massive microphone icon. This is a textbook application of Fitts's Law -- the time required to rapidly move to a target area is a function of the ratio between the distance to the target and the width of the target. In an emergency, the user doesn't need to hunt for a small icon. They press the center of the screen.

### The Escape Hatch
The bottom button ("I don't want to record, go back") is a large, full-width, visually distinct danger button (red outline/text), providing a clear exit path without ambiguity.

---

## 5. Hardware Integration UI

### WebRTC Integration
The "Scan documents" view handles the `navigator.mediaDevices.getUserMedia` API cleanly. It presents the browser-native permission dialogue, and upon acceptance, renders the `<video>` stream within a constrained, rounded container.

### Floating Capture Button
A camera icon overlays the video feed, clearly indicating the primary action. The touch target is large enough for confident tapping on mobile devices.

---

## 6. The Context-Aware Chat Interface

The chat widget (built on the Vercel AI SDK `useChat` hook) is deeply integrated into the UX.

### Pre-computed Prompts
Above the input field, the app renders quick action chips (e.g. "Summarize my overall health", "What action items do I have?"). This eliminates "blank canvas paralysis" for elderly users who might not know what to ask an LLM.

### Streaming UI and Asynchronous State
When a prompt is triggered, the UI instantly disables the input and displays a "Thinking..." indicator. Text streams in real-time with appropriate line heights for readability.

### Anti-Hallucination UX
Because the system prompt strictly forbids guessing, the AI clearly states when information is unavailable (e.g. "I don't have specific information about your overall health...") rather than fabricating responses. This builds trust with the user.

---

## 7. Summary

The team succeeded in building a complex LLM and hardware-interfacing application and disguising it as a simple, single-purpose tool. The frontend philosophy is:

- Strip away nested menus, complex data tables, and settings pages
- Favor large touch targets and global persistent actions
- Use a conversational interface as the primary interaction model
- One cognitive task per screen in high-stress flows
- Educational empty states over blank pages
- Accessibility and cognitive load inform every architectural decision
