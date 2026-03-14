import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useCartStore from "../store/cartStore";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Check,
  Copy,
  QrCode,
  Clock,
  CheckCircle,
} from "lucide-react";
import api from "../lib/api";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, eventData, clearCart, getPriceBreakdown } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [isValidatingPayment, setIsValidatingPayment] = useState(false);
  const [copiedPixCode, setCopiedPixCode] = useState(false);
  const pollingIntervalRef = useRef(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
  });

  const [errors, setErrors] = useState({});

  // Log dos dados de pricing do carrinho
  useEffect(() => {
    console.log("Dados de pricing do carrinho:", {
      pricePerPhoto: eventData?.pricePerPhoto,
      pricingPackages: eventData?.pricingPackages,
      allPhotosPrice: eventData?.allPhotosPrice,
    });
  }, [eventData]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Start polling for payment validation
  const startPaymentPolling = (orderId) => {
    setIsValidatingPayment(true);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/orders/${orderId}/validate-payment`);

        if (response.data.paid) {
          // Payment confirmed!
          clearInterval(pollingIntervalRef.current);
          setIsValidatingPayment(false);
          setIsSuccess(true);
          clearCart();

          // Redirect to download portal
          setTimeout(() => {
            navigate(`/downloads/${response.data.order.downloadToken}`);
          }, 2000);
        }
      } catch (error) {
        console.error("Erro ao validar pagamento:", error);
      }
    }, 3000);

    // Stop polling after 15 minutes
    setTimeout(
      () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          setIsValidatingPayment(false);
        }
      },
      15 * 60 * 1000,
    );
  };

  const copyPixCode = () => {
    if (pixData?.pixCopyPaste) {
      navigator.clipboard.writeText(pixData.pixCopyPaste);
      setCopiedPixCode(true);
      setTimeout(() => setCopiedPixCode(false), 2000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Nome é obrigatório";
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create order with backend
      console.log("Items no carrinho:", items);

      const orderItems = items.map((item) => {
        // Se item já é um objeto photo, usa item.id
        // Se item tem photo dentro, usa item.photo.id
        const photoId = item.photo ? item.photo.id : item.id;
        return { photoId };
      });

      const orderData = {
        items: orderItems,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
      };

      console.log("Enviando orderData:", orderData);
      const response = await api.post("/orders", orderData);

      if (response.data.success) {
        const { order, payment } = response.data;

        setOrderId(order.id);
        setPixData(payment);
        setShowPixPayment(true);

        // Start polling for payment validation
        startPaymentPolling(order.id);
      }
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      alert(
        error.response?.data?.error ||
          "Erro ao processar pedido. Tente novamente.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Redireciona se não tiver itens no carrinho
  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Carrinho Vazio
          </h2>
          <p className="text-gray-600 mb-6">Você não tem fotos no carrinho.</p>
          <button
            onClick={() => navigate("/search")}
            className="btn btn-primary"
          >
            Buscar Fotos
          </button>
        </div>
      </div>
    );
  }

  // Tela de sucesso
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pagamento Confirmado!
            </h2>
            <p className="text-gray-600 mb-6">
              Seu pagamento foi confirmado e as fotos já estão disponíveis para
              download!
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando para o portal de downloads...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de pagamento PIX
  if (showPixPayment && pixData) {
    const priceInfo = eventData
      ? getPriceBreakdown(
          eventData.pricePerPhoto,
          eventData.pricingPackages,
          eventData.allPhotosPrice,
        )
      : { totalPrice: 0 };

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Pague com PIX
              </h1>
              <p className="text-gray-600">
                Escaneie o QR Code ou copie o código abaixo
              </p>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Valor total</p>
              <p className="text-3xl font-bold text-primary-600">
                R$ {priceInfo.totalPrice.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {items.length} foto{items.length > 1 ? "s" : ""}
              </p>
            </div>

            {/* QR Code */}
            <div className="mb-6">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 flex justify-center">
                {pixData.pixQrCode ? (
                  <img
                    src={pixData.pixQrCode}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded">
                    <p className="text-gray-400 text-sm">
                      QR Code indisponível
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pix Copia e Cola */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ou copie o código PIX:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pixData.pixCopyPaste || ""}
                  readOnly
                  className="input flex-1 font-mono text-xs"
                />
                <button
                  onClick={copyPixCode}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  {copiedPixCode ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status de validação */}
            {isValidatingPayment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      Aguardando pagamento...
                    </p>
                    <p className="text-sm text-blue-700">
                      Assim que o pagamento for confirmado, você será
                      redirecionado automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instruções */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-3">Como pagar:</p>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Abra o app do seu banco</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Escolha pagar com PIX</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Escaneie o QR Code ou cole o código</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Confirme o pagamento</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span>
                  <span>Aguarde a confirmação (geralmente instantâneo)</span>
                </li>
              </ol>
            </div>

            {/* Dev Mode: Botão para confirmar pagamento manualmente */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  🔧 Modo Desenvolvimento
                </p>
                <button
                  onClick={async () => {
                    try {
                      await api.post(`/orders/${orderId}/confirm-payment`);
                    } catch (error) {
                      console.error("Erro ao confirmar pagamento:", error);
                    }
                  }}
                  className="btn btn-sm btn-secondary w-full"
                >
                  Simular Confirmação de Pagamento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calcula o preço usando os dados do evento do carrinho
  const priceInfo = eventData
    ? getPriceBreakdown(
        eventData.pricePerPhoto,
        eventData.pricingPackages,
        eventData.allPhotosPrice,
      )
    : { totalPrice: 0, details: "Carregando preços..." };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Dados do Cliente
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`input ${errors.customerName ? "border-red-500" : ""}`}
                  placeholder="Seu nome completo"
                  disabled={isProcessing}
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customerName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customerEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className={`input ${errors.customerEmail ? "border-red-500" : ""}`}
                  placeholder="seu@email.com"
                  disabled={isProcessing}
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customerEmail}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enviaremos o link de pagamento e download para este email
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full flex items-center justify-center gap-2 mt-6"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Gerar Link de Pagamento</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Resumo do Pedido
            </h2>

            {/* Evento */}
            {eventData && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">Evento</p>
                <p className="text-lg font-semibold text-gray-900">
                  {eventData.eventName}
                </p>
              </div>
            )}

            {/* Fotos */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Fotos Selecionadas
              </p>
              <div className="grid grid-cols-4 gap-2">
                {items.slice(0, 8).map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.watermarkedUrl || photo.thumbnailUrl}
                    alt="Foto"
                    className="w-full h-16 object-cover rounded"
                  />
                ))}
              </div>
              {items.length > 8 && (
                <p className="text-sm text-gray-500 mt-2">
                  +{items.length - 8} fotos
                </p>
              )}
            </div>

            {/* Preço */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Quantidade:</span>
                <span className="font-medium">
                  {items.length} foto{items.length > 1 ? "s" : ""}
                </span>
              </div>

              {priceInfo.details && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Melhor opção:</span>
                  <span className="font-medium">{priceInfo.details}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-primary-600">
                  R$ {priceInfo.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Como funciona:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Você receberá um link de pagamento por email</li>
                <li>
                  Após o pagamento, as fotos ficarão disponíveis para download
                </li>
                <li>Downloads em alta resolução sem marca d'água</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
