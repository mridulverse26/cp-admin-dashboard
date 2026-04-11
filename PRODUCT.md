# ClassPulse AI — Product Context

## What Is ClassPulse AI?
An AI-native Learning Management System built specifically for Indian coaching and tuition centers. It helps center owners and teachers manage students, generate AI-powered assessments, track performance, and automate administrative tasks.

**Live at**: classpulseai.com
**Phase**: 0.1.0-alpha (Phase 1A)

## User Roles

### Center Owner (PRIMARY USER)
- Owns/runs a coaching center (tuition classes)
- Onboards via phone OTP → creates center → sets up batches → invites teachers/students
- Manages billing, attendance, announcements
- Views analytics dashboard
- White-labels the app with their center's branding (logo, primary color)

### Teacher
- Invited by center owner
- Creates and manages tests (MCQ, DPP, homework, subjective)
- Uses AI to generate questions, teaching plans, and lesson content
- Tracks student performance per batch
- Manages syllabus progress
- Takes attendance

### Student
- Joins via invite link or is added by teacher/owner
- Takes tests (MCQ, DPP, homework)
- Views results, leaderboard, and personal analytics
- Earns XP, coins, and achievements (gamification)
- Tracks study schedule and mood

### Parent (Phase 2)
- Receives progress reports
- Views child's performance

## Domain Terminology

| Term | Meaning |
|------|---------|
| **Coaching Center** | A private tuition/coaching institute (the "tenant" in our multi-tenant system) |
| **Batch** | A group of students studying a subject at a grade level (e.g., "11th Physics Morning") |
| **DPP** | Daily Practice Problems — short daily quizzes for students |
| **MCQ** | Multiple Choice Questions — formal tests |
| **Subjective** | Long-answer tests graded by teachers |
| **Teaching Plan** | AI-generated lesson plan for a topic |
| **XP** | Experience points earned by students for engagement |
| **Streak** | Consecutive days of student activity |

## Indian Education Context

| Board | Description |
|-------|-------------|
| **CBSE** | Central Board of Secondary Education (most common) |
| **ICSE** | Indian Certificate of Secondary Education |
| **STATE** | State-specific education boards |
| **JEE** | Joint Entrance Examination — engineering entrance exam |
| **NEET** | National Eligibility cum Entrance Test — medical entrance exam |

Grades: 6th to 12th standard. Subjects: Physics, Chemistry, Mathematics, Biology.

## Core Features & Status

| Feature | Status | Module |
|---------|--------|--------|
| Phone OTP + Firebase Auth | Done | kernel/auth |
| Center onboarding (6 steps) | Done | core-platform |
| Batch management | Done | core-platform |
| Student management + invite links | Done | core-platform |
| MCQ test creation (AI + manual) | Done | assessment |
| DPP (Daily Practice Problems) | Done | assessment |
| Homework generation (AI) | Done | assessment |
| Subjective test creation | Done | assessment |
| Question bank | Done | question-bank |
| AI content generation (Gemini/Groq) | Done | ai |
| OCR document scanning | Done | ocr |
| File upload (Cloudinary) | Done | upload |
| Student test-taking with timer | Done | frontend |
| Gamification (XP, coins, streaks) | Done | gamification |
| Attendance tracking | Done | core-platform |
| Fee management | Done | billing |
| Teaching plans (AI) | Done | content |
| Syllabus tracking | Done | core-platform |
| Announcements | Done | notification |
| Student mood tracking | Done | wellness |
| Admin dashboard | Done | admin-dashboard |
| Calendar & scheduling | Done | frontend |
| Parent reports | Planned | parent-reporting |
| Community/forums | Planned | community |
