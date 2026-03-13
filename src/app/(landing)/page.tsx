"use client";

import { useEffect, useState } from "react";
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
import HowItWorks from "~/components/landing/HowItWorks";
import AIAssistance from "~/components/landing/AIAssistance";
import Container from "~/components/landing/Container";

const LandingPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

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

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24">
        <Container>
          <HowItWorks />
        </Container>
      </section>

      {/* Benefits Sections */}
      <section id="features" className="py-16 md:py-24 bg-white/10 backdrop-blur-sm">
        <Container>
          <Benefits />
        </Container>
      </section>

      {/* AI Assistance Section */}
      <section id="ai-assistance" className="py-16 md:py-24">
        <Container>
          <AIAssistance />
        </Container>
      </section>

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
