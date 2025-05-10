## Project Context Document: "Avi" - Intelligent Patient Intake & Clinical Assistant

**Purpose:** This document provides a complete context for the "Avi" project. It is intended for use by AI tools (programming, LLMs, etc.) throughout the project lifecycle to ensure they have a comprehensive understanding of the project's goals, scope, users, technical stack, and functionalities.

**1. Project Vision & High-Level Goal:**
To revolutionize the patient intake and clinical consultation experience by:

- Transforming patient onboarding into a fast, simple, intuitive, and all-encompassing process, especially for new patients.
- Empowering medical staff (doctors, medical assistants) with a clear, compact, actionable, and holistic "full picture" of the patient's medical background to enable better and faster treatment.
- Streamlining the patient-doctor interaction during appointments with intelligent assistance.

**2. Problem Statement:**

- **Patient Perspective:** First-time patient intake at clinics is often time-consuming, scattered, chaotic, and overwhelming.
- **Clinical Staff Perspective:** Critical patient information is frequently collected incompletely, inconsistently, or in a fragmented manner (some digital during booking, some via paper questionnaires, some verbally at the practice, some manually digitized by nurses). A holistic summary or "cockpit" for patient information is typically non-existent, making it difficult to get a comprehensive view quickly.
- **Current Workflow Inefficiencies:** The current patient intake process is one of the most important yet underserved steps in the patient journey, characterized by scattered data collection and storage.

**3. Proposed Solution Overview:**
A dual-interface application:

- **Patient-Facing Application:** A mobile-first, responsive React web application designed for ease of use, especially for individuals less comfortable with technology. It will feature an AI-powered intelligent agent for guided onboarding.
- **Doctor-Facing Application:** A desktop web application providing clinicians with a structured, comprehensive, and actionable view of patient data, and an AI assistant for in-appointment support.
- **Backend System:** An intelligent backend leveraging agentic LLM/ML systems (via Langchain) for data processing, extraction, storage, and real-time interaction.

**4. Core Job-to-be-Done:**
Automate and streamline patient onboarding, ensuring all relevant information (demographics, past medical history, medication lists, vaccination status, wearable health data, etc.) is collected efficiently, structured clearly, and made readily accessible. This includes supporting various input methods like voice, QR code scans, insurance card scans, wearable sync, and OCR for paper documents.

**5. Key Modules & Functionalities (Staged Approach):**

**Stage 1: Patient Onboarding & Data Aggregation**

