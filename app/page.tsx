import GameBoard from "./components/game/GameBoard";
import ErrorBoundary from "./components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <GameBoard />
    </ErrorBoundary>
  );
}
