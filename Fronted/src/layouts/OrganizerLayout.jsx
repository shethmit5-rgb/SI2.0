import OrganizerHeader from "../component/headers/OrganizerHeader";
import OrganizerFooter from "../component/footers/OrganizerFooter";

const OrganizerLayout = ({ children }) => {
  return (
    <>
      <OrganizerHeader />
      <main className="main-content">
        {children}
      </main>
      <OrganizerFooter />
    </>
  );
};

export default OrganizerLayout;
