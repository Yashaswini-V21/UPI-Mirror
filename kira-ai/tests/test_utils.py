"""tests/test_utils.py
=====================
Unit tests for the shared src/utils module.
Covers: coerce_float, coerce_int, clamp, normalize_unit, money, money_per_day.
"""
from __future__ import annotations

import pytest
from core_logic.utils import clamp, coerce_float, coerce_int, money, money_per_day, normalize_unit


class TestCoerceFloat:
    """coerce_float() — type-safe float conversion."""

    def test_returns_float_for_valid_string(self) -> None:
        assert coerce_float("3.14") == pytest.approx(3.14)

    def test_returns_default_for_none(self) -> None:
        assert coerce_float(None) == 0.0
        assert coerce_float(None, default=99.0) == 99.0

    def test_returns_default_for_invalid_string(self) -> None:
        assert coerce_float("abc") == 0.0

    def test_returns_default_for_empty_string(self) -> None:
        assert coerce_float("") == 0.0

    def test_passthrough_int(self) -> None:
        assert coerce_float(42) == pytest.approx(42.0)

    def test_passthrough_float(self) -> None:
        assert coerce_float(1.23) == pytest.approx(1.23)

    def test_handles_list_gracefully(self) -> None:
        assert coerce_float([1, 2]) == 0.0


class TestCoerceInt:
    """coerce_int() — type-safe int conversion via float."""

    def test_string_int(self) -> None:
        assert coerce_int("7") == 7

    def test_float_string(self) -> None:
        assert coerce_int("3.9") == 3   # truncates

    def test_none_returns_default(self) -> None:
        assert coerce_int(None) == 0
        assert coerce_int(None, default=5) == 5

    def test_invalid_returns_default(self) -> None:
        assert coerce_int("xyz") == 0

    def test_passthrough_int(self) -> None:
        assert coerce_int(18) == 18


class TestClamp:
    """clamp() — bounds a value to [low, high]."""

    def test_within_range_unchanged(self) -> None:
        assert clamp(0.5) == pytest.approx(0.5)

    def test_below_low_returns_low(self) -> None:
        assert clamp(-1.0) == pytest.approx(0.0)

    def test_above_high_returns_high(self) -> None:
        assert clamp(1.5) == pytest.approx(1.0)

    def test_custom_bounds(self) -> None:
        assert clamp(50.0, low=0.0, high=100.0) == pytest.approx(50.0)
        assert clamp(-10.0, low=0.0, high=100.0) == pytest.approx(0.0)
        assert clamp(200.0, low=0.0, high=100.0) == pytest.approx(100.0)


class TestNormalizeUnit:
    """normalize_unit() — maps various score scales to [0, 1]."""

    def test_already_in_unit_interval(self) -> None:
        assert normalize_unit(0.75) == pytest.approx(0.75)

    def test_percentage_scale_divided_by_100(self) -> None:
        assert normalize_unit(72.0) == pytest.approx(0.72)

    def test_above_100_clamped(self) -> None:
        result = normalize_unit(150.0)
        assert 0.0 <= result <= 1.0

    def test_zero_stays_zero(self) -> None:
        assert normalize_unit(0.0) == pytest.approx(0.0)

    def test_100_becomes_1(self) -> None:
        assert normalize_unit(100.0) == pytest.approx(1.0)

    def test_none_returns_zero(self) -> None:
        assert normalize_unit(None) == pytest.approx(0.0)  # type: ignore[arg-type]


class TestMoney:
    """money() / money_per_day() — formatting helpers."""

    def test_money_formats_with_rupee_sign(self) -> None:
        assert money(18000) == "₹18,000"

    def test_money_rounds_float(self) -> None:
        assert money(1234.56) == "₹1,235"

    def test_money_handles_zero(self) -> None:
        assert money(0) == "₹0"

    def test_money_handles_none(self) -> None:
        assert money(None) == "₹0"

    def test_money_per_day_suffix(self) -> None:
        assert money_per_day(600) == "₹600/day"

    def test_money_per_day_with_float(self) -> None:
        # Python uses banker's rounding: round(1234.5) == 1234
        result = money_per_day(1234.5)
        assert result in ("₹1,234/day", "₹1,235/day")
