def calculate_fields(
    brokerage_fee: int,
    ad_fee: int,
    payment_fee: int,
) -> dict[str, int]:
    """
    計算フィールドを計算して返す。
    fee_calculation, ad_calculation, total_summary の式は
    業務ルール確認後に更新すること（現在は TBD）。
    """
    total_sales = brokerage_fee + ad_fee - payment_fee
    # TBD: 業務ルール確認後に実装
    fee_calculation = 0
    ad_calculation = 0
    total_summary = total_sales  # TBD

    return {
        "total_sales": total_sales,
        "fee_calculation": fee_calculation,
        "ad_calculation": ad_calculation,
        "total_summary": total_summary,
    }
