import pytest
from app.services.sales_rent_calculator import calculate_fields

def test_total_sales_basic():
    result = calculate_fields(brokerage_fee=100000, ad_fee=50000, payment_fee=20000)
    assert result["total_sales"] == 130000

def test_total_sales_negative():
    """支払手数料が大きい場合はマイナスになる"""
    result = calculate_fields(brokerage_fee=0, ad_fee=0, payment_fee=50000)
    assert result["total_sales"] == -50000

def test_fee_calculation_defaults_to_zero_when_tbd():
    """fee_calculation は TBD のため 0 を返す"""
    result = calculate_fields(brokerage_fee=100000, ad_fee=0, payment_fee=0)
    assert result["fee_calculation"] == 0

def test_ad_calculation_defaults_to_zero_when_tbd():
    result = calculate_fields(brokerage_fee=0, ad_fee=200000, payment_fee=0)
    assert result["ad_calculation"] == 0

def test_total_summary_equals_total_sales_when_tbd():
    """total_summary は TBD のため total_sales と同じ値を返す"""
    result = calculate_fields(brokerage_fee=100000, ad_fee=50000, payment_fee=20000)
    assert result["total_summary"] == result["total_sales"]
