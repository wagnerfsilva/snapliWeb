import { useSearchStore } from "../store/searchStore";
import useCartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Check } from "lucide-react";
import { useState, useEffect } from "react";
import Cart from "../components/Cart";

export default function ResultsPage() {
  const { searchResults, uploadedImage } = useSearchStore();
  const { addPhoto, items } = useCartStore();
  const navigate = useNavigate();

  // Get event data from search results (includes pricing)
  const eventData = searchResults?.[0]?.event || null;

  const isPhotoInCart = (photoId) => {
    return items.some((item) => item.id === photoId);
  };

  const pricing = eventData
    ? {
        pricePerPhoto: eventData.pricePerPhoto,
        pricingPackages: eventData.pricingPackages,
        allPhotosPrice: eventData.allPhotosPrice,
      }
    : {};

  const handleAddToCart = (photo) => {
    addPhoto(
      photo,
      photo.eventId,
      searchResults[0]?.event?.name || "Evento",
      pricing,
    );
  };

  const allInCart = searchResults.length > 0 && searchResults.every((p) => isPhotoInCart(p.id));

  const handleAddAll = () => {
    searchResults.forEach((photo) => {
      if (!isPhotoInCart(photo.id)) {
        addPhoto(photo, photo.eventId, searchResults[0]?.event?.name || "Evento", pricing);
      }
    });
  };

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Search className="h-16 w-16 text-dim mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-sora mb-2">
              Nenhuma foto encontrada
            </h2>
            <p className="text-muted mb-6">
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
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-sora mb-2">
              Encontramos {searchResults.length} foto(s)!
            </h1>
            <p className="text-muted">
              Todas as fotos são exibidas com marca d'água. Adquira as originais
              em alta resolução.
            </p>
          </div>
          <button
            onClick={handleAddAll}
            disabled={allInCart}
            className="btn btn-primary whitespace-nowrap flex items-center gap-2 self-start sm:self-auto"
          >
            {allInCart ? (
              <>
                <Check className="h-4 w-4" />
                Todas no Carrinho
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Adicionar Todas ({searchResults.length})
              </>
            )}
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {searchResults.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-white/20"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="aspect-square">
                <img
                  src={photo.watermarkedUrl}
                  alt={photo.originalFilename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">
                    {photo.event?.name}
                  </span>
                  <span className="badge badge-info text-[10px] px-1.5 py-0.5 ml-1 whitespace-nowrap">
                    {Math.round(photo.similarity)}% match
                  </span>
                </div>

                <p className="text-[10px] text-dim mb-2">
                  {new Date(photo.event?.date).toLocaleDateString("pt-BR")}
                </p>

                {isPhotoInCart(photo.id) ? (
                  <button
                    disabled
                    className="w-full btn btn-success btn-sm text-xs py-1.5 flex items-center justify-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    No Carrinho
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToCart(photo)}
                    className="w-full btn btn-primary btn-sm text-xs py-1.5 flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="h-3 w-3" />
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
