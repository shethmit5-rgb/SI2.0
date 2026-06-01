import GuestHeader from "../component/headers/GuestHeader";
import GuestFooter from "../component/footers/GuestFooter";

const GuestLayout = ({ children }) => {
  return (
    <>
      <GuestHeader />
      <main className="main-content">
        {children}
      </main>
      <GuestFooter />
    </>
  );
};

export default GuestLayout;
