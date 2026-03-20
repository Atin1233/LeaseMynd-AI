import LandingPage from "./_components/LandingPage";

// Force dynamic rendering to avoid clientReferenceManifest error
export const dynamic = 'force-dynamic';

export default function Page() {
  return <LandingPage />;
}
