import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ScrollToTop component ensures that the window scrolls to the top 
 * when a new page is visited (PUSH/REPLACE), while maintaining the 
 * browser's native scroll restoration for back/forward navigation (POP).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Only scroll to top on explicit navigation (clicking a link)
    // Avoid scrolling to top when pressing the Back button
    if (navigationType !== 'POP') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use 'instant' to avoid jerky visual transitions on new page load
      });
    }
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
