import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ConfigForm() {
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  
  const html5QrCodeRef = useRef(null);
  const isComponentMounted = useRef(true);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(false);
      setScannerReady(false);
      
      // Wait a bit to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if the DOM element exists
      const element = document.getElementById("qr-reader");
      if (!element) {
        throw new Error("Scanner element not found in DOM");
      }
      
      // Clean up any existing scanner
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.getState() === 2) { // SCANNING state
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (cleanupError) {
          console.warn("Cleanup warning:", cleanupError.message);
        }
        html5QrCodeRef.current = null;
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false
      };

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        throw new Error("No cameras found on this device");
      }

      // Try to use back camera first, fallback to first available
      let cameraId = devices[0].id;
      const backCamera = devices.find(device => {
        const label = device.label || '';
        return label.toLowerCase().includes('back') || 
               label.toLowerCase().includes('rear') ||
               label.toLowerCase().includes('environment');
      });
      
      if (backCamera) {
        cameraId = backCamera.id;
      }

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          if (!isComponentMounted.current) return;
          
          console.log("QR Code detected:", decodedText);
          
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(decodedText);
            setScannedData({ type: 'json', data: parsed, raw: decodedText });
          } catch (e) {
            // If not JSON, treat as plain text
            setScannedData({ type: 'text', data: decodedText, raw: decodedText });
          }
          
          // Stop scanner after successful scan
          if (html5QrCode.getState() === 2) { // Only stop if scanning
            html5QrCode.stop().catch(console.warn);
          }
          setIsScanning(false);
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen continuously while scanning)
        }
      );

      setScannerReady(true);
      setIsScanning(true);
      setCameraPermissionDenied(false);

    } catch (err) {
      console.error("Scanner error:", err);
      setIsScanning(false);
      setScannerReady(false);
      
      if (err.name === 'NotAllowedError' || (err.message && err.message.includes('Permission denied'))) {
        setCameraPermissionDenied(true);
        setError("Camera permission denied. Please allow camera access and try again.");
      } else if (err.message && err.message.includes('No cameras found')) {
        setError("No cameras found on this device.");
      } else {
        setError(`Scanner error: ${err.message || 'Unknown error occurred'}`);
      }
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        // Check if scanner is actually running before stopping
        if (html5QrCodeRef.current.getState() === 2) { // SCANNING state
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setScannerReady(false);
    } catch (err) {
      console.warn("Error stopping scanner:", err.message);
      // Force cleanup even if stop fails
      html5QrCodeRef.current = null;
      setIsScanning(false);
      setScannerReady(false);
    }
  };

  const resetScanner = async () => {
    setScannedData(null);
    setError(null);
    setCameraPermissionDenied(false);
    
    // Stop current scanner first
    await stopScanner();
    
    // Small delay before restarting
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  useEffect(() => {
    isComponentMounted.current = true;
    startScanner();

    return () => {
      isComponentMounted.current = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Render scanned data details
  const renderScannedDetails = (data) => {
    if (data.type === 'json') {
      const jsonData = data.data;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-green-700">JSON Data Detected</h3>
          </div>
          
          {Object.entries(jsonData).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <div className="text-gray-800">
                {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="break-all">{String(value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-blue-700">Text Data Detected</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Scanned Content
            </label>
            <div className="text-gray-800 whitespace-pre-wrap break-all font-mono text-sm">
              {data.data}
            </div>
          </div>
          
          {(data.data.startsWith('http://') || data.data.startsWith('https://')) && (
            <div className="mt-3">
              <a 
                href={data.data} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Open Link
              </a>
            </div>
          )}
        </div>
      );
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Scanner Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={resetScanner}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Scanned data display
  if (scannedData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Scan Results</h2>
              <button
                onClick={resetScanner}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Scan Again
              </button>
            </div>
            
            {renderScannedDetails(scannedData)}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-600 hover:text-gray-800">
                  Show Raw Data
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                    {scannedData.raw}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Scanner interface
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Camera className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">QR Code Scanner</h1>
          <p className="text-gray-300">Position the QR code within the frame</p>
        </div>

        <div className="relative bg-white p-4 rounded-lg shadow-lg">
          <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-lg border-2 border-gray-200">
            <div id="qr-reader" className="w-full h-full" />
            
            {/* Scanning overlay */}
            <div className="absolute inset-4 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
            
            {/* Status indicator */}
            {!scannerReady && isScanning && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${scannerReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                {scannerReady ? 'Scanner Ready' : 'Starting Camera...'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={resetScanner}
            disabled={!scannerReady}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Restart Scanner
          </button>
        </div>
      </div>
    </div>
  );
}