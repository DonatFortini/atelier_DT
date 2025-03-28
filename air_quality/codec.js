// TTN V3 / ChirpStack V4 compatible decoder
function decodeUplink(input) {
    const { bytes, fPort: port } = input;

    const response = {
        data: {},
        warnings: [],
        errors: []
    };

    if (bytes.length < 7) {
        response.errors.push("Not enough bytes in payload");
        return response;
    }

    try {
        const pm25 = (bytes[0] << 8) | bytes[1];
        const pm10 = (bytes[2] << 8) | bytes[3];
        const aqiValue = (bytes[4] << 8) | bytes[5];
        const alertState = bytes[6];

        response.data = {
            pm25,
            pm10,
            aqiValue,
            alertState,
            alertPM25: Boolean(alertState & 1),
            alertPM10: Boolean(alertState & 2),
            alertAQI: Boolean(alertState & 4),
            airQualityStatus: getAirQualityStatus(alertState)
        };
    } catch (error) {
        response.errors.push(`Decoding failed: ${error.message}`);
    }

    return response;
}

function getAirQualityStatus(alertState) {
    if (alertState === 0) return "Good";
    if (alertState & 4) return "Very Poor";
    if ((alertState & 1) && (alertState & 2)) return "Poor";
    if ((alertState & 1) || (alertState & 2)) return "Moderate";
    return "Unknown";
}

// Legacy TTN V2 decoder
function Decoder(bytes, port) {
    return decodeUplink({ bytes, fPort: port }).data;
}
