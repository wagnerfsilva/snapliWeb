import { ShoppingCart, X, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import useCartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    items,
    events,
    removePhoto,
    clearCart,
    getItemCount,
    getTotalPrice,
    getPriceBreakdownPerEvent,
  } = useCartStore();
  const navigate = useNavigate();

  const itemCount = getItemCount();
  const totalPrice = getTotalPrice();
  const eventBreakdowns = getPriceBreakdownPerEvent();

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
          className="fixed bottom-6 right-6 rounded-xl px-6 py-4 shadow-lg flex flex-col items-center gap-2 transition-all z-40 min-w-[140px] font-semibold"
          style={{ background: 'var(--lime)', color: '#09090B' }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span>
              {itemCount} foto{itemCount > 1 ? "s" : ""}
            </span>
          </div>
          {totalPrice > 0 && (
            <div className="text-sm font-bold">
              R$ {totalPrice.toFixed(2)}
            </div>
          )}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg flex items-center gap-2 transition-all z-40"
          style={{ background: 'var(--lime)', color: '#09090B' }}
        >
          <ShoppingCart className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar do carrinho */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setIsOpen(false)} />

          {/* Carrinho */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col" style={{ background: 'var(--surface)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-2xl font-bold font-sora">Meu Carrinho</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            {itemCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <ShoppingCart className="h-16 w-16 text-dim mb-4" />
                <h3 className="text-lg font-semibold mb-2">Carrinho vazio</h3>
                <p className="text-muted">Adicione fotos para começar sua compra</p>
              </div>
            ) : (
              <>
                {/* Items grouped by event */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {eventBreakdowns.map((evBreak) => {
                    const photosInEvent = items.filter((item) => item.eventId === evBreak.eventId);
                    return (
                      <div key={evBreak.eventId}>
                        {/* Event header */}
                        <div className="flex items-center justify-between mb-2 px-1">
                          <p className="text-sm font-semibold text-lime truncate">
                            {evBreak.eventName}
                          </p>
                          <p className="text-xs text-muted ml-2 whitespace-nowrap">
                            {evBreak.photoCount} foto{evBreak.photoCount > 1 ? "s" : ""}
                            {" · "}
                            <span className="font-semibold text-white">
                              R$ {evBreak.breakdown.totalPrice.toFixed(2)}
                            </span>
                          </p>
                        </div>
                        {/* Photos in this event */}
                        <div className="space-y-2">
                          {photosInEvent.map((photo) => (
                            <div
                              key={photo.id}
                              className="flex items-center gap-3 p-3 rounded-xl"
                              style={{ background: 'var(--bg)' }}
                            >
                              <img
                                src={photo.watermarkedUrl}
                                alt="Foto"
                                className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  Foto #{photo.id.slice(0, 8)}
                                </p>
                              </div>
                              <button
                                onClick={() => removePhoto(photo.id)}
                                className="transition-colors flex-shrink-0"
                                style={{ color: '#FF5050' }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Per-event breakdown */}
                        {evBreak.breakdown.details && (
                          <p className="text-xs text-muted mt-1 px-1">
                            {evBreak.breakdown.details}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                {totalPrice > 0 && (
                  <div className="p-4" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                    {eventBreakdowns.length > 1 && (
                      <div className="space-y-1 mb-2">
                        {eventBreakdowns.map((evBreak) => (
                          <div key={evBreak.eventId} className="flex justify-between text-sm text-muted">
                            <span className="truncate mr-2">{evBreak.eventName}</span>
                            <span className="font-medium whitespace-nowrap">
                              R$ {evBreak.breakdown.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--border)' }} />
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-lime">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="p-6 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={handleCheckout}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <span>Finalizar Compra</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button onClick={clearCart} className="btn btn-secondary w-full">
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
