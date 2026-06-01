import CoachHeader from "../component/headers/CoachHeader";
import CoachFooter from "../component/footers/CoachFooter";

const CoachLayout = ({ children }) => {
  return (
    <>
      <CoachHeader />
      <main className="main-content">
        {children}
      </main>
      <CoachFooter />
    </>
  );
};

export default CoachLayout;
