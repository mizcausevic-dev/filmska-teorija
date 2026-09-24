import { sourceById } from './data/learning';

export function moduleUrl(id: string) {
  return `${import.meta.env.BASE_URL}theory/${id}/`;
}

export function routeModuleId() {
  const match = window.location.pathname.match(/\/theory\/([^/]+)\/?$/);
  const id = match?.[1] ?? window.location.hash.slice(1);
  return sourceById.has(id) ? id : 'film-theory';
}
