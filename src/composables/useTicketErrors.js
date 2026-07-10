import Swal from "sweetalert2";
import { useI18n } from "vue-i18n";

export const TicketErrorCode = {
  TICKET_NOT_FOUND: 100,
  TICKET_ALREADY_ANNULLED: 101,
  AUTH_ERROR: 102,
  BODY_EMPTY: 103,
  CAJA_NOT_OPEN: 104,
  CESTA_NOT_FOUND: 105,
  CLIENT_MISSING_FOR_DISCOUNT: 106,
  INVALID_BASKET_MODE_FOR_DISCOUNT: 107,
  TICKET_ID_INVALID: 108,
  DATABASE_ERROR: 500,
  SERVER_CONN_ERROR: -4078,
};

export function useTicketErrors() {
  const { t } = useI18n();

  const alertConfigs = {
    [TicketErrorCode.TICKET_NOT_FOUND]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.ticket_not_found", "Ticket no encontrado"),
    },
    [TicketErrorCode.TICKET_ALREADY_ANNULLED]: {
      icon: "info",
      title: t("technical.already_annulled", "Ticket ya anulado"),
      text: t("technical.cannot_annul_twice", "Este ticket ya ha sido anulado anteriormente."),
    },
    [TicketErrorCode.AUTH_ERROR]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.auth_error", "Fallo de autenticación en la operación"),
    },
    [TicketErrorCode.BODY_EMPTY]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.body_empty", "El cuerpo de la solicitud está vacío"),
    },
    [TicketErrorCode.CAJA_NOT_OPEN]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.box_not_open", "La caja no está abierta"),
    },
    [TicketErrorCode.CESTA_NOT_FOUND]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.basket_not_found", "Cesta no encontrada"),
    },
    [TicketErrorCode.CLIENT_MISSING_FOR_DISCOUNT]: {
      icon: "warning",
      title: t("technical.warning", "Atención"),
      text: t("technical.client_missing_for_discount", "Falta cliente para aplicar el descuento"),
    },
    [TicketErrorCode.INVALID_BASKET_MODE_FOR_DISCOUNT]: {
      icon: "warning",
      title: t("technical.warning", "Atención"),
      text: t("technical.invalid_basket_mode_for_discount", "Modo de cesta inválido para aplicar el descuento"),
    },
    [TicketErrorCode.DATABASE_ERROR]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.db_error", "Error de base de datos en el servidor"),
    },
    [TicketErrorCode.SERVER_CONN_ERROR]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.server_conn_error", "Error de conexión con el servidor"),
    },
    [TicketErrorCode.TICKET_ID_INVALID]: {
      icon: "error",
      title: t("common.error", "Error"),
      text: t("technical.ticket_id_invalid", "El ID del ticket ha expirado, vuelva a intentarlo"),
    },
  };

  /**
   * Maneja el error de un ticket basándose en su código o en la respuesta del servidor.
   * @param {any} res - La respuesta del servidor o un código de error numérico.
   * @returns {boolean} - true si se ha manejado el error (mostrado alerta), false en caso contrario.
   */
  const handleTicketError = (res) => {
    if (res === undefined || res === null) return false;

    // Caso: res es un objeto { error: true, code: 103, ... } o similar
    const errorCode = res?.ticketErrorCode || res?.code;
    const config = alertConfigs[errorCode];

    if (config) {
      Swal.fire(config);
      return true;
    }

    // Fallback para otros errores con mensaje
    if (res?.error && res?.message) {
      Swal.fire({
        icon: "error",
        title: t("common.error", "Error"),
        text: res.message,
      });
      return true;
    }

    return false;
  };

  const getTicketErrorCode = (res) => {
    if (res === undefined || res === null) return null;
    return res?.ticketErrorCode || res?.code || null;
  };

  return {
    TicketErrorCode,
    alertConfigs,
    handleTicketError,
    getTicketErrorCode,
  };
}
