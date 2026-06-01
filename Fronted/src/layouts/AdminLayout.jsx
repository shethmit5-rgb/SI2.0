import AdminHeader from "../component/headers/AdminHeader";
import AdminFooter from "../component/footers/AdminFooter";

const AdminLayout = ({ children }) => {
  return (
    <>
      <AdminHeader />
      <main className="main-content">
        {children}
      </main>
      <AdminFooter />
    </>
  );
};

export default AdminLayout;
