/*
* LORAWAN PARKING SENSOR DECODER
* 
* This decoder handles data from a smart parking system with ultrasonic sensor
* The payload consists of:
* - 2 bytes: Occupancy time (seconds)
* - 1 byte: Parking state (0 = FREE, 1 = OCCUPIED)
*/

// Modern format for TTN V3, ChirpStack V4, and other platforms
function decodeUplink(input) {
    var bytes = input.bytes;
    var port = input.fPort;
    var decoded = {};
    
    // Check if we have at least 3 bytes (2 for occupancy time, 1 for parking state)
    if (bytes.length < 3) {
        return {
            data: {},
            warnings: ["Payload too short"],
            errors: ["Expected at least 3 bytes"]
        };
    }
    
    // Decode occupancy time (first 2 bytes) - time in seconds
    var occupancyTime = (bytes[0] << 8) | bytes[1];
    decoded.occupancyTime = occupancyTime;
    
    // Format as human-readable duration if occupied for more than a minute
    if (occupancyTime >= 60) {
        var hours = Math.floor(occupancyTime / 3600);
        var minutes = Math.floor((occupancyTime % 3600) / 60);
        var seconds = occupancyTime % 60;
        
        decoded.formattedOccupancyTime = '';
        if (hours > 0) {
            decoded.formattedOccupancyTime += hours + 'h ';
        }
        if (minutes > 0 || hours > 0) {
            decoded.formattedOccupancyTime += minutes + 'm ';
        }
        decoded.formattedOccupancyTime += seconds + 's';
    } else {
        decoded.formattedOccupancyTime = occupancyTime + 's';
    }
    
    // Decode parking state (last byte)
    var parkingState = bytes[2];
    decoded.parkingState = parkingState;
    decoded.parkingStatus = (parkingState === 0) ? "FREE" : "OCCUPIED";
    
    // Add timestamp for when the message was received
    decoded.timestamp = new Date().toISOString();
    
    return {
        data: decoded,
        warnings: [],
        errors: []
    };
}

// Keep the old format for backward compatibility
function Decoder(bytes, port) {
    var decoded = {};
    
    // Check if we have at least 3 bytes (2 for occupancy time, 1 for parking state)
    if (bytes.length < 3) {
        return decoded;
    }
    
    // Decode occupancy time (first 2 bytes) - time in seconds
    var occupancyTime = (bytes[0] << 8) | bytes[1];
    decoded.occupancyTime = occupancyTime;
    
    // Format as human-readable duration if occupied for more than a minute
    if (occupancyTime >= 60) {
        var hours = Math.floor(occupancyTime / 3600);
        var minutes = Math.floor((occupancyTime % 3600) / 60);
        var seconds = occupancyTime % 60;
        
        decoded.formattedOccupancyTime = '';
        if (hours > 0) {
            decoded.formattedOccupancyTime += hours + 'h ';
        }
        if (minutes > 0 || hours > 0) {
            decoded.formattedOccupancyTime += minutes + 'm ';
        }
        decoded.formattedOccupancyTime += seconds + 's';
    } else {
        decoded.formattedOccupancyTime = occupancyTime + 's';
    }
    
    // Decode parking state (last byte)
    var parkingState = bytes[2];
    decoded.parkingState = parkingState;
    decoded.parkingStatus = (parkingState === 0) ? "FREE" : "OCCUPIED";
    
    // Add timestamp for when the message was received
    decoded.timestamp = new Date().toISOString();
    
    return decoded;
}