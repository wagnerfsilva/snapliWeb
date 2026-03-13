import { useSearchStore } from "../store/searchStore";
import useCartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Check } from "lucide-react";
import { useState, useEffect } from "react";
import Cart from "../components/Cart";
import api from "../lib/api";

export default function ResultsPage() {
  const { searchResults, uploadedImage } = useSearchStore();
  const { addPhoto, items } = useCartStore();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega dados do evento
  useEffect(() => {
    const fetchEventData = async () => {
      if (searchResults && searchResults.length > 0) {
        const eventId = searchResults[0].eventId;
        try {
          const response = await api.get(`/events/${eventId}`);
          setEventData(response.data.data.event);
        } catch (error) {
          console.error("Erro ao carregar dados do evento:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEventData();
  }, [searchResults]);

  const isPhotoInCart = (photoId) => {
    return items.some((item) => item.id === photoId);
  };

  const handleAddToCart = (photo) => {
    const pricing = eventData
      ? {
          pricePerPhoto: eventData.pricePerPhoto,
          pricingPackages: eventData.pricingPackages,
          allPhotosPrice: eventData.allPhotosPrice,
        }
      : {};
    addPhoto(
      photo,
      photo.eventId,
      searchResults[0]?.event?.name || "Evento",
      pricing,
    );
  };

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhuma foto encontrada
            </h2>
            <p className="text-gray-600 mb-6">
              Não encontramos fotos com seu rosto. Tente com outra imagem.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="btn btn-primary"
            >
              Nova Busca
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Encontramos {searchResults.length} foto(s)!
          </h1>
          <p className="text-gray-600">
            Todas as fotos são exibidas com marca d'água. Adquira as originais
            em alta resolução.
          </p>
        </div>

        {/* Results Grid */}
        <div className="image-gallery">
          {searchResults.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-w-4 aspect-h-3">
                <img
                  src={photo.watermarkedUrl}
                  alt={photo.originalFilename}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {photo.event?.name}
                  </span>
                  <span className="badge badge-info">
                    {Math.round(photo.similarity)}% match
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  {new Date(photo.event?.date).toLocaleDateString("pt-BR")}
                </p>

                {isPhotoInCart(photo.id) ? (
                  <button
                    disabled
                    className="w-full btn btn-success btn-sm flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    No Carrinho
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToCart(photo)}
                    className="w-full btn btn-primary btn-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Adicionar ao Carrinho
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate("/search")}
            className="btn btn-secondary"
          >
            Nova Busca
          </button>
        </div>

        {/* Cart Component */}
        {eventData && (
          <Cart
            eventPricing={{
              pricePerPhoto: eventData.pricePerPhoto,
              pricingPackages: eventData.pricingPackages,
              allPhotosPrice: eventData.allPhotosPrice,
            }}
          />
        )}
      </div>
    </div>
  );
}
