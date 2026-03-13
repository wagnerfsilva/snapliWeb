import { Link } from "react-router-dom";
import { Camera, Search, Upload, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encontre suas fotos com IA
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Use reconhecimento facial para encontrar todas as suas fotos em
              eventos
            </p>
            <Link
              to="/search"
              className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Search className="h-6 w-6" />
              <span>Buscar Minhas Fotos</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como Funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Upload className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Envie sua foto</h3>
              <p className="text-gray-600">
                Tire uma selfie ou faça upload de uma foto com seu rosto visível
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                2. IA busca suas fotos
              </h3>
              <p className="text-gray-600">
                Nossa inteligência artificial compara seu rosto com todas as
                fotos do evento
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Camera className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                3. Veja seus resultados
              </h3>
              <p className="text-gray-600">
                Visualize todas as fotos onde você aparece e escolha as que
                deseja adquirir
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Seguro e Privado</h2>
            <p className="text-lg text-gray-600">
              Suas fotos e dados estão protegidos. Utilizamos tecnologia de
              ponta da AWS para garantir a segurança e privacidade das suas
              informações.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para encontrar suas fotos?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Comece agora mesmo, é rápido e fácil!
          </p>
          <Link to="/search" className="btn btn-primary btn-lg">
            Buscar Agora
          </Link>
        </div>
      </section>
    </div>
  );
}
