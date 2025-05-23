// frontend/src/pages/RedirectOnRoot.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RedirectOnRoot = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/main", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
};

export default RedirectOnRoot;