import { Toast } from '@base-ui/react/toast';
import { useEffect } from 'react';
import { consumeFlashToast } from '~/lib/ui/flash-toast';

export function FlashToast() {
  return (
    <Toast.Provider>
      <FlashToastInner />
    </Toast.Provider>
  );
}

function FlashToastInner() {
  const { toasts, add } = Toast.useToastManager();

  useEffect(() => {
    const payload = consumeFlashToast();
    if (!payload) return;
    add(payload);
  }, [add]);

  return (
    <Toast.Viewport className="fixed bottom-6 right-6 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          className="xds-material-modal corner-squircle flex items-start gap-3 rounded-[24px] p-4"
        >
          <div className="flex-1">
            <Toast.Title className="text-body-sm font-semibold text-fg">
              {toast.title}
            </Toast.Title>
            {toast.description ? (
              <Toast.Description className="mt-0.5 text-body-sm text-fg-muted">
                {toast.description}
              </Toast.Description>
            ) : null}
          </div>
          <Toast.Close
            aria-label="Dismiss notification"
            className="inline-flex h-6 w-6 items-center justify-center rounded-[12px] text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
          >
            ×
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}
