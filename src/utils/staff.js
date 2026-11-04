export const staffName = (staff, id) => staff.find((s) => s.id === id)?.name ?? null
