import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import HeroCarousel from "@/components/landing/HeroCarousel";
import RadioPlayer from "@/components/landing/RadioPlayer";
import ArtistsSection from "@/components/landing/ArtistsSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Studio | Revista Musical & Rádio 24h</title>
        <meta
          name="description"
          content="Descubra os melhores artistas, lançamentos e produções musicais. Ouça nossa rádio 24 horas com o melhor da música brasileira contemporânea."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main>
          <HeroCarousel />
          <RadioPlayer />
          <ArtistsSection />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;
