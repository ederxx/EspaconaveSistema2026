import { Instagram, Youtube, Music2, Mail, MapPin, Phone } from "lucide-react";
import logoEspaconave from "@/assets/logo-espaconave.jpg";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoEspaconave}
                alt="Espaço Nave"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <h3 className="font-display text-xl font-bold text-gradient-lime uppercase tracking-wider">
                Espaço Nave
              </h3>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Transformando ideias em música desde 2010. Um espaço onde a criatividade encontra a tecnologia.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Youtube size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Music2 size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Navegação</h4>
            <ul className="space-y-3">
              {["Home", "Artistas", "Rádio", "Sobre", "Contato"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Serviços</h4>
            <ul className="space-y-3">
              {["Gravação", "Mixagem", "Masterização", "Produção Musical", "Podcast"].map((service) => (
                <li key={service}>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-1 shrink-0" />
                <span className="text-muted-foreground">
                  Rua Jornalista Marcus Vita Faz Grande 1,<br />
                  Quadra A, Caminho 3, Casa 10<br />
                  Salvador, BA - Brasil
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-primary mt-1 shrink-0" />
                <div className="text-muted-foreground">
                  <p>(71) 98703-4640</p>
                  <p>(71) 99236-3919</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary shrink-0" />
                <a 
                  href="mailto:naveespaco@gmail.com" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  naveespaco@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Espaço Nave Studio. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
