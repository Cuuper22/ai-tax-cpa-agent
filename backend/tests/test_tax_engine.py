"""Tests for the tax calculation engine."""
from decimal import Decimal

import pytest

from app.tax_engine.tax_calculator import TaxCalculator, FilingStatus


@pytest.fixture
def calc():
    return TaxCalculator(tax_year=2024)


# ── Individual tax ─────────────────────────────────────────────

def test_single_filer_low_income(calc):
    """$30k single → standard deduction leaves $15,400 taxable."""
    result = calc.calculate_individual_tax(Decimal("30000"), "single")
    # $11,600 @ 10% = $1,160 + $3,800 @ 12% = $456 → $1,616
    assert abs(result["tax_liability"] - 1616.00) < 1


def test_single_filer_high_income(calc):
    """$150k single should hit the 24% bracket."""
    result = calc.calculate_individual_tax(Decimal("150000"), "single")
    assert result["tax_liability"] > 0
    assert result["effective_tax_rate"] > 15
    # Verify bracket breakdown exists and has multiple brackets
    assert len(result["bracket_breakdown"]) >= 3


def test_married_joint_deduction(calc):
    """Married joint standard deduction is $29,200 for 2024."""
    result = calc.calculate_individual_tax(Decimal("120000"), "married_joint")
    assert result["deduction_amount"] == 29200
    assert result["deduction_type"] == "Standard"


def test_head_of_household(calc):
    """Head of household standard deduction is $21,900."""
    result = calc.calculate_individual_tax(Decimal("80000"), "head_of_household")
    assert result["deduction_amount"] == 21900


def test_itemized_deductions_higher(calc):
    """Itemized > standard → use itemized."""
    result = calc.calculate_individual_tax(
        Decimal("100000"), "single", itemized_deductions=Decimal("25000")
    )
    assert result["deduction_type"] == "Itemized"
    assert result["deduction_amount"] == 25000


def test_itemized_deductions_lower(calc):
    """Itemized < standard → use standard."""
    result = calc.calculate_individual_tax(
        Decimal("100000"), "single", itemized_deductions=Decimal("5000")
    )
    assert result["deduction_type"] == "Standard"
    assert result["deduction_amount"] == 14600


def test_zero_income(calc):
    """Zero income → zero tax."""
    result = calc.calculate_individual_tax(Decimal("0"), "single")
    assert result["tax_liability"] == 0


def test_very_high_income(calc):
    """$1M single should hit the 37% bracket."""
    result = calc.calculate_individual_tax(Decimal("1000000"), "single")
    top_bracket = result["bracket_breakdown"][-1]
    assert top_bracket["rate"] == 37.0


# ── Corporate tax ──────────────────────────────────────────────

def test_corporate_flat_rate(calc):
    """Corporate tax is flat 21%."""
    result = calc.calculate_corporate_tax(Decimal("500000"))
    assert result["tax_liability"] == 105000.00
    assert result["tax_rate"] == 21.0


# ── Quarterly estimates ────────────────────────────────────────

def test_quarterly_payments(calc):
    """Quarterly payments divide remaining tax by 4."""
    result = calc.estimate_quarterly_payments(
        Decimal("100000"), "single", Decimal("5000")
    )
    assert len(result["payment_schedule"]) == 4
    # All four payments should be equal
    amounts = [p["amount"] for p in result["payment_schedule"]]
    assert len(set(amounts)) == 1


# ── Input validation ───────────────────────────────────────────

def test_negative_income_rejected(calc):
    with pytest.raises(ValueError, match="negative"):
        calc.calculate_individual_tax(Decimal("-1000"), "single")


def test_invalid_filing_status(calc):
    with pytest.raises(ValueError, match="Invalid filing status"):
        calc.calculate_individual_tax(Decimal("50000"), "invalid_status")


def test_negative_itemized_rejected(calc):
    with pytest.raises(ValueError, match="negative"):
        calc.calculate_individual_tax(
            Decimal("50000"), "single", itemized_deductions=Decimal("-100")
        )


def test_negative_corporate_rejected(calc):
    with pytest.raises(ValueError, match="negative"):
        calc.calculate_corporate_tax(Decimal("-1"))


def test_unsupported_tax_year():
    with pytest.raises(ValueError, match="2024"):
        TaxCalculator(tax_year=2023)


# ── Disclaimer ─────────────────────────────────────────────────

def test_disclaimer_in_individual(calc):
    result = calc.calculate_individual_tax(Decimal("75000"), "single")
    assert "disclaimer" in result
    assert "educational purposes" in result["disclaimer"].lower()


def test_disclaimer_in_corporate(calc):
    result = calc.calculate_corporate_tax(Decimal("100000"))
    assert "disclaimer" in result
