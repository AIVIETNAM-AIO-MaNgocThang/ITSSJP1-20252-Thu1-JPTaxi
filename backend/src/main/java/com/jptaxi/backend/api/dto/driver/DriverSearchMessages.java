package com.jptaxi.backend.api.dto.driver;

/**
 * Nội dung thông báo cố định (JA/VI) cho API tìm tài xế.
 */
public final class DriverSearchMessages {

	private DriverSearchMessages() {
	}

	public static String pageOutOfRangeJa() {
		return "このページには結果がありません。ページ番号を確認してください。";
	}

	public static String pageOutOfRangeVi() {
		return "Không có kết quả trên trang này. Vui lòng kiểm tra số trang.";
	}

	public static String filtersTooStrictJa() {
		return "この条件に合うドライバーが見つかりません。検索条件を緩めるか、時間をおいて再度お試しください。";
	}

	public static String filtersTooStrictVi() {
		return "Không có tài xế phù hợp với bộ lọc. Hãy nới lỏng điều kiện hoặc thử lại sau.";
	}

	public static String outOfRadiusJa() {
		return "現在地の周辺に対応可能なドライバーがいません。地図上の位置や検索半径を調整してください。";
	}

	public static String outOfRadiusVi() {
		return "Không có tài xế trong bán kính hiện tại. Hãy điều chỉnh vị trí hoặc mở rộng bán kính tìm kiếm.";
	}

	public static String noActiveDriversJa() {
		return "現在、利用可能なドライバーが見つかりません。しばらくしてから再度お試しください。";
	}

	public static String noActiveDriversVi() {
		return "Hiện không có tài xế khả dụng (đã duyệt và có vị trí gần đây). Vui lòng thử lại sau.";
	}
}
