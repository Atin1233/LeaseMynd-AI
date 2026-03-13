"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import {
  Header,
  Hero,
  Stats,
  Benefits,
  Pricing,
  Testimonials,
  FAQ,
  CTA,
  Footer,
} from "~/components/landing";
import Container from "~/components/landing/Container";

// Dynamically import components that might cause hydration issues
const HowItWorks = dynamic(() => import("~/components/landing/HowItWorks"), {
  ssr: false,
});
const AIAssistance = dynamic(() => import("~/components/landing/AIAssistance"), {
  ssr: false,
});

const LoadingFallback = () => (
  <div className="py-16 md:py-24">
    <Container>
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
      </div>
    </Container>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Purple gradient background - visible throughout */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-white">
        <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-200 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-purple-300 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-[30%] left-[5%] w-[350px] h-[350px] bg-purple-100 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-white/10 backdrop-blur-sm">
        <Container>
          <Stats />
        </Container>
      </section>

      {/* How It Works - Client side only */}
      <Suspense fallback={<LoadingFallback />}>
        <section id="how-it-works" className="py-16 md:py-24">
          <Container>
            <HowItWorks />
          </Container>
        </section>
      </Suspense>

      {/* Benefits Sections */}
      <section id="features" className="py-16 md:py-24 bg-white/10 backdrop-blur-sm">
        <Container>
          <Benefits />
        </Container>
      </section>

      {/* AI Assistance - Client side only */}
      <Suspense fallback={<LoadingFallback />}>
        <section id="ai-assistance" className="py-16 md:py-24">
          <Container>
            <AIAssistance />
          </Container>
        </section>
      </Suspense>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 bg-white/10 backdrop-blur-sm">
        <Container>
          <Testimonials />
        </Container>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24">
        <Container>
          <Pricing />
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-white/10 backdrop-blur-sm">
        <Container>
          <FAQ />
        </Container>
      </section>

      {/* Final CTA */}
      <CTA />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
