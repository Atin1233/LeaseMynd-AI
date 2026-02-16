/**
 * Toast notification hook for consistent error/success messaging
 * Uses Sonner for toast notifications
 */

import { toast } from "sonner";

export function useToast() {
  return {
    success: (message: string, descriptionOrOptions?: string | { description?: string }) => {
      const description = typeof descriptionOrOptions === 'string' 
        ? descriptionOrOptions 
        : descriptionOrOptions?.description;
      const options: { description?: string; duration: number } = {
        duration: 3000,
      };
      if (description) {
        options.description = description;
      }
      toast.success(message, options);
    },
    error: (message: string, descriptionOrOptions?: string | { description?: string }) => {
      const description = typeof descriptionOrOptions === 'string' 
        ? descriptionOrOptions 
        : descriptionOrOptions?.description;
      const options: { description?: string; duration: number } = {
        duration: 5000,
      };
      if (description) {
        options.description = description;
      }
      toast.error(message, options);
    },
    info: (message: string, descriptionOrOptions?: string | { description?: string }) => {
      const description = typeof descriptionOrOptions === 'string' 
        ? descriptionOrOptions 
        : descriptionOrOptions?.description;
      const options: { description?: string; duration: number } = {
        duration: 3000,
      };
      if (description) {
        options.description = description;
      }
      toast.info(message, options);
    },
    warning: (message: string, descriptionOrOptions?: string | { description?: string }) => {
      const description = typeof descriptionOrOptions === 'string' 
        ? descriptionOrOptions 
        : descriptionOrOptions?.description;
      const options: { description?: string; duration: number } = {
        duration: 4000,
      };
      if (description) {
        options.description = description;
      }
      toast.warning(message, options);
    },
    loading: (message: string) => {
      return toast.loading(message);
    },
    promise: <T,>(
        promise: Promise<T>,
        {
          loading,
          success,
          error,
        }: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((error: Error) => string);
        }
      ) => {
      return toast.promise(promise, {
        loading,
        success,
        error,
      });
    },
  };
}
