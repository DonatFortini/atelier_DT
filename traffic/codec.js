/*
* LORAWAN TRAFFIC LIGHT DECODER
* 
* This decoder handles data from a traffic light system with ultrasonic sensor
* The payload consists of:
* - 2 bytes: Distance (cm * 100) - not used in this implementation
* - 2 bytes: Speed (cm/s * 100)
* - 1 byte: LED state (0 = GREEN, 1 = RED)
*/

function Decoder(bytes, port) {
    var decoded = {};
    
    // Check if we have at least 5 bytes (2 for distance, 2 for speed, 1 for LED state)
    if (bytes.length < 5) {
        return decoded;
    }
    
    // Decode distance (first 2 bytes) - divide by 100 to get back to cm with 2 decimal places
    var distanceRaw = (bytes[0] << 8) | bytes[1];
    decoded.distance = distanceRaw / 100;
    
    // Decode speed (next 2 bytes) - divide by 100 to get back to cm/s with 2 decimal places
    var speedRaw = (bytes[2] << 8) | bytes[3];
    decoded.speed = speedRaw / 100;
    
    // Decode LED state (last byte)
    var ledState = bytes[4];
    decoded.ledState = ledState;
    decoded.ledColor = (ledState === 0) ? "GREEN" : "RED";
    
    // Add a human-readable status for visualization
    if (ledState === 1) {
        decoded.trafficStatus = "WARNING: Object approaching too fast";
    } else {
        decoded.trafficStatus = "Normal traffic flow";
    }
    
    return decoded;
}