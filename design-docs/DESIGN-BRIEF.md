# 憶當年 - Reminiscence Group PWA Design Brief

Status: Shared understanding confirmed on 2026-08-17. This is a design consolidation only; no application code has been created.

## Purpose

A PWA for occupational therapists to run 30-minute group reminiscence sessions in a Hong Kong elderly home. One facilitator device (laptop or mobile) is mirrored to a TV through HDMI; residents participate aloud while the therapist controls the screen.

## Operating Context

- Group size: 8-12 residents.
- Participant profile: mild-to-moderate dementia.
- Session length: 30 minutes including warm-up and close.
- Spoken language: Cantonese.
- On-screen text: standard written Chinese in Traditional characters.
- No built-in narration or text-to-speech.

## Core Interaction Model

- Single facilitator surface mirrored to the TV; no resident devices and no multi-device sync in v1.
- Laptop and mobile expose the same feature set, including authoring and import/export.
- Therapist-only tapping; residents respond orally or by pointing.
- Full-screen media cards in a linear sequence.
- Visible control bar: Back, Next, Repeat Song, Reveal Answer, Home.
- No timers, no scoring, no leaderboard.

## Content Library

- Media types: full-length songs, historical photos, short video clips (30-90 seconds), and text/caption cards.
- Starter library: 30 songs, 120 photos, video clips, text cards, and 10 starter session plans.
- Media metadata: title, source credit, year/decade, place, theme, caption, notes.
- Tags: theme, decade, place.
- Starter themes: Childhood Toys, Home Life, Markets & Food, Work & Trades, Festivals & Customs, Transport, School Days.
- Era plans: 1950s Hong Kong, 1960s Hong Kong, 1970s Hong Kong.
- Priority places: Sham Shui Po, Wan Chai, Yau Ma Tei, Sheung Wan, Mong Kok, Tsuen Wan, Kwun Tong, plus other Hong Kong districts.

## Question Model

- Recall questions: factual multiple choice with 2-4 choices; global default of 3; correct answer revealed gently.
- Discussion prompts: open-ended with no single right answer.
- Defaults: 1 recall question and 2 discussion prompts per media item.
- Question pools by theme, decade, and place supplement item-level questions.
- Questions open on demand from a Question Overlay, never automatically.

## Session Player

- Reorderable phases: Warm-up, Songs + Photos, Video, Recall, Discussion, Close.
- Media items are independent cards; no forced song-photo pairing.
- Full-track playback with progress, skip, and Repeat Song controls.
- Videos start on tap with sound, never autoplay.
- Questions appear in an on-demand overlay: recall first, then discussion.

## Library and Explore

- Main sections: Home, Session Plans, Library, Explore, Session Log.
- Home is the first screen: Prepare Offline, Start Session, recent activity.
- Explore grid filters by Theme, Decade, and Place.
- Tapping a grid item opens its full-screen media card with questions available.
- Session builder works on laptop and mobile with equal capability.

## Authoring and Updates

- In-app add/edit for media items, questions, and session plans.
- Bulk import/export via single-file packages; iOS uses multi-file selection instead of folder pickers.
- New content packs are installed manually: quarterly or on request, never silently.
- Therapists can still add home-specific items at any time.

## Offline and Delivery

- Online-first streaming from hosted storage and a CDN.
- One-tap Prepare Offline downloads all media and questions for a session.
- Device keeps the currently running session plus the last prepared session.
- Installable PWA with app-shell caching.

## Devices and Testing

- Primary v1 test targets: iPhone Safari, Android Chrome, laptop Chrome.
- Supported but lower priority: Windows Edge, Mac Safari.
- Presentation is landscape-friendly for the TV.

## Privacy and Hosting

- Static-hosted PWA plus CDN media.
- No accounts and no cloud personal data.
- Session logs, attendance, and notes stay on the device; export happens only on therapist action (PDF/CSV).

## Next Steps (Not Started)

1. Architecture and technology ADRs: storage, service worker strategy, build tooling.
2. Data model and schema for media items, questions, session plans, and logs.
3. Content manifest and starter library assembly from legitimate sources plus home-provided files.
4. Prototype and usability pass with one occupational therapist.
5. Build, then verify against the v1 test matrix.
