// Chef catalog is now fully dynamic (managed via /api/chefs).
// This file is kept as a re-export hub so existing imports don't break.

export { getAllChefs } from "./chef-service";
