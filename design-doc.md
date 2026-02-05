Habit Tracker — Design System Document

1. Purpose

This document defines the visual language, layout rules, components, and interaction patterns for the Habit Tracker application.
It is derived directly from the current dashboard UI and is intended to ensure design consistency across screens, features, and future iterations.

This system is platform-agnostic and can be implemented in:

Figma

Tailwind / CSS

React / Next.js components

AI-driven UI generation

2. Design Philosophy

Tone

Calm

Focused

Productivity-driven

Premium dark UI

Principles

High information density without clutter

Minimal but purposeful color usage

Clear visual hierarchy

Fast visual feedback

Data-first layout

3. Color System
   Backgrounds

App Background: #0B0D10

Header Background: #0E1014

Surface / Section Background: #111418

Card Background: #14181D

Text

Primary Text: #FFFFFF

Secondary Text: #9AA1A9

Muted Text: #6B7280

Disabled Text: #4B5563

Accents & States

Primary Accent (Completed / CTA): #14B8A6

Primary Muted: #0F766E

Danger (Logout / Delete): #EF4444

Warning (Streak Flame): #F97316

Borders

Default Border: #1F2933

Subtle Border: #1C2026

4. Typography

Font Family

Inter, system-ui, sans-serif

Type Scale

App Title: 24px / 600 / 32px

Section Header: 16px / 500 / 24px

Body Text: 14px / 400 / 20px

Caption / Meta: 12px / 400 / 16px

Metrics / Percentages: 32px / 700 / 40px

5. Spacing & Layout
   Spacing Scale

XS: 4px

SM: 8px

MD: 16px

LG: 24px

XL: 32px

2XL: 48px

Layout Rules

Page padding: 24px

Section gap: 16px

Grid-based alignment

Horizontal scrolling allowed for dense data

Border Radius

Small: 6px

Medium: 10px

Large: 14px

6. Core Layout Structure
   Header (Sticky)

Height: 64px

Contains:

App Title

Welcome message (Welcome, {User})

Current date (Day, Month, Year)

Logout button

Sticky with high z-index

Subtle bottom border

7. Input & Controls
   Text Input (Add Habit)

Height: 44px

Background: Surface color

Border: Default border

Rounded medium corners

Placeholder uses muted text color

Buttons

Primary Button:

Filled with primary accent

White text

Medium radius

Danger Button:

Transparent background

Red border and text

Icon Buttons:

Square

Transparent by default

Hover background highlight

8. Progress & Metrics
   Progress Card

Card background

Large percentage metric

Subtext showing completed vs total checks

Horizontal progress bar:

Track: subtle border color

Fill: primary accent

Rounded large corners

Compact but readable

9. Month Navigation

Centered month label (e.g., “February 2026”)

Left and right arrow buttons

Updates visible calendar days

Visually separated from grid

10. Habit Grid (Primary Interaction Area)
    Structure

Horizontally scrollable grid

Fixed left column for habit names

Second column for streaks

Remaining columns represent days of month

Row

Fixed height: 48px

Subtle hover background

Alternating visual separation via borders

11. Habit Row Elements
    Habit Name Cell

Habit title text

Delete icon (danger color)

Hover-revealed controls optional

Reordering

Up and down arrow icon buttons

Small, unobtrusive

Persist order changes

12. Day Cell Design
    Dimensions

Square cells: 32px × 32px

Rounded corners: 6px

States

Empty:

Dark surface background

Subtle border

Completed:

Filled with primary accent

White check icon

Today:

Highlighted border or stronger accent

Future:

Reduced opacity

Disabled interaction

Interaction

Click toggles completion

Immediate visual feedback

Optimistic UI behavior

13. Streak Indicator

Flame icon + numeric count

Color-coded by streak length:

Low: Orange

Medium: Amber

High: Yellow

Positioned consistently beside habit name

14. Motion & Feedback

Hover transitions: 150ms ease-in-out

Toggle animation: subtle scale + fade

No heavy motion

Feedback is instant and predictable

15. Responsive Behavior
    Desktop

Full grid visible

Horizontal scrolling for days

Sticky header

Tablet

Condensed spacing

Swipeable day columns

Mobile

Habits collapse into cards

Days scroll horizontally

Controls remain accessible

16. Component Naming (Dev Alignment)

AppHeader

AddHabitInput

ProgressCard

MonthNavigator

HabitGrid

HabitRow

DayCell

StreakBadge

17. Usage Guidelines

This design system should be:

The reference for all new UI

The basis for Tailwind tokens / CSS variables

Used to maintain visual consistency across features

Any deviation should be intentional and documented.
