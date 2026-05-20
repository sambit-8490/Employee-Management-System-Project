import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function Navbar({ userType, setUserType }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  /* ---------------- MOBILE CHECK ---------------- */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------------- USER LOGOUT ---------------- */
  const handleLogout = async (e) => {
    e?.preventDefault();

    try {
      setUserType(null);
      localStorage.removeItem("userType");
      sessionStorage.removeItem("userType");

      const response = await axios.post(
        "http://localhost:5200/api/v1/user/logout",
        {},
        { withCredentials: true }
      );

      toast.success(response.data.message);
      navigate("/", { replace: true });
    } catch (err) {
      console.log(err);
      toast.error("Logout failed");
    }
  };

  /* ---------------- ADMIN LOGOUT ---------------- */
  const handleAdminLogout = async (e) => {
    e?.preventDefault();

    try {
      setUserType(null);
      localStorage.removeItem("admin");
      localStorage.removeItem("token");
      sessionStorage.removeItem("userType");

      const response = await axios.post(
        "http://localhost:5200/api/v1/admin/logout",
        {},
        { withCredentials: true }
      );

      toast.success(response.data.message);
      navigate("/", { replace: true });
    } catch (err) {
      console.log(err);
      toast.error("Admin logout failed");
    }
  };

  const isAdminUrl = location.pathname.includes("admin-dashboard");

  /* ---------------- MOBILE NAV ---------------- */
  const MobileNav = () => {
    return (
      <nav>
        {location.pathname === "/" && (
          <div className="min-h-12">
            <Link to="/" className="text-2xl ml-4">
              EMS
            </Link>

            {isOpen ? (
              <div
                className="absolute right-3 top-3"
                onClick={() => setIsOpen(!isOpen)}
              >
                ☰
              </div>
            ) : (
              <div>
                <button
                  className="absolute right-3 top-3"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  ✕
                </button>

                <nav className="mt-8 ml-4 flex flex-col items-end mr-12 text-xl">
                  <Link to="/emplogin">Employee</Link>
                  <Link to="/adminlogin">Admin</Link>
                </nav>
              </div>
            )}
          </div>
        )}
      </nav>
    );
  };

  return (
    <div className="z-[100] sticky top-0">
      <motion.nav
        initial={{ translateY: "-100px", opacity: 0 }}
        animate={{ translateY: "0px", opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-violet-100/50 backdrop-blur-lg shadow-md absolute right-0 left-0 top-0 z-[100]"
      >
        {isMobile ? (
          <MobileNav />
        ) : (
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="text-2xl font-light">
                EMS
              </Link>

              {/* Links */}
              <div className="flex space-x-4 items-center">

                {/* Home links */}
                {location.pathname === "/" && (
                  <>
                    <Link to="/emplogin">Employee</Link>
                    <Link to="/adminlogin">Admin</Link>
                  </>
                )}

                {/* Dashboard links */}
                {(location.pathname.includes("admin") ||
                  location.pathname.includes("emp")) && (
                  <>
                    <Link
                      to={`/${isAdminUrl ? "admin" : "emp"}-dashboard`}
                    >
                      Dashboard
                    </Link>

                    {/* FIXED: About is ONLY navigation */}
                    <Link to="/about">About</Link>

                    {/* FIXED: Logout is NOT route-based */}
                    {location.pathname.includes("admin") ? (
                      <button onClick={handleAdminLogout}>Logout</button>
                    ) : (
                      <button onClick={handleLogout}>Logout</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.nav>
    </div>
  );
}

export default Navbar;
