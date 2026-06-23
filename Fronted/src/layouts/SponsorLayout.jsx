import SponsorHeader from "../component/headers/SponsorHeader";
import PlayerFooter from "../component/footers/PlayerFooter";

const SponsorLayout = ({ children }) => {
  return (
    <>
      <SponsorHeader />
      <main className="main-content">
        {children}
      </main>
      <PlayerFooter />
    </>
  );
};

export default SponsorLayout;
