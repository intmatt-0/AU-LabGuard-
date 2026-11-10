/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

export async function generateQRCodeDataUrl(
  text: string,
  options?: { width?: number; margin?: number }
): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: options?.width ?? 280,
    margin: options?.margin ?? 2,
    color: {
      dark: '#003087', // Arellano University Malabon Blue
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}
