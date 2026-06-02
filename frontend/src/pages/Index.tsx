import IAmedBRHero from "@/components/IAmedBRHero";
import HowItWorks from "@/components/sections/HowItWorks";
import Modules from "@/components/sections/Modules";
import Stats from "@/components/sections/Stats";
import Security from "@/components/sections/Security";
import Pricing from "@/components/sections/Pricing";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";

const Index = () => {
  return (
    <main>
      <IAmedBRHero />
      <HowItWorks />
      <Modules />
      <Stats />
      <Security />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
};

export default Index;
