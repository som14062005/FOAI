// src/components/TripQRCode.jsx
import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { APP_CONFIG } from '../config';

const TripQRCode = ({ tripId, tripName }) => {
  const [showModal, setShowModal] = useState(false);
  
  // ✅ Get the correct URL for QR code (works on mobile)
  const getBaseUrl = () => {
    const hostname = window.location.hostname;
    
    // If on localhost, use local IP for mobile access
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${APP_CONFIG.LOCAL_IP}:${APP_CONFIG.FRONTEND_PORT}`;
    }
    
    return window.location.origin;
  };
  
  const liveMapUrl = `${getBaseUrl()}/live-map/${tripId}`;
  
  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-code-svg-${tripId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${tripName}-QR-Code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tripName} - Live Map`,
          text: 'Scan this QR code to access the live navigation map',
          url: liveMapUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(liveMapUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-lg transition"
        title="Show QR Code"
      >
        <Smartphone className="w-4 h-4" />
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="mb-4">
                <Smartphone className="w-12 h-12 mx-auto text-indigo-600 mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">Scan for Mobile Navigation</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Open the camera app on your phone and point it at this QR code
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 rounded-xl border-4 border-indigo-100 inline-block mb-4">
                <div id={`qr-code-svg-${tripId}`}>
                  <QRCode
                    value={liveMapUrl}
                    size={256}
                    level="H"
                  />
                </div>
              </div>

              {/* Trip Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">{tripName}</h3>
                <p className="text-xs text-gray-600 break-all">{liveMapUrl}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={shareQRCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-4 text-left bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">📱 How to use:</p>
                <ol className="text-xs text-blue-800 space-y-1">
                  <li>1. Open your phone&apos;s camera app</li>
                  <li>2. Point it at the QR code above</li>
                  <li>3. Tap the notification to open the link</li>
                  <li>4. Allow location access for navigation</li>
                  <li className="text-orange-600 font-semibold mt-2">
                    ⚠️ Phone and computer must be on same WiFi
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TripQRCode;
