function decodeUplink(input) {
    const bytes = input.bytes;
    const port = input.fPort;
    
    const response = {
        data: {},
        warnings: [],
        errors: []
    };
    
    if (bytes.length < 17) {
        response.errors.push("Not enough bytes in payload");
        return response;
    }
    
    try {
        // Fonction pour convertir 4 octets en float
        function bytesToFloat(bytes, startIndex) {
            // Crée un ArrayBuffer de 4 octets
            const buffer = new ArrayBuffer(4);
            // Crée une vue sur ce buffer comme un tableau d'octets
            const byteView = new Uint8Array(buffer);
            // Copie les octets dans le buffer
            for (let i = 0; i < 4; i++) {
                byteView[i] = bytes[startIndex + i];
            }
            // Interprète le buffer comme un float
            const floatView = new Float32Array(buffer);
            return floatView[0];
        }
        
        // Décode les valeurs
        response.data.temperature = bytesToFloat(bytes, 0);
        response.data.pressure = bytesToFloat(bytes, 4);
        response.data.humidity = bytesToFloat(bytes, 8);
        response.data.altitude = bytesToFloat(bytes, 12);
        
        // Décode l'état d'alerte
        const alertState = bytes[16];
        response.data.alertState = alertState;
        
        // Interprétation de l'état d'alerte
        switch (alertState) {
            case 0x01:
                response.data.alertMessage = "Temperature Alert";
                break;
            case 0x02:
                response.data.alertMessage = "Humidity Alert";
                break;
            case 0x03:
                response.data.alertMessage = "Pressure Alert";
                break;
            case 0x05:
                response.data.alertMessage = "Altitude Alert";
                break;
            case 0x06:
                response.data.alertMessage = "Multiple Alerts";
                break;
            default:
                response.data.alertMessage = "No Alert";
        }
        
    } catch (error) {
        response.errors.push("Decoding failed: " + error.message);
    }
    
    return response;
}