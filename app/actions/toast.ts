export enum ToastKeys {
  ADD_TOAST = 'ADD_TOAST',
  REMOVE_TOAST = 'REMOVE_TOAST',
}

export interface ToastType {
  type: string;
  payload: ToastContentType;
}

export interface ToastContentType {
  id: string;
  message: string;
}

export function addToast(payload: ToastContentType) {
  return {
    type: ToastKeys.ADD_TOAST,
    payload,
  };
}

export function removeToast(payload: string) {
  return {
    type: ToastKeys.REMOVE_TOAST,
    payload,
  };
}

export default {
  addToast,
  removeToast,
};
