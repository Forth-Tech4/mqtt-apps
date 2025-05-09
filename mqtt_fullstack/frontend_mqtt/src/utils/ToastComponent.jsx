// src/components/ToastComponent.js
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const DEFAULT_DURATION = 3000;

// Mapping toast types to progress bar colors
const progressBarClasses = {
  success: 'custom-progress-success',
  error: 'custom-progress-error',
  warn: 'custom-progress-warn',
  info: 'custom-progress-info',
};

export const showToast = (type, message, duration = DEFAULT_DURATION) => {
  toast[type](message, {
    position: 'top-right',
    autoClose: duration,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    icon: true,
    theme: 'light',
    toastClassName:
      '!rounded-md !shadow-md !p-4 !text-sm !font-medium !border-l-4',
    bodyClassName: '!text-gray-800',
    progressClassName: progressBarClasses[type] || '',
  });
};

export const ToastComponent = () => (
  <ToastContainer
    position="top-right"
    autoClose={DEFAULT_DURATION}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);
