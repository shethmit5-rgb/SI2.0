import PlayerHeader from "../component/headers/PlayerHeader";
import PlayerFooter from "../component/footers/PlayerFooter";

const PlayerLayout = ({ children }) => {
  return (
    <>
      <PlayerHeader />
      <main className="main-content">
        {children}
      </main>
      <PlayerFooter />
    </>
  );
};

export default PlayerLayout;
