# Product Overview

Algebra Assault is an educational math game targeting Grade 10 students. It combines a space-shooter arcade game with algebra practice, making math drills engaging through gamification.

## Core Concept

Players control a spaceship and fight aliens by solving algebra questions. Correct answers deal damage to bosses and progress through waves. The game is personalized for a student named "Matteo" (subtitle: "Matteo's Math Mission").

## Game Modes

- **Topic Missions**: Linear Equations, Quadratic Equations, Exponential Expressions, Exponential Equations, Inequalities, Simultaneous Equations
- **Ultimate Challenge**: Mixed questions from all topics at medium/hard difficulty
- **Exam Simulator**: Timed quiz (25s per question, 3 lives, 10 questions) without the shooter gameplay

## Gameplay Loop

1. Player shoots aliens in a space-shooter canvas game
2. After killing a set number of aliens per wave, a math question appears
3. Correct answers advance the wave; wrong answers cost HP
4. After 4 waves, a boss fight begins — boss HP is reduced by answering questions correctly
5. Completing a boss unlocks topic completion

## Key Features

- Difficulty progression (easy → medium → hard questions per topic)
- Power-up system (Shield, Rapid Fire, Triple Shot, Health, Nuke)
- HP-based health system with damage from aliens, bullets, and wrong answers
- Progress persistence via localStorage (or external storage API)
- Sound effects via Web Audio API
- Mobile-friendly (touch controls, viewport scaling)
- Parent feedback survey link
- Parent disclaimer on first load
