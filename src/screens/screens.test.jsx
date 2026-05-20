import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MenuScreen } from './MenuScreen.jsx';
import { TopicSelectScreen } from './TopicSelectScreen.jsx';
import { PlayingScreen } from './PlayingScreen.jsx';
import { ExamScreen } from './ExamScreen.jsx';
import { ExamResultsScreen } from './ExamResultsScreen.jsx';
import { VictoryScreen } from './VictoryScreen.jsx';
import { GameOverScreen } from './GameOverScreen.jsx';

describe('Screen components render without error', () => {
  it('MenuScreen renders without throwing', () => {
    expect(() =>
      render(
        <MenuScreen
          soundOn={false}
          setSoundOn={() => {}}
          setScreen={() => {}}
          showDisclaimer={false}
          setShowDisclaimer={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('TopicSelectScreen renders without throwing', () => {
    expect(() =>
      render(
        <TopicSelectScreen
          completed={{}}
          startMission={() => {}}
          setScreen={() => {}}
          soundOn={false}
          setSoundOn={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('PlayingScreen renders without throwing', () => {
    expect(() =>
      render(
        <PlayingScreen
          canvasRef={{ current: null }}
          hp={100}
          score={0}
          bossActive={false}
          bossHp={3}
          waveNumber={1}
          aliensKilled={0}
          topic="linear"
          showQuestion={false}
          feedback={null}
          paused={false}
          activePowerups={{ shield: 0, rapid: 0, triple: 0 }}
          soundOn={false}
          questions={[{ q: 'x+1=2', a: '1', wrong: ['2', '3', '4'], hint: 'subtract 1' }]}
          qIdx={0}
          handleAnswer={() => {}}
          setPaused={() => {}}
          setSoundOn={() => {}}
          setScreen={() => {}}
          handleMouseMove={() => {}}
          handleMouseDown={() => {}}
          handleMouseLeave={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('ExamScreen renders without throwing', () => {
    expect(() =>
      render(
        <ExamScreen
          questions={[{ q: 'x+1=2', a: '1', wrong: ['2', '3', '4'], hint: 'subtract 1' }]}
          qIdx={0}
          score={0}
          examTimer={25}
          examLives={3}
          examFeedback={null}
          soundOn={false}
          handleExamAnswer={() => {}}
          setScreen={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('ExamResultsScreen renders without throwing', () => {
    expect(() =>
      render(
        <ExamResultsScreen
          examCorrect={7}
          score={1000}
          examLives={2}
          examDuration={120000}
          startExam={() => {}}
          setScreen={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('VictoryScreen renders without throwing', () => {
    expect(() =>
      render(
        <VictoryScreen
          topic="linear"
          score={1000}
          hp={80}
          bestStreak={3}
          completed={{ linear: true }}
          startMission={() => {}}
          setScreen={() => {}}
          soundOn={false}
        />
      )
    ).not.toThrow();
  });

  it('GameOverScreen renders without throwing', () => {
    expect(() =>
      render(
        <GameOverScreen
          topic="linear"
          score={500}
          waveNumber={3}
          bossActive={false}
          bossHp={3}
          startMission={() => {}}
          setScreen={() => {}}
        />
      )
    ).not.toThrow();
  });
});
