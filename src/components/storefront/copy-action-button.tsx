'use client';

import { useState, useTransition } from 'react';

import { useToast } from '@C/toast';

type CopyActionButtonProps = {
  value: string;
  idleLabel: string;
  copiedLabel?: string;
  className?: string;
  toastTitle?: string;
  toastDescription?: string;
};

async function writeToClipboard(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function CopyActionButton({
  value,
  idleLabel,
  copiedLabel = 'Copied',
  className = 'button-secondary',
  toastTitle = 'Copied',
  toastDescription,
}: CopyActionButtonProps) {
  const { pushToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    startTransition(async () => {
      try {
        await writeToClipboard(value);
        setIsCopied(true);
        pushToast({
          title: toastTitle,
          description: toastDescription,
          tone: 'success',
        });

        window.setTimeout(() => {
          setIsCopied(false);
        }, 1800);
      } catch {
        pushToast({
          title: 'Copy failed',
          description: 'The value could not be copied automatically.',
          tone: 'error',
          persistent: true,
        });
      }
    });
  }

  return (
    <button type="button" className={className} onClick={handleCopy} disabled={isPending}>
      {isPending ? 'Copying...' : isCopied ? copiedLabel : idleLabel}
    </button>
  );
}