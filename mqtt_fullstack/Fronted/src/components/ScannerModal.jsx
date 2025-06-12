import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

export default function ScannerModal({ onClose, onScanSuccess }) {
  const scannerRef = useRef(null);
  const qrRegionId = "qr-reader";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices.length) {
          alert("No camera found");
          return onClose();
        }

        const backCamera = devices.find((d) =>
          d.label.toLowerCase().includes("back")
        );
        const cameraId = backCamera ? backCamera.id : devices[0].id;

        const qrScanner = new Html5Qrcode(qrRegionId);
        scannerRef.current = qrScanner;

        await qrScanner.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              if (data.mac && data.ssid && data.pass) {
                onScanSuccess(data);
                qrScanner.stop().then(() => {
                  scannerRef.current.clear();
                  onClose();
                });
              } else {
                alert("Invalid QR format. Required: mac, ssid, pass");
              }
            } catch {
              alert("QR does not contain valid JSON");
            }
          },
          () => {}
        );
      } catch (err) {
        alert("Error starting camera: " + err.message);
        onClose();
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => scannerRef.current.clear());
      }
    };
  }, [onClose, onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-lg relative max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-center mb-4 text-blue-700">
          Scan Device QR
        </h2>
        <div id={qrRegionId} className="w-full aspect-square rounded-lg border" />
      </div>
    </div>
  );
}
