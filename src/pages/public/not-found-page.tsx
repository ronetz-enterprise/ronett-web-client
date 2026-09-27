import { NotFoundContent } from "./not-found-content";
export default function NotFoundPage() {
  return <NotFoundContent />;
}
export function loader() {
  throw new Response(null, { status: 404 });
}
export function ErrorBoundary() {
  return <NotFoundContent />;
}