- **Patient-Side Functionality (Mobile Responsive Web App):**
  - **AI-Powered Guided Onboarding:**
    - Full-screen AI agent (avatar + voice, using "Beyond Presence" technology) greets the patient.
    - Agent instructs the patient sequentially to provide necessary documents (e.g., insurance card, previous medical history, last doctor's letter, lab reports, vaccination certificates).
    - Simple UI with "upload" or "take photo" buttons at the bottom of the full screen ai agent.
    - Agent avatar minimizes (WhatsApp style) during photo capture/upload, with camera feed taking full screen, with AI agent providing continuous instruction and conversational feedback while the patient takes photos
    - Real-time feedback: If a wrong document is uploaded (e.g., incorrect type, too old), the agent immediately informs the patient and re-instructs.
    - Process continues until all required documents are successfully uploaded.
  - **Data Input Methods:**
    - Taking photos of documents directly via the app.
    - Uploading existing digital files (e.g., PDFs).
    - Voice input (conversation with the agent)
- **Backend Processing (Agentic LLM/ML via Langchain):**
  - **Patient Knowledge Base (KB):** Dedicated, secure database storage for a patient, acting as their comprehensive KB. Initially only 1 Patient.
  - **Document Ingestion & Initial Validation:**
    - Uploaded documents (photos, PDFs) are stored with labels (e.g., "insurance_card," "lab_report").
    - A lightweight LLM agent processes each uploaded document to validate its relevance (correct document type, recency) through the label as well as the actual document analysis.
  - **Information Extraction & Structuring:**
    - Once all initial documents are validated and collected, a dedicated set of specialized "extraction agentic LLMs" processes each document type.
    - These agents extract all relevant information (e.g., policy numbers from insurance cards, specific lab values from reports, exact lab report value metrics, diagnoses from doctor's letters).
    - Data is structured into a uniform yet flexible format to handle variability in source document layouts and metrics (e.g., converting units, normalizing headings).
    - All extracted and structured data is stored in the patient's KB.
  - **OCR (Optical Character Recognition) based CV model:** Will be essential for processing paper documents provided as photos.
- **Doctor-Side Functionality (Desktop Web App):**
  - **Comprehensive Patient Dashboard:**
    - Holistic view of all relevant patient data, aggregated from the onboarding process.
    - Information is cleanly segregated by type (e.g., insurance, medical history, medications, labs, vaccinations).
    - Appropriate visualizations for different data types (e.g., tables for vaccination records, graphs for lab trends, structured text for history).

**Stage 2: Patient-Doctor Appointment Assistance**

- **Doctor-Side Functionality (Desktop Web App - In-Appointment Assistant):**
  - **Voice-Activated AI Assistant ("Avi"):**
    - Doctor can activate a multimodal LLM-based service that listens to the patient-doctor conversation.
    - By addressing the agent by name (e.g., "Avi, show me the latest blood pressure readings"), the doctor can request specific information.
    - The AI agent controls the frontend to display/highlight the requested information on the patient dashboard or via a chatbot-style interface.
  - **Automated Scribing & Summarization:**
    - The agent actively listens and tracks the entire conversation.
    - It automatically notes down key points: patient-reported problems, diagnoses, medical advice, medication prescriptions (including dosage), and next appointment details.
    - This information is structured and stored in the patient's KB.
- **Patient-Side Functionality (Mobile Responsive Web App - Post-Appointment):**
  - Access to appointment summaries, key takeaways, prescribed medication details, and doctor's advice, retrieved from the patient's KB.

**7. Technical Stack & Resources:**

- **Cloud Platform:** Google Cloud Platform (GCP).
- **Preferred Regions:** `europe-west3` or `europe-west4`.
- **AI/ML Services:** Gemini (all models), Vertex AI.
- **Frontend:**
- Patient App: React responsive web application.
- Doctor App: Desktop web application (React assumed, confirm if different).
- UI Library: shadcn.
- **Backend/AI:**
- Programming Language: (To be decided, Python highly likely for AI/ML).
- Frameworks: Langchain for agentic LLM workflows.
- AI Agent Interaction: "Beyond Presence" for voice and avatar.
- **Database:** (To be decided - e.g., PostgreSQL, Firestore, etc. suitable for structured and semi-structured data, and vector storage for KB).
- **APIs & Integrations:**
- Wearable health data sync (e.g., Apple Health, Withings, Omron - via demo accounts initially).
- Gematik Specifications (e.g., ref-OpenHealthCardKit: `https://github.com/gematik/ref-OpenHealthCardKit`).
- KBV Specifications (e.g., MIOs: `https://www.kbv.de/html/mio.php`).

**8. Data Sources & Types:**

- **Initial Input Data (Often Paper-Based):**
- Vaccination Cards.
- Sample Lab reports.
- Doctor letters.
- Insurance information (e.g., from cards).
- Basic measurements (height, weight - potentially self-reported or from previous records).
- Lifestyle information (questionnaire-based or verbally collected).
- Family history.
- Chronic conditions.
- Medication plans.
- Special program eligibility criteria (e.g., Disease Management Program, Hausarztprogramm).
- **Digital Data Sources:**
- Wearable health data (from demo accounts: Apple Health, Withings, Omron).
- Data from measurement devices (Blood Pressure, ECG, Blood Sugar monitors).
- **Data to be Generated/Managed by the System:**
- Structured patient profiles.
- Digitized versions of paper documents (images/PDFs).
- Extracted, normalized data from documents.
- Conversation transcripts and summaries from appointments.
- Action items, medication lists, and advice generated during appointments.

**9. Key Considerations & Constraints:**

- **User Experience (UX):**
- Simplicity and intuitiveness are paramount, especially for the patient-facing app targeting users with low tech literacy.
- Accessibility for diverse patient groups (elderly, visually impaired).
- **Data Processing:**
- Robust OCR for paper documents.
- Flexible and accurate information extraction from varied document formats.
- Handling of different metrics and units.
- **AI & Agentic System:**
- Multi-modality (voice, photo/document input).
- Real-time feedback and interaction.
- Reliability and accuracy of LLM outputs.
- **Data Security & Privacy:**
- Compliance with healthcare data regulations (e.g., GDPR in Europe, HIPAA if applicable for broader markets). Secure storage and transmission of sensitive patient data.
- **Interoperability:** Adherence to Gematik and KBV specifications for potential future integrations.
- **Scalability:** The system should be designed to handle a growing number of patients and data.

**10. Expected Outcomes & Benefits (Value Proposition):**

- Improved clinical efficiency and reduced administrative workload for medical staff.
- Minimized medical errors due to incomplete or inaccessible patient information.
- Enhanced patient satisfaction through a seamless, less repetitive, and empowering admission and consultation experience.
- Support for accessibility for diverse patient groups.
- Creation of a comprehensive, actionable patient data asset.

---
