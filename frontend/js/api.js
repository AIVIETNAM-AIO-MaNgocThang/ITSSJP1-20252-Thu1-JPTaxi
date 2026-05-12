/**
 * Client gọi REST backend JP Taxi (cùng origin khi chạy Spring Boot).
 * Base path mặc định: /api/v1
 */
(function () {
	const DEFAULT_BASE = "/api/v1";

	function joinUrl(base, path) {
		const b = base.endsWith("/") ? base.slice(0, -1) : base;
		const p = path.startsWith("/") ? path : "/" + path;
		return b + p;
	}

	window.JPTaxiApi = {
		basePath:
			(typeof window.__JPTAXI_API_BASE__ === "string" && window.__JPTAXI_API_BASE__) ||
			DEFAULT_BASE,

		setBasePath(path) {
			this.basePath = path || DEFAULT_BASE;
		},

		async health() {
			const res = await fetch(joinUrl(this.basePath, "/health"));
			if (!res.ok) {
				throw new Error(`health ${res.status}: ${await res.text()}`);
			}
			return res.json();
		},

		/**
		 * @param {Record<string, string|number|boolean>} params — latitude, longitude, radiusKm, ...
		 */
		async searchDrivers(params) {
			const q = new URLSearchParams();
			Object.entries(params || {}).forEach(([k, v]) => {
				if (v !== undefined && v !== null && v !== "") {
					q.append(k, String(v));
				}
			});
			const url = joinUrl(this.basePath, "/drivers/search") + "?" + q.toString();
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`searchDrivers ${res.status}: ${await res.text()}`);
			}
			return res.json();
		},

		/**
		 * Xác nhận đặt xe (pending → searching). Cần header X-Customer-Id (MVP).
		 * @param {number|string} requestId
		 * @param {number|string} customerId
		 * @param {{ actualPassengerName?: string, actualPassengerPhone?: string, noteToDriver?: string }} [payload]
		 */
		async confirmRideRequest(requestId, customerId, payload) {
			const url = joinUrl(this.basePath, `/ride-requests/${requestId}/confirm`);
			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Customer-Id": String(customerId),
				},
				body: JSON.stringify(payload || {}),
			});
			const text = await res.text();
			if (!res.ok) {
				throw new Error(`confirmRideRequest ${res.status}: ${text}`);
			}
			return text ? JSON.parse(text) : {};
		},
	};
})();
