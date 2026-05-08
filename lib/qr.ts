import QRCode from 'qrcode';

export const generateQR = async (text: string) => {
  try {
    // Generate a high-quality SVG or DataURL
    return await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1f2937', // A nice dark gray/blue
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error(err);
  }
};