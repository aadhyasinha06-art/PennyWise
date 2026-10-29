import { createContext, useContext } from "react";

// Shares the currency formatter, toast and confirm dialog with every page.
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
