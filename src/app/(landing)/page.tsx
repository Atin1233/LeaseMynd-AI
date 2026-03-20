import LandingPage from "./_components/LandingPage";

// Force server-side rendering - skip static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <LandingPage />;
}
