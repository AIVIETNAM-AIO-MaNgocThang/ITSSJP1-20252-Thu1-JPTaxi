//api tính cước giá phí

exports.calculateEstimate = (req, res) => {
    const { startLat, startLng, endLat, endLng, vehicleType } = req.body;

    // Tính khoảng cách theo công thức đơn giản (km)
    const distance = Math.sqrt(Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)) * 111;
    
    // Thời gian dự kiến (30km/h)
    const time = Math.round((distance / 30) * 60);

    // Giá cước theo loại xe (Enum: 4, 7, 9)
    const rates = { "4": 12000, "7": 15000, "9": 20000 };
    const pricePerKm = rates[vehicleType] || 12000;
    const totalPrice = Math.round(distance * pricePerKm);

    res.json({
        distance_km: distance.toFixed(2),
        estimated_time_minutes: time,
        total_price: totalPrice,
        currency: "VND"
    });
};