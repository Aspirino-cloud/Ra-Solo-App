import { useState, useReducer } from 'react';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import { GameState } from './types';
import { gameReducer } from './lib/gameReducer';

export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, null as unknown as GameState);
  const [isStarted, setIsStarted] = useState(false);

  // We bootstrap the state natively
  if (!isStarted || !gameState) {
    return <SetupScreen onStart={(st) => {
       dispatch({ type: 'START_GAME', payload: st });
       setIsStarted(true);
    }} />;
  }

  return <GameBoard gameState={gameState} dispatch={dispatch} onRestart={() => setIsStarted(false)} />;
}

