import { ShoppingCart, X, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import useCartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";

export default function Cart({ eventPricing }) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    items,
    eventData,
    removePhoto,
    clearCart,
    getItemCount,
    getPriceBreakdown,
  } = useCartStore();
  const navigate = useNavigate();

  const itemCount = getItemCount();

  const priceInfo = getPriceBreakdown(
    eventPricing?.pricePerPhoto,
    eventPricing?.pricingPackages,
    eventPricing?.allPhotosPrice,
  );

  const handleCheckout = () => {
    navigate("/checkout");
    setIsOpen(false);
  };

  return (
    <>
      {/* Botão do carrinho */}
      {itemCount > 0 ? (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-6 py-4 shadow-lg flex flex-col items-center gap-2 transition-all z-40 min-w-[140px]"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">
              {itemCount} foto{itemCount > 1 ? "s" : ""}
            </span>
          </div>
          {priceInfo.totalPrice > 0 && (
            <div className="text-sm font-bold">
              R$ {priceInfo.totalPrice.toFixed(2)}
            </div>
          )}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all z-40"
        >
          <ShoppingCart className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar do carrinho */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Carrinho */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Meu Carrinho</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            {itemCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Carrinho vazio
                </h3>
                <p className="text-gray-600">
                  Adicione fotos para começar sua compra
                </p>
              </div>
            ) : (
              <>
                {/* Event info */}
                {eventData && (
                  <div className="p-4 bg-primary-50 border-b border-primary-100">
                    <p className="text-sm font-medium text-primary-900">
                      {eventData.eventName}
                    </p>
                    <p className="text-xs text-primary-700">
                      {itemCount} foto{itemCount > 1 ? "s" : ""} selecionada
                      {itemCount > 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((photo) => (
                    <div
                      key={photo.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt="Foto"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Foto #{photo.id.slice(0, 8)}
                        </p>
                      </div>
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                {priceInfo.totalPrice > 0 && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Melhor opção:</span>
                        <span className="font-medium">{priceInfo.details}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total:</span>
                        <span className="text-primary-600">
                          R$ {priceInfo.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <span>Finalizar Compra</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={clearCart}
                    className="btn btn-secondary w-full"
                  >
                    Limpar Carrinho
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
