// Newest first; ties keep their original order (newly added items stay on top).
export const byNewest = (a, b) => (b.date || "").localeCompare(a.date || "");
export const sortNewest = (items) => [...items].sort(byNewest);
